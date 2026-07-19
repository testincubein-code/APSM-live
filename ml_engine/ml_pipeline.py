"""
Standalone schema-agnostic ML pipeline for analytics prediction and suggestions.

Expected environment variables:
    MONGODB_URI        MongoDB connection string.
    MONGODB_DB         Database name. Defaults to "test".
    MONGODB_COLLECTION Collection name. Defaults to "analyticssnapshots".

All model binaries are saved inside ml_engine/ml_models/.
"""

from __future__ import annotations

import copy
import itertools
import logging
import os
import pickle
import re
import warnings
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, Tuple

try:
    import numpy as np
    import pandas as pd
    from pymongo import MongoClient
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.impute import SimpleImputer
    from sklearn.metrics import mean_absolute_error, r2_score
    from sklearn.model_selection import train_test_split
    from sklearn.multioutput import MultiOutputRegressor
    from sklearn.preprocessing import LabelEncoder, StandardScaler
except ImportError as exc:
    raise ImportError(
        "Missing ML pipeline dependency. Install required packages with: "
        "pip install pandas numpy pymongo scikit-learn"
    ) from exc


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "ml_models")
os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_PATH = os.path.join(MODEL_DIR, "multi_output_random_forest.pkl")
PREPROCESSOR_PATH = os.path.join(MODEL_DIR, "preprocessor.pkl")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.pkl")

MONGODB_URI = os.getenv("MONGODB_URI", "")
DATABASE_NAME = os.getenv("MONGODB_DB", "test")
COLLECTION_NAME = os.getenv("MONGODB_COLLECTION", "analyticssnapshots")

DEFAULT_TARGET_HINTS = [
    "views",
    "viewCount",
    "likes",
    "comments",
    "shares",
    "impressions",
    "reach",
    "profileViews",
    "totalEngagement",
    "engagementRate",
    "averageViewDuration",
    "averageViewPercentage",
    "estimatedMinutesWatched",
    "subscribersGained",
    "subscribersLost",
    "followers",
    "subscriberCount",
    "videoCount",
    "performance_score",
    "performanceScore",
]

INTERNAL_FIELD_PATTERNS = [
    r"(^|\.|_)_id$",
    r"(^|\.|__)__v$",
    r"etag$",
    r"thumbnail",
    r"\.url$",
    r"customUrl$",
]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("ml_pipeline")


def get_collection(
    mongo_uri: Optional[str] = None,
    database_name: Optional[str] = None,
    collection_name: Optional[str] = None,
):
    """Connect to MongoDB and return the configured collection."""
    uri = mongo_uri or MONGODB_URI
    db_name = database_name or DATABASE_NAME
    coll_name = collection_name or COLLECTION_NAME

    if not uri:
        raise ValueError("MongoDB URI is missing. Set MONGODB_URI or pass mongo_uri.")

    client = MongoClient(uri, serverSelectionTimeoutMS=15000)
    client.admin.command("ping")
    logger.info("Connected to MongoDB database=%s collection=%s", db_name, coll_name)
    return client[db_name][coll_name]


def flatten_documents(documents: Iterable[Dict[str, Any]]) -> pd.DataFrame:
    """Flatten nested MongoDB documents into a training-friendly DataFrame."""
    docs = list(documents)
    if not docs:
        return pd.DataFrame()

    for doc in docs:
        doc["_mongo_id"] = doc.get("_id")

    df = pd.json_normalize(docs, sep=".")
    df = expand_youtube_analytics_rows(df)
    return df


