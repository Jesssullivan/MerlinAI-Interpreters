import os
import numpy as np
import requests

# query eBird? NEED AN API KEY !!!!
key = 'stmdsp5klv21'

# Load in the saved model
savedmodel_dir = os.path.join("etc/models", "savedmodel_with_preprocessing")

# Load in the species codes that correspond to the model's outputs
model_text_labels = np.loadtxt(os.path.join(savedmodel_dir, "labels.txt"), dtype=object).tolist()


class MLeBirdFreqInfo(object):

    def __init__(self, asset_id, model_labels=None, api_key=None):
        self.lat_lng_str = 'Longitude</span>\n\t\t\t\t\t<span class="u-text-2" dir="auto">'
        self.asset_text = requests.get("https://macaulaylibrary.org/asset/%s" % asset_id).text
        self._lat, self._lng = self.asset_text.split(self.lat_lng_str)[1].split('</span>')[0].split(', ')
        self.lat = float(self._lat)
        self.lng = float(self._lng)
        self.month = int(self.asset_text.split('<time dir="ltr" datetime="')[1].split('-')[1])
        self.day = int(self.asset_text.split('<time dir="ltr" datetime="')[1].split('-')[2].split('T')[0])
        self.key = api_key
        self.labels = model_labels
        self.mx = self.get_freq()

    def get_freq(self):

        if self.key is None:
            return self.labels
        else:
            r = requests.get("https://api.ebird.org/v2/product/geo/freqlist?lat=%0.4f&lng=%0.4f&m=%d&d=%d&key=%s" %
                             (self.lat, self.lng, self.month, self.day, self.key))
            ebird_resp = r.json()
            model_labels_set = set(self.labels)

            valid_labels = []
            for val in ebird_resp:
                if val['speciesCode'] in model_labels_set and val['frequency'] > 0:
                    valid_labels.append(val['speciesCode'])

            valid_labels_set = set(valid_labels)
            prediction_filter = []
            for label in model_text_labels:
                if label in valid_labels_set:
                    prediction_filter.append(1)
                else:
                    prediction_filter.append(0)

            return np.array(prediction_filter, dtype=np.float32)

