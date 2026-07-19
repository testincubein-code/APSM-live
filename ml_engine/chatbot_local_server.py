"""
Standalone localhost chatbot UI for the APSM ML suggestion engine.

Run from project root:
    python ./ml_engine/chatbot_local_server.py

Open:
    http://127.0.0.1:8765

This file does not modify the existing backend or frontend.
"""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict

try:
    from ml_engine.chatbot_connector import get_chatbot_suggestion
except ImportError:
    from chatbot_connector import get_chatbot_suggestion


HOST = "127.0.0.1"
PORT = 8765


HTML_PAGE = r"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>APSM Suggestion Chatbot</title>
  <style>
    :root {
      --bg: #0f172a;
      --panel: #111827;
      --surface: #182235;
      --surface-2: #223049;
      --line: #334155;
      --text: #e5e7eb;
      --muted: #94a3b8;
      --accent: #10b981;
      --accent-2: #38bdf8;
      --danger: #f97316;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .app {
      width: min(980px, 100%);
      height: min(760px, calc(100vh - 48px));
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      display: grid;
      grid-template-rows: auto 1fr auto;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0, 0, 0, .35);
    }
    header {
      padding: 18px 22px;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: #101827;
    }
    h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--muted);
      font-size: 13px;
      white-space: nowrap;
    }
    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 4px rgba(16, 185, 129, .15);
    }
    #messages {
      padding: 22px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .message {
      max-width: 78%;
      padding: 13px 15px;
      border-radius: 8px;
      line-height: 1.45;
      font-size: 14px;
      border: 1px solid transparent;
    }
    .bot {
      align-self: flex-start;
      background: var(--surface);
      border-color: var(--line);
    }
    .user {
      align-self: flex-end;
      background: rgba(16, 185, 129, .14);
      border-color: rgba(16, 185, 129, .35);
    }
    .metrics {
      margin-top: 10px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 8px;
    }
    .metric {
      background: rgba(15, 23, 42, .6);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 9px;
    }
    .metric span {
      display: block;
      color: var(--muted);
      font-size: 11px;
      margin-bottom: 4px;
    }
    .metric strong {
      font-size: 15px;
    }
    form {
      border-top: 1px solid var(--line);
      padding: 16px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      background: #101827;
    }
    input {
      width: 100%;
      min-height: 44px;
      border-radius: 6px;
      border: 1px solid var(--line);
      background: var(--surface);
      color: var(--text);
      padding: 0 13px;
      outline: none;
      font-size: 14px;
    }
    input:focus {
      border-color: var(--accent-2);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, .12);
    }
    button {
      min-width: 104px;
      border: 0;
      border-radius: 6px;
      background: var(--accent);
      color: #052e1f;
      font-weight: 700;
      cursor: pointer;
      padding: 0 18px;
    }
    button:disabled {
      opacity: .55;
      cursor: wait;
    }
    .chips {
      display: flex;
      gap: 8px;
      padding: 0 16px 14px;
      border-top: 1px solid rgba(51, 65, 85, .45);
      background: #101827;
      overflow-x: auto;
    }
    .chip {
      border: 1px solid var(--line);
      background: var(--surface);
      color: var(--text);
      border-radius: 999px;
      min-width: auto;
      padding: 8px 11px;
      font-weight: 600;
      white-space: nowrap;
      font-size: 12px;
    }
    @media (max-width: 640px) {
      body { padding: 0; }
      .app {
        height: 100vh;
        border-radius: 0;
        border: 0;
      }
      header {
        align-items: flex-start;
        flex-direction: column;
      }
      .message { max-width: 92%; }
      form {
        grid-template-columns: 1fr;
      }
      button {
        min-height: 42px;
      }
    }
  </style>
</head>
<body>
  <main class="app" aria-label="APSM suggestion chatbot">
    <header>
      <h1>APSM Suggestion Chatbot</h1>
      <div class="status"><span class="dot"></span><span>Connected to local ML model</span></div>
    </header>
    <section id="messages">
      <div class="message bot">
        Tell me what you want to post. For example: "Suggest a YouTube short tonight with 8 hashtags."
      </div>
    </section>
    <div class="chips">
      <button class="chip" data-prompt="Suggest a YouTube short tonight with 8 hashtags">YouTube short</button>
      <button class="chip" data-prompt="Suggest an Instagram reel in the evening with 10 hashtags">Instagram reel</button>
      <button class="chip" data-prompt="Suggest a LinkedIn post for afternoon">LinkedIn post</button>
    </div>
    <form id="chat-form">
      <input id="chat-input" autocomplete="off" placeholder="Ask for a posting suggestion..." />
      <button id="send-button" type="submit">Send</button>
    </form>
  </main>
  <script>
    const messages = document.getElementById("messages");
    const form = document.getElementById("chat-form");
    const input = document.getElementById("chat-input");
    const button = document.getElementById("send-button");

    function addMessage(text, type, payload) {
      const node = document.createElement("div");
      node.className = `message ${type}`;
      node.textContent = text;
      if (payload && payload.suggestion) {
        const metrics = payload.suggestion.predicted_metrics || {};
        const best = payload.suggestion.best_configuration || {};
        const wrap = document.createElement("div");
        wrap.className = "metrics";
        [
          ["Score", payload.suggestion.score],
          ["Performance", metrics.performance_score],
          ["Platform", best.platform],
          ["Posting hour", best.posting_hour]
        ].forEach(([label, value]) => {
          const item = document.createElement("div");
          item.className = "metric";
          item.innerHTML = `<span>${label}</span><strong>${value ?? "N/A"}</strong>`;
          wrap.appendChild(item);
        });
        node.appendChild(wrap);
      }
      messages.appendChild(node);
      messages.scrollTop = messages.scrollHeight;
    }

    async function sendChat(text) {
      addMessage(text, "user");
      button.disabled = true;
      try {
        const res = await fetch("/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text })
        });
        const payload = await res.json();
        addMessage(payload.reply || "No suggestion returned.", "bot", payload);
      } catch (error) {
        addMessage("The local chatbot server could not return a suggestion.", "bot");
      } finally {
        button.disabled = false;
        input.focus();
      }
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      sendChat(text);
    });

    document.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => sendChat(chip.dataset.prompt));
    });
  </script>
</body>
</html>
"""


class ChatbotHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path in {"/", "/index.html"}:
            self.send_html(HTML_PAGE)
            return
        self.send_json({"error": "Not found"}, status=404)

    def do_POST(self) -> None:
        if self.path != "/chat":
            self.send_json({"error": "Not found"}, status=404)
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length).decode("utf-8")
            payload = json.loads(body or "{}")
            message = payload.get("message", "")
            context = payload.get("context") or {}
            result = get_chatbot_suggestion(message, context)
            self.send_json(result)
        except Exception as exc:
            self.send_json({"reply": f"Suggestion failed: {exc}", "error": str(exc)}, status=500)

    def send_html(self, html: str) -> None:
        data = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, payload: Dict[str, Any], status: int = 200) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format: str, *args: Any) -> None:
        return


def run_server() -> None:
    server = ThreadingHTTPServer((HOST, PORT), ChatbotHandler)
    print(f"APSM suggestion chatbot running at http://{HOST}:{PORT}")
    print("Press Ctrl+C to stop.")
    server.serve_forever()


if __name__ == "__main__":
    run_server()
