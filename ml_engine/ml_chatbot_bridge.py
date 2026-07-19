"""
JSON bridge used by the Node backend to call the local ML chatbot connector.

Input is read from stdin:
    {"message": "...", "context": {...}}

Output is written to stdout as JSON.
"""

from __future__ import annotations

import json
import sys

from chatbot_connector import get_chatbot_suggestion


def main() -> None:
    try:
        payload = json.loads(sys.stdin.read() or "{}")
        message = payload.get("message", "")
        context = payload.get("context") or {}
        result = get_chatbot_suggestion(message, context)
        print(json.dumps(result))
    except Exception as exc:
        print(json.dumps({
            "reply": f"I could not generate a suggestion right now. Reason: {exc}",
            "error": str(exc),
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