def expand_youtube_analytics_rows(df: pd.DataFrame) -> pd.DataFrame:
    """
    Convert YouTube analytics result-table rows into aggregate numeric columns.

    Atlas documents often store rows as arrays with separate columnHeaders. This
    keeps the pipeline schema-agnostic while still learning from those metrics.
    """
    prefix = "rawPlatformData.analyticsReports.daily"
    headers_col = f"{prefix}.columnHeaders"
    rows_col = f"{prefix}.rows"

    if headers_col not in df.columns or rows_col not in df.columns:
        return df

    aggregate_rows: List[Dict[str, Any]] = []
    for _, row in df.iterrows():
        aggregates: Dict[str, Any] = {}
        try:
            headers = row.get(headers_col) or []
            rows = row.get(rows_col) or []
            names = [header.get("name") for header in headers if isinstance(header, dict)]

            if not names or not rows:
                aggregate_rows.append(aggregates)
                continue

            report_df = pd.DataFrame(rows, columns=names)
            for column in report_df.columns:
                if column == "day":
                    continue
                numeric_values = pd.to_numeric(report_df[column], errors="coerce")
                if numeric_values.notna().any():
                    base = f"analytics_daily.{column}"
                    aggregates[f"{base}.sum"] = float(numeric_values.sum())
                    aggregates[f"{base}.mean"] = float(numeric_values.mean())
                    aggregates[f"{base}.max"] = float(numeric_values.max())
        except Exception as exc:
            logger.warning("Could not expand analytics rows: %s", exc)
        aggregate_rows.append(aggregates)

    expanded = pd.DataFrame(aggregate_rows)
    if expanded.empty:
        return df

    return pd.concat([df.reset_index(drop=True), expanded.reset_index(drop=True)], axis=1)


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Drop internal/noisy fields and normalize simple values."""
    cleaned = df.copy()
    drop_columns = []

    for column in cleaned.columns:
        if any(re.search(pattern, column, re.IGNORECASE) for pattern in INTERNAL_FIELD_PATTERNS):
            drop_columns.append(column)
        elif cleaned[column].apply(lambda value: isinstance(value, (dict, list, tuple))).any():
            drop_columns.append(column)

    cleaned = cleaned.drop(columns=sorted(set(drop_columns)), errors="ignore")

    for column in cleaned.columns:
        if cleaned[column].dtype == "object":
            cleaned[column] = cleaned[column].apply(convert_object_value)

    cleaned = add_time_features(cleaned)
    cleaned = cleaned.replace([np.inf, -np.inf], np.nan)
    return cleaned


def convert_object_value(value: Any) -> Any:
    """Convert ObjectId/dates/numeric strings into ML-friendly values."""
    if value is None:
        return np.nan

    if isinstance(value, datetime):
        return value.isoformat()

    text = str(value)
    if text.lower() in {"none", "null", "nan", ""}:
        return np.nan

    numeric = pd.to_numeric(text, errors="coerce")
    if not pd.isna(numeric) and re.fullmatch(r"[-+]?\d+(\.\d+)?", text.strip()):
        return float(numeric)

    return text


def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """Detect posting/date columns and derive useful temporal features."""
    output = df.copy()
    candidate_columns = [
        column
        for column in output.columns
        if any(token in column.lower() for token in ["posting_time", "publishedat", "snapshotdate", "createdat", "updatedat", "date", "time"])
    ]

    for column in candidate_columns:
        try:
            parsed = pd.to_datetime(output[column], errors="coerce", utc=True)
            if parsed.notna().any():
                safe_name = re.sub(r"[^a-zA-Z0-9]+", "_", column).strip("_")
                output[f"{safe_name}_hour"] = parsed.dt.hour
                output[f"{safe_name}_dayofweek"] = parsed.dt.dayofweek
                output[f"{safe_name}_month"] = parsed.dt.month

                if "posting_time" in column.lower() and "posting_hour" not in output.columns:
                    output["posting_hour"] = parsed.dt.hour
        except Exception as exc:
            logger.warning("Could not derive time features for %s: %s", column, exc)

    return output


def identify_target_columns(df: pd.DataFrame) -> List[str]:
    """Pick numeric target columns using metric-like names and sensible fallbacks."""
    numeric_columns = [
        column for column in df.columns if pd.to_numeric(df[column], errors="coerce").notna().any()
    ]

    targets = []
    for column in numeric_columns:
        lowered = column.lower()
        if any(hint.lower() in lowered for hint in DEFAULT_TARGET_HINTS):
            targets.append(column)

    targets = [column for column in targets if df[column].nunique(dropna=True) >= 1]

    if not targets:
        fallback_candidates = [
            column
            for column in numeric_columns
            if not any(token in column.lower() for token in ["hour", "dayofweek", "month", "spend", "cpc"])
        ]
        targets = fallback_candidates[-min(3, len(fallback_candidates)) :]

    return sorted(set(targets))


def build_performance_score(df: pd.DataFrame, targets: List[str]) -> Tuple[pd.DataFrame, List[str]]:
    """Create a composite performance score when raw engagement metrics exist."""
    output = df.copy()
    weighted_hints = {
        "views": 0.25,
        "viewcount": 0.25,
        "impressions": 0.15,
        "reach": 0.15,
        "likes": 0.2,
        "comments": 0.15,
        "shares": 0.15,
        "totalengagement": 0.25,
        "subscribersgained": 0.2,
    }

    score_parts = []
    for column in targets:
        lowered = re.sub(r"[^a-z0-9]", "", column.lower())
        weight = next((w for hint, w in weighted_hints.items() if hint in lowered), None)
        if weight is None:
            continue
        values = pd.to_numeric(output[column], errors="coerce").fillna(0)
        if values.max() > values.min():
            values = (values - values.min()) / (values.max() - values.min())
        score_parts.append(values * weight)

    if score_parts and "performance_score" not in output.columns:
        output["performance_score"] = np.sum(score_parts, axis=0) * 100
        targets = sorted(set(targets + ["performance_score"]))

    return output, targets


def split_feature_types(df: pd.DataFrame, target_columns: List[str]) -> Tuple[List[str], List[str]]:
    """Dynamically split feature columns into categorical and numeric lists."""
    feature_columns = [column for column in df.columns if column not in target_columns and column != "_mongo_id"]
    numeric_features = []
    categorical_features = []

    for column in feature_columns:
        numeric_series = pd.to_numeric(df[column], errors="coerce")
        if numeric_series.notna().mean() >= 0.8:
            numeric_features.append(column)
        else:
            categorical_features.append(column)

    return categorical_features, numeric_features


def fit_preprocessor(
    df: pd.DataFrame,
    categorical_features: List[str],
    numeric_features: List[str],
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Fit label encoders, imputers, and scaler, then return transformed features."""
    transformed = pd.DataFrame(index=df.index)
    label_encoders: Dict[str, LabelEncoder] = {}

    try:
        for column in categorical_features:
            values = df[column].fillna("unknown").astype(str)
            encoder = LabelEncoder()
            transformed[column] = encoder.fit_transform(values)
            label_encoders[column] = encoder
    except Exception as exc:
        logger.exception("Categorical transformation failed: %s", exc)

    numeric_imputer = SimpleImputer(strategy="median")
    scaler = StandardScaler()
    numeric_values = pd.DataFrame(index=df.index)

    try:
        if numeric_features:
            numeric_values = df[numeric_features].apply(pd.to_numeric, errors="coerce")
            imputed = numeric_imputer.fit_transform(numeric_values)
            scaled = scaler.fit_transform(imputed)
            transformed[numeric_features] = scaled
    except Exception as exc:
        logger.exception("Numeric transformation failed: %s", exc)

    preprocessor = {
        "categorical_features": categorical_features,
        "numeric_features": numeric_features,
        "label_encoders": label_encoders,
        "numeric_imputer": numeric_imputer,
        "scaler": scaler,
        "feature_columns": list(transformed.columns),
    }
    return transformed, preprocessor


