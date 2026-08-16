import urllib.request
import urllib.parse
import json
import hmac
import hashlib
import time

base_url = 'https://kurslar-backend-api.onrender.com'
bot_token = '8876379472:AAGHgR0wyJlKGHfT8rvMyB_rulh7bby7zXA'

print('=== 1. HEALTH CHECK ===')
resp = urllib.request.urlopen(f'{base_url}/health')
print('Health:', resp.status, resp.read().decode())

print('\n=== 2. GET COURSES LIST ===')
resp = urllib.request.urlopen(f'{base_url}/api/courses')
courses = json.loads(resp.read().decode())
print(f'Courses loaded: {len(courses)} courses')
for c in courses:
    print(f" - {c.get('title')}: {c.get('price')} so'm ({c.get('duration')})")

print('\n=== 3. GET COURSE DETAIL ===')
slug = courses[0].get('slug')
resp = urllib.request.urlopen(f'{base_url}/api/courses/{slug}')
course_detail = json.loads(resp.read().decode())
print(f"Detail for {slug}: {len(course_detail.get('modules', []))} modules")

print('\n=== 4. TEST TELEGRAM HMAC-SHA256 AUTH (Yaxshi Bola - 8544023815) ===')
user_json = json.dumps({'id': 8544023815, 'first_name': 'Yaxshi Bola', 'username': 'yomonboia'})
auth_date = str(int(time.time()))
data_check_string = f'auth_date={auth_date}\nuser={user_json}'

secret_key = hmac.new(b'WebAppData', bot_token.encode(), hashlib.sha256).digest()
calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
valid_init_data = f'auth_date={auth_date}&user={urllib.parse.quote(user_json)}&hash={calculated_hash}'

auth_req = urllib.request.Request(
    f'{base_url}/api/auth/telegram',
    data=json.dumps({'init_data': valid_init_data}).encode(),
    headers={'Content-Type': 'application/json'}
)
try:
    with urllib.request.urlopen(auth_req) as resp:
        auth_res = json.loads(resp.read().decode())
        print('AUTH SUCCESS!')
        print('User:', auth_res.get('user'))
        print('Token received:', auth_res.get('access_token')[:20] + '...')
        token = auth_res.get('access_token')
        
        # Test Admin Dashboard with Superadmin Token
        admin_req = urllib.request.Request(
            f'{base_url}/api/admin/dashboard-stats',
            headers={'Authorization': f'Bearer {token}'}
        )
        with urllib.request.urlopen(admin_req) as admin_resp:
            admin_data = json.loads(admin_resp.read().decode())
            print('ADMIN DASHBOARD DATA:', admin_data.get('admin_name'), '| Role:', admin_data.get('role'), '| Revenue:', admin_data.get('total_revenue'))
except Exception as e:
    print('Auth test error:', e)

print('\n=== 5. TEST TELEGRAM HMAC-SHA256 AUTH (Zuhra Olimova - 8112688757) ===')
user_json2 = json.dumps({'id': 8112688757, 'first_name': 'Zuhra Olimova', 'username': 'sokin_notalar'})
data_check_string2 = f'auth_date={auth_date}\nuser={user_json2}'
calculated_hash2 = hmac.new(secret_key, data_check_string2.encode(), hashlib.sha256).hexdigest()
valid_init_data2 = f'auth_date={auth_date}&user={urllib.parse.quote(user_json2)}&hash={calculated_hash2}'

auth_req2 = urllib.request.Request(
    f'{base_url}/api/auth/telegram',
    data=json.dumps({'init_data': valid_init_data2}).encode(),
    headers={'Content-Type': 'application/json'}
)
try:
    with urllib.request.urlopen(auth_req2) as resp:
        auth_res2 = json.loads(resp.read().decode())
        print('AUTH SUCCESS FOR ZUHRA OLIMOVA!')
        print('User:', auth_res2.get('user'))
        token2 = auth_res2.get('access_token')
        
        # Test Admin Dashboard with Zuhra Olimova Token
        admin_req2 = urllib.request.Request(
            f'{base_url}/api/admin/dashboard-stats',
            headers={'Authorization': f'Bearer {token2}'}
        )
        with urllib.request.urlopen(admin_req2) as admin_resp2:
            admin_data2 = json.loads(admin_resp2.read().decode())
            print('ADMIN DASHBOARD DATA (Zuhra Olimova):', admin_data2.get('admin_name'), '| Role:', admin_data2.get('role'))
except Exception as e:
    print('Auth test error 2:', e)

print('\n=== 6. TEST INVALID INIT DATA (SECURITY VERIFICATION) ===')
bad_req = urllib.request.Request(
    f'{base_url}/api/auth/telegram',
    data=json.dumps({'init_data': 'auth_date=123&user=hacker&hash=fake_hash'}).encode(),
    headers={'Content-Type': 'application/json'}
)
try:
    urllib.request.urlopen(bad_req)
    print('SECURITY FAILED! Fake auth accepted.')
except urllib.error.HTTPError as e:
    print(f'SECURITY VERIFIED! Rejected invalid hash with HTTP {e.code} ({e.reason})')
