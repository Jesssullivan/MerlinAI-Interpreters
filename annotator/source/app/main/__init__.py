from flask import Flask, redirect
from flask_cors import CORS
import os

from .client.routes import client_blueprint

# models are currently registered as a client subroute
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

    # Register Blueprints
    app.register_blueprint(client_blueprint, url_prefix="/client")

    # fetch static:
    @client_blueprint.route("<file>", methods=["GET", "POST"])
    def filex(file):
        return app.send_static_file(file)

    # Index:
    @app.route("/")
    def index():
        return redirect("/client/audio", code=302)

    return app
