import json

from .main import create_app, DataAPI

if __name__ == "__main__":

    app = create_app()

    # initialize and start datadb:
    data = {
        "database": "IshmeetDB",
        "collection": "people",
    }

    DataAPI(data)

    app.run()
