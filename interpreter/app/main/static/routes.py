from flask import Blueprint
from flask import current_app as app


static_blueprint = Blueprint("static", __name__)


# fetch static:
@static_blueprint.route("<file>")
def filex(file):
    return app.send_static_file("static/" + file)


# fetch static:
@static_blueprint.route("/files/<file>")
def fserve(file):
    return """
      <div>
          <div class="container">
          <h3>%s</h3>
          <h5> <-- Scroll --> </h5>
          <iframe src="https://ai.columbari.us/annotator/static/%s" style="border:0px #ffffff none;" scrolling="yes" frameborder="1" marginheight="0px" marginwidth="0px" height="800px" width="989px"></iframe>
          </div>
      </div>
      """ % (file, file)