def transform_features(input_df: pd.DataFrame, preprocessor: Dict[str, Any]) -> pd.DataFrame:
    """Transform new data using saved preprocessing artifacts."""
    df = clean_dataframe(input_df)
    transformed = pd.DataFrame(index=df.index)

    for column in preprocessor["categorical_features"]:
        encoder = preprocessor["label_encoders"].get(column)
        values = df[column].fillna("unknown").astype(str) if column in df.columns else pd.Series(["unknown"] * len(df))
        known_classes = set(encoder.classes_) if encoder is not None else set()
        values = values.apply(lambda value: value if value in known_classes else "unknown")

        if encoder is not None and "unknown" not in known_classes:
            encoder_classes = np.append(encoder.classes_, "unknown")
            encoder.classes_ = encoder_classes

        transformed[column] = encoder.transform(values) if encoder is not None else 0

    numeric_features = preprocessor["numeric_features"]
    if numeric_features:
        numeric_df = pd.DataFrame(index=df.index)
        for column in numeric_features:
            numeric_df[column] = pd.to_numeric(df[column], errors="coerce") if column in df.columns else np.nan
        imputed = preprocessor["numeric_imputer"].transform(numeric_df)
        scaled = preprocessor["scaler"].transform(imputed)
        transformed[numeric_features] = scaled

    return transformed.reindex(columns=preprocessor["feature_columns"], fill_value=0)


