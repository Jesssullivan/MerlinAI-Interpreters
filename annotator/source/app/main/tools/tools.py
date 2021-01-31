import datetime
import random
import uuid
from pytz import timezone, UTC
import os
import subprocess
import threading
import time


def nowDatetimeUserTimezone(user_timezone):
    tzone = timezone(user_timezone)
    return datetime.datetime.now(tzone)


def nowDatetimeUTC():
    tzone = UTC
    now = datetime.datetime.now(tzone)
    return now

def randID():
    randid = uuid.uuid4()
    return randid.__str__()


def randUser():
    seal_names =["Yuki", "Hiyori", "Agu"]
    return random.choice(seal_names)


def randSpecies():
    species_names =["cangoo", "blujay", "amecro"]
    return random.choice(species_names)


def randBbox():
    kb = []
    for _ in range(4):
        _val = random.uniform(0, 1)
        kb += [_val]

    return kb


def randString(length):
    randstring = ""
    for _ in range(length):
        randstring += random.choice("AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890")

    return randstring


def randStringCaps(length):
    randstring = ""
    for _ in range(length):
        randstring += random.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")
    return randstring


def randStringNumbersOnly(length):
    randstring = ""
    for _ in range(length):
        randstring += random.choice("23456789")
    return randstring


def validEmail(email):
    import re
    if re.match("^.+\\@(\\[?)[a-zA-Z0-9\\-\\.]+\\.([a-zA-Z]{2,3}|[0-9]{1,3})(\\]?)$", email) is not None:
        return True
    else:
        return False


COLLECT_INT = 30
COLLECT_TRASH = 60

# uploaded files are placed in temporary server side directories:
live_app_list = {}
start_time = time.time()


# serverside paths:
rootpath = os.path.abspath(os.curdir)

# temporary user directories go in here:
inpath = os.path.join(rootpath, 'uploads')
outpath = os.path.join(rootpath, 'downloads')


class Trash(object):

    @staticmethod
    def _force_dir_rm(path):
        # checking and removing user dirs from OS-
        # assuming child threads may occasionally misbehave,
        # best to avoid guessing the state of child threads here in Python
        subprocess.Popen(str('rm -rf ' + path),
                         shell=True,
                         executable='/bin/bash')

    @classmethod
    def _garbage_loop(cls):

        # this is process is what loops around in the garbage daemon's thread.
        while True:

            # most of the time, collector is idle:
            time.sleep(COLLECT_INT)

            for usr in os.listdir(inpath):

                # live app dict is solely managed here;
                # users are added only when daemon finds
                # new directories at each interval `collection_int`
                if usr not in live_app_list.keys():
                    live_app_list[usr] = time.time()

                if time.time() - live_app_list[usr] > COLLECT_TRASH:
                    try:
                        print('removing expired usr directories...')
                        cls._force_dir_rm(os.path.join(inpath, usr))
                        live_app_list.pop(usr)

                    except:
                        print(str('Error while removing expired usr directory:  \n' + usr))

    @classmethod
    def truck(cls):
        if not os.path.exists('uploads'):
            subprocess.Popen(str('mkdir uploads'),
                             shell=True,
                             executable='/bin/bash',
                             encoding='utf8')

        # start garbage loop as daemon- operating as a child to Flask server:
        init_loop = threading.Thread(target=cls._garbage_loop, daemon=True)
        init_loop.start()
