from flask import Blueprint
from flask import current_app as app
from flask import make_response, render_template

from flask import views

files_blueprint = Blueprint("files", __name__)


# fetch static:
@files_blueprint.route("/<file>/")
def fserve(file):
    resp = make_response("""
      <div>
          <div class="container">
          <h3>%s</h3>
          <h5> <-- Scroll --> </h5>
          <iframe src="https://ai.columbari.us/annotator/static/%s" style="border:0px #ffffff none;" scrolling="yes" frameborder="1" marginheight="0px" marginwidth="0px" height="800px" width="989px"></iframe>
          </div>
      </div>
      """ % (file, file))
    resp.mimetype = 'text/plain'
    return resp
