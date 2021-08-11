import os

from flask import Blueprint, render_template, url_for, request
from flask import current_app as app
from flask import redirect

from app.main.classify.config import new_client_dir, new_client
from .models import Report

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


@reports_blueprint.route("/asset/<asset_id>", methods=["GET", "POST"])
def plot_gen(asset_id):

    # create a temporary directory for this user:
    usr_id = new_client()
    usr_dir = new_client_dir(usr_id)

    _ = Report.download_ml_asset(usr_dir, asset_id)

    fp, obj = Report.plot_predictions(usr_dir, asset_id)
    return render_template('assetPredictionReport.j2',
<<<<<<< HEAD
                           fp='http://localhost:5000' + '/static/uploads/' + usr_id + '/' + 'prediction_plot.png',
                           fp_pdf='http://localhost:5000' + '/static/uploads/' + usr_id + '/' + 'prediction_plot.pdf',
=======
                           fp='https://ai.columbari.us' + '/static/' + usr_id + '/' + 'prediction_plot.png',
                           fp_pdf='https://ai.columbari.us' + '/static/' + usr_id + '/' + 'prediction_plot.pdf',
>>>>>>> d0373be93fdae6b1ea022d0b8492aed0e2b23895
                           asset_id=asset_id,
                           asset_day=obj.day,
                           asset_month=obj.month,
                           asset_lat=obj.lat,
                           asset_lng=obj.lng)
