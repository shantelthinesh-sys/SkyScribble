import sys
import traceback
from src.web_app import create_web_app

app = create_web_app()
app.config['TESTING'] = True
app.config['PROPAGATE_EXCEPTIONS'] = False

routes = ['/', '/login', '/signup', '/dashboard', '/classes', '/assignments', '/annotation', '/resources', '/draw', '/favicon.ico', '/api/health']

with app.test_client() as c:
    for route in routes:
        try:
            r = c.get(route)
            print(f"{r.status_code}  {route}")
            if r.status_code == 500:
                print("   BODY:", r.data.decode()[:300])
        except Exception as e:
            print(f"EXCEPTION  {route}: {e}")
            traceback.print_exc()
