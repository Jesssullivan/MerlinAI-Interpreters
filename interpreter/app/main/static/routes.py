import os
from flask import Blueprint, url_for, send_file
from flask import current_app as app


static_blueprint = Blueprint("static", __name__)


# fetch static:
@static_blueprint.route("<file>")
def filex(file):
    print(os.listdir(app.static_url_path))
    return app.send_static_file('static' + file)


