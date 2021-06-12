from load_dwca import MODwca
from preprocess import Preprocess
from common import *

if __name__ == "__main__":

    """MODwca():
    fetch & save off the gbif export
    make sure we can load the dwca archive into memory:
    """
    dwca = MODwca()

    """BuildImages():
    functions to construct image dataset and annotator artefacts
    """
    buildData = Preprocess()

    buildData.write_images_json()

    buildData.fetch_leaflet_tool()

    buildData.fetch_online_images(_json=STATIC_PATH + "images.json")

    buildData.export_tgz()

    buildData.split_training_testing()

    buildData.write_categories_json()
