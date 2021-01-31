from ..tools import tools
import tensorflow as tf
import librosa
from ..config import *


class TFModel:

    def __init__(self, dir_name,
                 model="model.json",
                 labels="labels.json",
                 all_models_dir_name="models",
                 shards=list):
        self.dir_name = dir_name
        self.model_name = model
        self.labels_name = labels
        self.shards = shards
        self.all_models_dir_name = all_models_dir_name

    def list(self):

        model_data = {
            "TF Model Directory Name:": self.dir_name,
            "Model Filename:": self.model_name,
            "Labels Filename": self.labels_name,
            "All TF Models Directory Name:": self.all_models_dir_name
        }

        if len(self.shards) > 0:
            model_data["shards"] = self.shards

        print(model_data)
        return tools.JsonResp(model_data, 200)
