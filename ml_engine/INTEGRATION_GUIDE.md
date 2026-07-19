# ML Engine Integration Guide

This document explains how the backend team should integrate the `ml_engine`
pipeline with the APSM application and future chatbot/suggestion flow.

## Current Status

The ML engine is already created and trained locally.

Main file:

```text
ml_engine/ml_pipeline.py
```

Saved model artifacts:

```text
ml_engine/ml_models/multi_output_random_forest.pkl
ml_engine/ml_models/preprocessor.pkl
ml_engine/ml_models/model_metadata.pkl
```

The model was trained from MongoDB collection:

```text
Database: test
Collection: analyticssnapshots
```

The current dataset contains mostly zero analytics, so predictions are expected
to be low/zero until richer historical analytics are collected.

## What The ML Engine Does

The pipeline:

- Connects to MongoDB using `MONGODB_URI`.
- Loads analytics documents from MongoDB.
- Flattens nested analytics objects dynamically.
- Extracts YouTube analytics report rows into numeric aggregate columns.
- Detects numeric target metrics automatically.
- Detects categorical and numeric features automatically.
- Trains a `MultiOutputRegressor(RandomForestRegressor)`.
- Saves `.pkl` files under `ml_engine/ml_models/`.
- Exposes reusable prediction and suggestion functions.

No frontend, API server, or chatbot server is created inside `ml_engine`.

## Python Dependencies

Install these dependencies in the backend environment:

```bash
pip install pandas numpy pymongo scikit-learn
```

If using MongoDB SRV URLs like `mongodb+srv://`, install:

```bash
pip install "pymongo[srv]" pandas numpy scikit-learn
```

## Environment Variables

Required when training or when using MongoDB write-back prediction:

```bash
MONGODB_URI
MONGODB_DB
MONGODB_COLLECTION
```

Example:

```powershell
$env:MONGODB_URI='mongodb+srv://<db_user>:<db_password>@cluster0.uejsfc4.mongodb.net/?appName=Cluster0'
$env:MONGODB_DB='test'
$env:MONGODB_COLLECTION='analyticssnapshots'
```

Do not commit real MongoDB credentials into source code.

## Training The Model

Run this from the project root:

```bash
python ./ml_engine/ml_pipeline.py
```

On success, model artifacts are saved into:

```text
ml_engine/ml_models/
```

Recommended retraining schedule:

- During development: manually after new analytics snapshots are added.
- In production: scheduled job, for example once per day or once per week.
- Do not retrain on every user chatbot request.

## Backend Suggestion Integration

The backend should call `run_suggestion_engine(input_dict)`.

Example:

```python
from ml_engine.ml_pipeline import run_suggestion_engine

result = run_suggestion_engine({
    "platform": "youtube",
    "posting_hour": 18,
    "contentType": "short",
    "hashtagsCount": 8,
    "titleLength": 45,
})

print(result)
```

Example response shape:

```python
{
    "best_configuration": {
        "platform": "youtube",
        "posting_hour": 18,
        "contentType": "short",
        "hashtagsCount": 8,
        "titleLength": 45,
    },
    "predicted_metrics": {
        "performance_score": 8,
        "analytics_daily.views.sum": 0,
        "analytics_daily.likes.sum": 0,
    },
    "score": 8.0,
    "evaluated_candidates": 250,
    "strategy": "Current structure already scores best among tested options..."
}
```

The chatbot should show `strategy`, `best_configuration`, and selected
high-level metrics to the user.

## Suggested Backend API Contract

Recommended endpoint:

```text
POST /api/ml/suggestions
```

Request body:

```json
{
  "platform": "youtube",
  "posting_hour": 18,
  "contentType": "short",
  "hashtagsCount": 8,
  "titleLength": 45
}
```

Backend handler logic:

```python
from ml_engine.ml_pipeline import run_suggestion_engine

def create_suggestion(payload):
    return run_suggestion_engine(payload)
```

Response body:

```json
{
  "success": true,
  "data": {
    "best_configuration": {},
    "predicted_metrics": {},
    "score": 0,
    "evaluated_candidates": 0,
    "strategy": ""
  }
}
```

## Chatbot Integration Flow

The chatbot should not train the model directly.

Recommended flow:

```text
User message
-> chatbot extracts intent and post details
-> backend builds input_dict
-> backend calls run_suggestion_engine(input_dict)
-> chatbot explains the result in natural language
```

Example chatbot input mapping:

```python
input_dict = {
    "platform": user_selected_platform,
    "posting_hour": parsed_or_default_hour,
    "contentType": parsed_content_type,
    "hashtagsCount": parsed_hashtag_count,
    "titleLength": len(title or ""),
}
```

If fields are missing, the chatbot should ask a follow-up question or use
reasonable defaults.

## Isolated Local Chatbot Demo

An isolated local chatbot has been added under `ml_engine` so the existing
backend and frontend do not need to be changed.

Files:

```text
ml_engine/chatbot_connector.py
ml_engine/chatbot_local_server.py
```

Run from project root:

```bash
python ./ml_engine/chatbot_local_server.py
```

Open:

```text
http://127.0.0.1:8765
```

This local server serves a small chat UI and exposes:

```text
POST /chat
```

The `/chat` handler calls:

```python
get_chatbot_suggestion(message, context)
```

which then calls:

```python
run_suggestion_engine(input_dict)
```

This proves the chatbot-to-model connection works without modifying the
existing application backend or frontend.

## Prediction Write-Back Integration

The ML engine also exposes:

```python
from ml_engine.ml_pipeline import run_prediction_engine

result = run_prediction_engine()
```

This function:

- Loads saved model artifacts.
- Finds MongoDB documents missing detected target metrics.
- Predicts missing values.
- Writes predictions back to the same documents under `mlPredictions.*`.

Use this only from backend jobs or admin actions, not from public frontend code.

The MongoDB user must have write permissions for this function.

## Important Data Notes

The current analytics collection is trainable, but mostly contains zero values.
Because of that, initial predictions may also be zero.

For better future suggestions, collect post/video-level records with fields like:

```json
{
  "platform": "youtube",
  "contentType": "short",
  "titleLength": 45,
  "descriptionLength": 280,
  "hashtagsCount": 8,
  "publishedHour": 18,
  "publishedDayOfWeek": "Friday",
  "views": 5400,
  "likes": 320,
  "comments": 28,
  "shares": 44,
  "averageViewPercentage": 61.5,
  "subscribersGained": 18,
  "performanceScore": 82
}
```

The more non-zero historical analytics the app collects, the better the model
will perform after retraining.

## Production Notes

- Keep credentials in environment variables or secret manager.
- Do not expose `.pkl` files to the browser.
- Do not call the model directly from frontend JavaScript.
- Backend should be the only layer importing `ml_engine.ml_pipeline`.
- Rotate any MongoDB password that has been shared in chat or screenshots.
- Add `ml_engine/ml_models/` to deployment only if runtime inference is needed.
- Add `__pycache__/` to `.gitignore` if it is not already ignored.

## Quick Smoke Test

From project root:

```bash
python -c "from ml_engine.ml_pipeline import run_suggestion_engine; print(run_suggestion_engine({'platform':'youtube','posting_hour':18,'contentType':'short','hashtagsCount':8,'titleLength':45}))"
```

If it returns `best_configuration`, `predicted_metrics`, and `strategy`, the
local suggestion engine is working.
