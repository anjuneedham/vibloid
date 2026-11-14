Visual plan: every beat may set `visual_type`:
- "stock_video": real footage, the default. Set `visual_query` to 2-5 concrete words that exist as stock footage (city traffic, hands typing, stock ticker screen, empty office). Avoid abstract queries.
- "chart": an animated chart. ONLY use it if a dataset from the AVAILABLE DATASETS list below fits the claim, and set `chart` = {"dataset": <exact name>, "kind": "line"|"candles"|"bars"|"counter", "title": <short>}. NEVER invent numbers or datasets; narration about a chart must only state what the dataset shows.
- "ai_image": an AI-generated still that the renderer animates. Use at most 2 per Short for the moments that most need to stop the scroll or spark curiosity (a striking metaphor or scene). Set `ai_prompt` to a vivid scene description. No text, logos or real people.
- "image": a plain still. Rarely needed.
Vary the visual type across beats so the video keeps changing every few seconds. The hook beat should be the most visually arresting.
