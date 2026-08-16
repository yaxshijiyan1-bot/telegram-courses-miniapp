import urllib.request
import json
from test_suite import valid_init_data, base_url

print('=== 1. VERIFY INSTRUCTORS & ACCESS DURATION ===')
resp = urllib.request.urlopen(f'{base_url}/api/courses')
courses = json.loads(resp.read().decode())
for c in courses:
    print(f"Kurs: {c.get('title')} | Ustoz: {c.get('instructor_name')} ({c.get('instructor_title')}) | Muddat: {c.get('access_duration', '1 yil (365 kun)')}")

print('\n=== 2. TEST COURSE EDITING (ADMIN PUT) ===')
auth_req = urllib.request.Request(
    f'{base_url}/api/auth/telegram',
    data=json.dumps({'init_data': valid_init_data}).encode(),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(auth_req) as resp:
    token = json.loads(resp.read().decode())['access_token']

update_payload = {
    'price': 499000,
    'old_price': 899000
}
edit_req = urllib.request.Request(
    f'{base_url}/api/admin/courses/c1111111-1111-1111-1111-111111111111',
    data=json.dumps(update_payload).encode(),
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
    method='PUT'
)
with urllib.request.urlopen(edit_req) as resp:
    res = json.loads(resp.read().decode())
    print('Edit Response:', res['message'])

print('\n=== 3. TEST CLOUDFLARE R2 UPLOAD ENDPOINT ===')
r2_req = urllib.request.Request(
    f'{base_url}/api/admin/upload-to-r2?filename=lesson_ai_intro.mp4',
    data=b'',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(r2_req) as resp:
    r2_res = json.loads(resp.read().decode())
    print('R2 Storage:', r2_res.get('storage'))
    print('Public R2 Video URL:', r2_res.get('public_r2_url'))
    print('Database:', r2_res.get('database'))
