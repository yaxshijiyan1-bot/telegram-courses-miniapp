import urllib.request
import json

url = "https://ekjjickrhnjttzrqwakz.supabase.co/rest/v1/courses"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramppY2tyaG5qdHR6cnF3YWt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njg1NDg5NCwiZXhwIjoyMTAyNDMwODk0fQ.k4vBBSjFWGecx3L_vn9Si84nY0DkWUjYTMqTriznPig"

updates = [
    {
        "id": "c1111111-1111-1111-1111-111111111111",
        "title": "Sun'iy Intellekt va Prompt Engineering Pro",
        "cover_url": "/images/ai_course.jpg"
    },
    {
        "id": "c2222222-2222-2222-2222-222222222222",
        "title": "Zamonaviy UI/UX va Mobile App Dizayn",
        "cover_url": "/images/design_course.jpg"
    },
    {
        "id": "c3333333-3333-3333-3333-333333333333",
        "title": "Telegram Bot & Mini App Fullstack Dasturlash",
        "cover_url": "/images/code_course.jpg"
    },
    {
        "id": "c4444444-4444-4444-4444-444444444444",
        "title": "High-Ticket SMM va Kontent Monetizatsiya",
        "cover_url": "/images/market_course.jpg"
    }
]

for up in updates:
    target_url = f"{url}?id=eq.{up['id']}"
    payload = json.dumps({"cover_url": up["cover_url"], "title": up["title"]}).encode()
    req = urllib.request.Request(
        target_url,
        data=payload,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        method="PATCH"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print("Successfully Updated in Supabase:", up["id"], resp.status)
    except Exception as e:
        print("Error on", up["id"], e)
