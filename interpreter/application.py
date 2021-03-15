
from app.main import create_app
from waitress import serve

if __name__ == "__main__":
    app = create_app()
    serve(app, host='0.0.0.0', port='5000')
