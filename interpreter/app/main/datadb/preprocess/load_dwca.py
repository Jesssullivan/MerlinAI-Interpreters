import requests
import os

# load common names:
from common import *

"""Make sure DwCAReader is installed;
python3 -m venv mushroomobserver_venv
source mushroomobserver_venv/bin/activate
pip3 install -r requirements.txt
"""
from dwca.read import DwCAReader
from dwca.darwincore.utils import qualname as qn


# todo:
#  - figure out how we'll want to use dwca as part of
#  - the preprocessing --> train pipeline in the future


class MODwca:

    def __init__(self,
                 _static_path=STATIC_PATH,
                 _gbif_path=GBIF_PATH,
                 _gbif_url=GBIF_URL):

        # we'll put all row & id data in here:
        self.gbif = None

        # paths for fetching and saving the gbif export:
        self.gbif_path = _gbif_path
        self.gbif_url = _gbif_url
        self.static_path = _static_path

        # by default, lets put the export here:
        if not os.path.exists(self.static_path):
            os.makedirs(self.static_path)

        # load the data into memory:
        try:
            # if we haven't yet tried fetching the archive, do that first:
            if not os.path.exists(self.gbif_path):
                self.fetch_archive()

            # load:
            print("Loading row data into memory...")
            self.load_rows()

            lenrows = len(self.gbif) if self.gbif is not None else 0

            if lenrows:
                print("...Loaded " + lenrows.__str__() + " entries! :)")
            else:
                print("...Hmm, didn't load any entries (lenrows=" + lenrows.__str__() + ")")

        except OSError:
            print("Error while loading DWCA / GBIF data!  :(")

    def fetch_archive(self, _path=None):

        url = self.gbif_url
        r = requests.get(url)

        # let the caller save off archive somewhere else if they want with optional _path argument
        path = self.gbif_path if _path is None else _path

        with open(path, 'wb') as f:
            f.write(r.content)

    def load_rows(self):

        with DwCAReader(self.gbif_path) as dwca:

            # We can now interact with the 'dwca' object
            print("Read core type: " + dwca.descriptor.core.type.__str__() + "! :)")

            # Check if a Darwin Core term in present in the core file
            if 'http://rs.tdwg.org/dwc/terms/locality' in dwca.descriptor.core.terms:
                print("Locality term is present! :)")
            else:
                print("Locality term is not present.  :(")

            # Using full qualnames for DarwincCore terms (such as 'http://rs.tdwg.org/dwc/terms/country') is verbose...
            # The qualname() helper function make life easy for common terms.
            # (here, it has been imported as 'qn'):
            qn('locality')
            # => u'http://rs.tdwg.org/dwc/terms/locality'
            # Combined with previous examples, this can be used to things more clear:
            # For example:
            if qn('locality') in dwca.descriptor.core.terms:
                pass

            # Or:
            if dwca.descriptor.core.type == qn('Occurrence'):
                pass

            # load row data into memory
            self.gbif = dwca.rows
