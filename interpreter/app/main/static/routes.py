from flask import Blueprint
from flask import current_app as app


static_blueprint = Blueprint("static", __name__)


# fetch static:
@static_blueprint.route("<file>")
def filex(file):
    return app.send_static_file("static/" + file)
