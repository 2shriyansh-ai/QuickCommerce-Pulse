"""Optional Gemini-powered executive summary generator.

The deterministic summary created by scripts/run_analysis.py remains the
default. This script can overwrite it when GOOGLE_GEMINI_AI_API_KEY is set.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from urllib import request

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "dashboard" / "public" / "data" / "pulse_data.json"
OUTPUT_PATH = ROOT / "ai_insights" / "executive_summary.txt"


def main():
    api_key = os.getenv("GOOGLE_GEMINI_AI_API_KEY")
    if not api_key:
        raise SystemExit("GOOGLE_GEMINI_AI_API_KEY is not configured.")

    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    context = {
        "kpis": payload["kpis"],
        "areas": payload["area_metrics"],
        "weather": payload["weather_metrics"],
        "traffic": payload["traffic_metrics"],
        "top_attention_restaurants": payload["restaurant_attention"][:5],
        "model_metrics": payload["model_metrics"],
        "limitations": payload["limitations"],
    }
    prompt = (
        "You are a data analyst. Write a concise four-sentence executive briefing "
        "using only the metrics below. Keep the delivery benchmark and Hyderabad "
        "restaurant listing analysis separate because they have no shared key. "
        "Mention model confidence, weather or traffic evidence, the highest-attention "
        "restaurant pattern, and one limitation. Do not invent metrics.\n\n"
        + json.dumps(context)
    )
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 350},
    }).encode("utf-8")
    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-1.5-flash:generateContent?key={api_key}"
    )
    http_request = request.Request(
        endpoint, data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(http_request, timeout=45) as response:
        result = json.load(response)
    summary = result["candidates"][0]["content"]["parts"][0]["text"].strip()
    OUTPUT_PATH.write_text(summary, encoding="utf-8")
    print(summary)


if __name__ == "__main__":
    main()
