from src.web_app import create_web_app
import traceback

app = create_web_app()
with app.app_context():
    from flask import render_template
    for t in ['dashboard.html','classes.html','assignments.html','annotation.html','resources.html']:
        try:
            render_template(t)
            print('OK:', t)
        except Exception as e:
            print('FAIL:', t)
            traceback.print_exc()