def load_training_data(
    mongo_uri: Optional[str] = None,
    database_name: Optional[str] = None,
    collection_name: Optional[str] = None,
    limit: int = 5000,
) -> pd.DataFrame:
    """Fetch and flatten MongoDB data."""
    collection = get_collection(mongo_uri, database_name, collection_name)
    documents = list(collection.find({}).limit(limit))
    logger.info("Fetched %s documents", len(documents))
    return flatten_documents(documents)


def train_model(
    mongo_uri: Optional[str] = None,
    database_name: Optional[str] = None,
    collection_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Train and persist an optimized Multi-Output Random Forest model."""
    try:
        raw_df = load_training_data(mongo_uri, database_name, collection_name)
        if raw_df.empty:
            raise ValueError("No documents found for training.")

        df = clean_dataframe(raw_df)
        target_columns = identify_target_columns(df)
        if not target_columns:
            raise ValueError("No numeric target columns detected.")

        df, target_columns = build_performance_score(df, target_columns)
        categorical_features, numeric_features = split_feature_types(df, target_columns)

        target_df = df[target_columns].apply(pd.to_numeric, errors="coerce")
        usable_rows = target_df.notna().any(axis=1)
        df = df.loc[usable_rows].reset_index(drop=True)
        target_df = target_df.loc[usable_rows].fillna(0).reset_index(drop=True)

        if len(df) < 2:
            raise ValueError("At least two usable training rows are required.")

        feature_df, preprocessor = fit_preprocessor(df, categorical_features, numeric_features)

        model = MultiOutputRegressor(
            RandomForestRegressor(
                n_estimators=200,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=1,
                random_state=42,
                n_jobs=-1,
            )
        )

        metrics: Dict[str, Any] = {}
        try:
            if len(df) >= 8:
                x_train, x_test, y_train, y_test = train_test_split(
                    feature_df,
                    target_df,
                    test_size=0.2,
                    random_state=42,
                )
                model.fit(x_train, y_train)
                predictions = model.predict(x_test)
                metrics["mean_absolute_error"] = float(mean_absolute_error(y_test, predictions))
                metrics["r2_score"] = float(r2_score(y_test, predictions, multioutput="variance_weighted"))
            else:
                model.fit(feature_df, target_df)
                metrics["training_note"] = "Small dataset; trained on all rows without validation split."
        except Exception as exc:
            logger.exception("Model fitting/evaluation block failed: %s", exc)
            model.fit(feature_df, target_df)
            metrics["training_note"] = "Fallback fit completed after validation failure."

        metadata = {
            "trained_at": datetime.utcnow().isoformat(),
            "database_name": database_name or DATABASE_NAME,
            "collection_name": collection_name or COLLECTION_NAME,
            "target_columns": target_columns,
            "categorical_features": categorical_features,
            "numeric_features": numeric_features,
            "document_count": len(df),
            "metrics": metrics,
        }

        save_pickle(model, MODEL_PATH)
        save_pickle(preprocessor, PREPROCESSOR_PATH)
        save_pickle(metadata, METADATA_PATH)

        logger.info("Saved model to %s", MODEL_PATH)
        logger.info("Detected targets: %s", target_columns)
        return metadata
    except Exception as exc:
        logger.exception("Training failed: %s", exc)
        raise


def save_pickle(value: Any, path: str) -> None:
    with open(path, "wb") as file:
        pickle.dump(value, file)


def load_pickle(path: str) -> Any:
    with open(path, "rb") as file:
        return pickle.load(file)


def load_artifacts() -> Tuple[MultiOutputRegressor, Dict[str, Any], Dict[str, Any]]:
    """Load saved model, preprocessor, and metadata."""
    model = load_pickle(MODEL_PATH)
    preprocessor = load_pickle(PREPROCESSOR_PATH)
    metadata = load_pickle(METADATA_PATH)
    return model, preprocessor, metadata


def predict_from_dict(input_dict: Dict[str, Any]) -> Dict[str, int]:
    """Predict target metrics for one unlabeled input dictionary."""
    model, preprocessor, metadata = load_artifacts()
    flattened = flatten_documents([copy.deepcopy(input_dict)])
    features = transform_features(flattened, preprocessor)
    prediction = model.predict(features)[0]

    return {
        target: int(max(0, round(float(value))))
        for target, value in zip(metadata["target_columns"], prediction)
    }


def build_missing_target_query(target_columns: List[str]) -> Dict[str, Any]:
    """Find documents where at least one target is missing or null."""
    return {
        "$or": [
            {target: {"$exists": False}}
            for target in target_columns
        ]
        + [{target: None} for target in target_columns]
    }


def run_prediction_engine(
    mongo_uri: Optional[str] = None,
    database_name: Optional[str] = None,
    collection_name: Optional[str] = None,
    limit: int = 100,
) -> Dict[str, Any]:
    """
    Predict missing target metrics and write whole-number predictions to MongoDB.

    Documents are updated by their exact _id. Predictions are stored in
    mlPredictions.<sanitized_target_name> to avoid overwriting raw platform data.
    """
    try:
        model, preprocessor, metadata = load_artifacts()
        collection = get_collection(mongo_uri, database_name, collection_name)
        query = build_missing_target_query(metadata["target_columns"])
        documents = list(collection.find(query).limit(limit))

        if not documents:
            logger.info("No documents with missing target metrics found.")
            return {"matched_documents": 0, "updated_documents": 0}

        flattened = flatten_documents(copy.deepcopy(documents))
        features = transform_features(flattened, preprocessor)
        predictions = model.predict(features)

        updated = 0
        for document, prediction in zip(documents, predictions):
            clean_prediction = {
                f"mlPredictions.{sanitize_field_name(target)}": int(max(0, round(float(value))))
                for target, value in zip(metadata["target_columns"], prediction)
            }
            collection.update_one(
                {"_id": document["_id"]},
                {
                    "$set": {
                        **clean_prediction,
                        "mlPredictions.updatedAt": datetime.utcnow(),
                    }
                },
            )
            updated += 1

        logger.info("Prediction engine updated %s documents", updated)
        return {"matched_documents": len(documents), "updated_documents": updated}
    except Exception as exc:
        logger.exception("Prediction engine failed: %s", exc)
        return {"error": str(exc), "matched_documents": 0, "updated_documents": 0}


def sanitize_field_name(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_]+", "_", value).strip("_")


def run_suggestion_engine(input_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluate structural feature tweaks and return the highest scoring configuration.

    The search stays schema-agnostic: it only mutates fields already present in the
    input or fields detected during model training.
    """
    try:
        model, preprocessor, metadata = load_artifacts()
        candidates = generate_candidate_inputs(input_dict, metadata)

        best_candidate: Optional[Dict[str, Any]] = None
        best_prediction: Optional[Dict[str, int]] = None
        best_score = -1.0

        flattened = flatten_documents(copy.deepcopy(candidates))
        features = transform_features(flattened, preprocessor)
        raw_predictions = model.predict(features)

        for candidate, raw_prediction in zip(candidates, raw_predictions):
            prediction = {
                target: int(max(0, round(float(value))))
                for target, value in zip(metadata["target_columns"], raw_prediction)
            }
            score = score_prediction(prediction)
            if score > best_score:
                best_score = score
                best_candidate = candidate
                best_prediction = prediction

        return {
            "best_configuration": best_candidate or input_dict,
            "predicted_metrics": best_prediction or {},
            "score": round(best_score, 2),
            "evaluated_candidates": len(candidates),
            "strategy": explain_strategy(input_dict, best_candidate or input_dict, best_prediction or {}),
        }
    except Exception as exc:
        logger.exception("Suggestion engine failed: %s", exc)
        return {"error": str(exc), "best_configuration": input_dict}


def generate_candidate_inputs(input_dict: Dict[str, Any], metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Create practical candidate variants for the suggestion engine."""
    base = copy.deepcopy(input_dict)
    candidate_options: Dict[str, List[Any]] = {}

    known_features = set(metadata.get("categorical_features", []) + metadata.get("numeric_features", []))
    flattened_base = flatten_documents([copy.deepcopy(base)])
    flat_columns = set(flattened_base.columns)

    if "platform" in known_features or "platform" in flat_columns or "platform" in base:
        current = base.get("platform", "youtube")
        candidate_options["platform"] = unique_keep_order([current])

    if "posting_hour" in known_features or "posting_hour" in flat_columns or "posting_hour" in base:
        current_hour = int(base.get("posting_hour", 18) or 18)
        candidate_options["posting_hour"] = unique_keep_order([current_hour, 9, 12, 15, 18, 20, 22])

    for possible_field in ["hashtagsCount", "hashtags_count", "captionLength", "caption_length", "titleLength", "title_length"]:
        if possible_field in known_features or possible_field in flat_columns or possible_field in base:
            current_value = int(base.get(possible_field, 5) or 5)
            candidate_options[possible_field] = unique_keep_order([
                current_value,
                max(0, current_value - 3),
                current_value + 3,
                current_value + 8,
            ])

    if "contentType" in known_features or "contentType" in flat_columns or "contentType" in base:
        current_type = base.get("contentType", "video")
        candidate_options["contentType"] = unique_keep_order([current_type, "short", "video", "carousel", "image"])

    if not candidate_options:
        return [base]

    keys = list(candidate_options.keys())
    candidates = []
    for values in itertools.product(*(candidate_options[key] for key in keys)):
        candidate = copy.deepcopy(base)
        for key, value in zip(keys, values):
            candidate[key] = value
        candidates.append(candidate)

    return candidates[:250]


def unique_keep_order(values: Iterable[Any]) -> List[Any]:
    output = []
    for value in values:
        if value not in output:
            output.append(value)
    return output


def score_prediction(prediction: Dict[str, int]) -> float:
    """Compute a practical score from predicted metrics."""
    if not prediction:
        return 0.0

    if "performance_score" in prediction:
        return float(prediction["performance_score"])

    score = 0.0
    for target, value in prediction.items():
        lowered = target.lower()
        weight = 1.0
        if "views" in lowered or "viewcount" in lowered:
            weight = 0.25
        elif "likes" in lowered:
            weight = 0.4
        elif "comments" in lowered or "shares" in lowered:
            weight = 0.5
        elif "engagement" in lowered:
            weight = 0.8
        elif "subscriber" in lowered or "followers" in lowered:
            weight = 0.6
        score += max(0, value) * weight
    return float(score)


def explain_strategy(
    original: Dict[str, Any],
    selected: Dict[str, Any],
    prediction: Dict[str, int],
) -> str:
    """Return a concise chatbot-ready explanation."""
    changes = [
        f"{key}: {original.get(key)} -> {value}"
        for key, value in selected.items()
        if original.get(key) != value
    ]
    metric_summary = ", ".join(f"{key}={value}" for key, value in list(prediction.items())[:5])

    if changes:
        return f"Recommended tweaks: {', '.join(changes)}. Expected metrics: {metric_summary}."
    return f"Current structure already scores best among tested options. Expected metrics: {metric_summary}."


if __name__ == "__main__":
    train_model()
