from flask import Blueprint
from .models import TFModel
from flask import current_app as app

tfmodels_blueprint = Blueprint("models", __name__)

# TODO: maybe models should referenced from a "Modelsdb" with CRUD functions too?

audio_model = TFModel(dir_name="audio")
lite_sel_ops_model = TFModel(dir_name="lite", model="model.tflite", labels="labels.txt")
lite_std_ops_model = TFModel(dir_name="liteStdOps", model="model.tflite", labels="labels.txt")


# model routes:
@tfmodels_blueprint.route(audio_model.all_models_dir_name + "/" +
                          audio_model.dir_name + "/<file>", methods=["GET", "POST"])
def model_route(file):
    print(audio_model.all_models_dir_name + "/" +
          audio_model.dir_name + "/" + file)
    return app.send_static_file(audio_model.all_models_dir_name + "/" +
                                audio_model.dir_name + "/" + file)

