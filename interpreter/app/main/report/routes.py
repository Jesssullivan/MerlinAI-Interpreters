from flask import Blueprint
from flask import current_app as app
from flask import redirect


reports_blueprint = Blueprint("reports", __name__)
reports_blueprint.static_folder = "../../demos/"


@reports_blueprint.route("media_icon.png/overview", methods=["GET", "POST"])
def media_png():
    return app.send_static_file("media_icon.png")


@reports_blueprint.route("/<s>/", methods=["GET", "POST"])
def rp_index(s):
    return redirect("overview", code=302)


@reports_blueprint.route("/<sp>/overview", methods=["GET", "POST"])
def rp_overview(sp):
    return app.send_static_file('html/' + sp + '.html')


@reports_blueprint.route("/<sp>/<f>", methods=["GET", "POST"])
def rp_file_route(sp, f):
    return app.send_static_file(sp + '/' + f)

