from flask import Flask, redirect
from flask_cors import CORS
from pymongo import MongoClient
from .tools.tools import JsonResp
import os

# Import Routes
from .userdb.routes import user_blueprint
from .client.routes import client_blueprint
from .eventdb.routes import eventdb_blueprint
# from .tfmodels.routes import tfmodels_blueprint



def create_app():

    # Flask Config
    app = Flask(__name__)
    app.config.from_pyfile("config/config.cfg")
    CORS(app, resources={r"/*": {"origins": app.config["FRONTEND_DOMAIN"]}})

    # set template & static paths:
    app.template_folder = "../../demos/"
    app.static_folder = "../../demos/"

    # Misc Config
    os.environ["TZ"] = app.config["TIMEZONE"]

    # Database Config
    if app.config["ENVIRONMENT"] == "development":
        mongo = MongoClient(app.config["MONGO_HOSTNAME"], app.config["MONGO_PORT"])
        app.db = mongo[app.config["MONGO_APP_DATABASE"]]
    else:
        mongo = MongoClient("localhost")
        mongo[app.config["MONGO_AUTH_DATABASE"]].authenticate(app.config["MONGO_AUTH_USERNAME"],
                                                              app.config["MONGO_AUTH_PASSWORD"])
        app.db = mongo[app.config["MONGO_APP_DATABASE"]]

    # Register Blueprints
    app.register_blueprint(user_blueprint, url_prefix="/user")
    app.register_blueprint(client_blueprint, url_prefix="/client")
    app.register_blueprint(eventdb_blueprint, url_prefix="/events")

    # Index Routes:
    @app.route("/")
    def index():
        return redirect("/client", code=302)


    # fetch static:
    @client_blueprint.route("<file>", methods=["GET", "POST"])
    def filex(file):
        return app.send_static_file(file)

    return app
