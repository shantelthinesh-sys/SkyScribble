from src.main import main
from src.web_app import create_web_app

# For Flask CLI compatibility
app = create_web_app()

if __name__ == "__main__":
    main()
