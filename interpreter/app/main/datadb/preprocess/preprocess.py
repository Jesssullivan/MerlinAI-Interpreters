import os
import csv
import json
import random
import subprocess
import tarfile
import glob
from math import floor
from shutil import copyfile

# load common names:
from common import *


class Preprocess:

    def __init__(self,
                 _static_path=STATIC_PATH,
                 _sample_assets_path=SAMPLE_ASSETS_PATH,
                 _version=2):

        # csv version :t  ...We should probably stick with just one for a while  xD
        self.version = _version

        # common paths
        self.static_path = _static_path
        self.sample_assets_path = _sample_assets_path

        # we'll use dictionary `json_df` to populate `images.json`:
        self.json_df = []

        if not os.path.exists(self.static_path):
            os.makedirs(self.static_path)

        with open(self.sample_assets_path, newline='') as f:

            # open up Nathan and  Joe's merged csv files from Google Sheets:
            ln = csv.reader(f, delimiter=',', quotechar='|')

            if self.version == 1:
                for row in ln:
                    try:
                        # make sure we only adding integer keys:
                        if int(row[0]):
                            _dir_name = str(row[1]).replace(" ", "_").lower()

                            _obj = {'id': str(row[2]).split('/')[-1],
                                    '': str(row[0]),
                                    'category_id': str(row[1]),
                                    'category_dir': _dir_name,
                                    'url': 'https://mo.columbari.us/static/images/' + _dir_name + '/' +
                                           str(row[2]).split('/')[-1],
                                    'src': str(row[2])
                                    }

                            self.json_df.append(_obj)

                    except ValueError:
                        # not an integer, skip it
                        pass

            if self.version == 2:
                for row in ln:
                    try:
                        # make sure we only adding integer keys:
                        if int(row[1]):
                            _dir_name = str(row[0]).replace(" ", "_").lower()
                            _obj = {'id': row[1],
                                    'taxon_id': str(row[0]),
                                    'category_id': str(row[0]),
                                    'category_dir': _dir_name,
                                    'url': 'https://mo.columbari.us/static/images/' +_dir_name + "/" + str(row[1]) + ".jpg",
                                    'src': JPG_URL_PREFIX + str(row[1]) + ".jpg"
                                    }

                            self.json_df.append(_obj)

                    except ValueError:
                        # not an integer, skip it
                        pass

    def fetch_leaflet_tool(self):

        print('Fetching Leaflet annotator binaries...')

        if not os.path.exists(self.static_path + "js/"):
            os.makedirs(self.static_path + "js/")

        for _obj in LEAFLET_URL, LEAFLET_URL + ".LICENSE.txt":
            _cmd = "curl -L " + _obj + " --output ./static/js/" + _obj.split('/')[-1]
            subprocess.Popen(_cmd, shell=True).wait()

    def write_images_json(self, _path=None):

        # let the caller save off archive somewhere else if they want with optional _path argument
        path = self.static_path + 'images.json' if _path is None else _path

        if len(self.json_df) > 0:

            with open(path, 'w') as f:
                json.dump(self.json_df, f)

            print("Wrote out a fresh " + path + " file! \n" +
                  "  exported data length: " + str(len(self.json_df)) + "\n" +
                  "  output file size: " + str(os.path.getsize(path)) + " bytes")

        else:

            print("...Hmm, didn't write images.json, no assets found!")

    def fetch_online_images(self, _json):

        print('Fetching online images from images.mushroomobserver.org...  \n...this may take a while :)')

        if not os.path.exists(self.static_path + "images/"):
            os.makedirs(self.static_path + "images/")

        with open(_json, 'r') as f:
            images_json = json.load(f)

        print("Found " + str(len(images_json)) + " assets in " + _json + "...")

        for asset in images_json:

            _dir_name = asset['category_id'].replace(" ", "_").lower()

            if not os.path.exists(self.static_path + "images/" + _dir_name):
                os.makedirs(self.static_path + "images/" + _dir_name)

            _cmd = str("curl -L " + asset['src'] +
                       " --output ./static/images/" + _dir_name + "/" + asset['src'].split('/')[-1])

            subprocess.Popen(_cmd, shell=True).wait()

    def export_tgz(self, _dir="images/", _fname="images.tgz"):

        if os.path.exists(self.static_path + _dir):

            _fname = self.static_path + _fname

            print("Writing " + _fname + "...\n...")

            with tarfile.open(_fname, "w:gz") as tar:
                tar.add(self.static_path + _dir, arcname=os.path.basename(self.static_path + _dir))

            print("Finished writing " + _fname + " :)")

        else:

            print("Couldn't find " + _fname + " :(")

    # just another way we can snag a random asset without doing a set operation:
    @staticmethod
    def _rand_file(_dir):
        for f in glob.glob(_dir + "*.jpg"):
            if random.random() < 0.1 and f is not None:
                return f

    def split_training_testing(self):

        full_set = set()
        set_size = 0

        _train_set = set()
        _train_dir = "training/"
        _train_fname = "train.tgz"

        _test_set = set()
        _test_dir = "testing/"
        _test_fname = "test.tgz"

        if os.path.exists(self.static_path + "images/"):

            for _set in _train_dir, _test_dir:

                if not os.path.exists(self.static_path + _set):
                    os.makedirs(self.static_path + _set)

            _dirs = glob.glob(self.static_path + "images/*/")

            """add a random half of the available assets to _train_set for each directory:"""

            for d in _dirs:

                _files = glob.glob(d + "/*.jpg")

                # make sure sure are using count that is an even integer:
                _count_per_set = floor(len(_files) / 2) * 2

                for x in range(_count_per_set):
                    full_set.add(_files[x])

            set_size = int(len(full_set) / 2)

            for _ in range(set_size):
                _train_set.add(random.sample(full_set, 1)[0])

        """add the remaining assets to _test_set"""

        _test_set = full_set - _train_set

        set_msg = str(
            'full set size: ' + set_size.__str__() + '\n' +
            'test set size: ' + len(_test_set).__str__() + '\n' +
            'training set size: ' + len(_train_set).__str__()
        )

        print(set_msg)

        """copy files from full set into train / test directories"""

        test = {'dir': _test_dir, 'set': _test_set, 'tgz': _test_fname}
        train = {'dir': _train_dir, 'set': _train_set, 'tgz': _train_fname}

        for _path in train, test:

            _dir = _path['dir']
            _set = _path['set']
            _tgz = _path['tgz']

            if not os.path.exists(self.static_path + _dir):
                os.makedirs(self.static_path + _dir)

            for f in _set:

                binomen = f.split('/')[-2]
                fname = f.split('/')[-1]

                if not os.path.exists(self.static_path + _dir + binomen):
                    os.makedirs(self.static_path + _dir + binomen)

                copyfile(f, self.static_path + _dir + binomen + "/" + fname)

            # write archive:
            self.export_tgz(_dir=_dir, _fname=_tgz)

    def write_categories_json(self, _path=None):

        path = self.static_path + 'categories.json' if _path is None else _path

        cats_df = []
        _tmp_df = set()

        for _obj in self.json_df:

            _len = len(_tmp_df)

            obj = {
                'id': _obj['category_dir'],
                'name': _obj['category_id'],
                'supercategory': 'fungi'
            }

            _tmp_df.add(_obj['category_id'])

            if len(_tmp_df) > _len:
                cats_df.append(obj)

        if len(cats_df) > 0:

            with open(path, 'w') as f:
                json.dump(cats_df, f)

            print("Wrote out a fresh " + path + " file! \n" +
                  "  exported data length: " + str(len(cats_df)) + "\n" +
                  "  output file size: " + str(os.path.getsize(path)) + " bytes")

        else:

            print("...Hmm, didn't write category.json, no fields found!")
