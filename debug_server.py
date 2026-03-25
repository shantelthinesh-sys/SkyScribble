import traceback, sys

out = []
try:
    from src.web_app import create_web_app
    app = create_web_app()
    app.config['TESTING'] = True
    app.config['PROPAGATE_EXCEPTIONS'] = True

    with app.test_client() as c:
        for route in ['/', '/login', '/signup', '/dashboard', '/classes', '/assignments', '/annotation', '/resources', '/draw', '/api/health']:
            try:
                r = c.get(route)
                out.append(f"{r.status_code}  {route}")
                if r.status_code >= 400:
                    out.append("  BODY: " + r.data.decode()[:500])
            except Exception as e:
                out.append(f"EXCEPTION  {route}: {e}")
                out.append(traceback.format_exc())

except Exception as e:
    out.append("IMPORT/CREATE ERROR: " + str(e))
    out.append(traceback.format_exc())

with open('debug_out.txt', 'w') as f:
    f.write('\n'.join(out))
