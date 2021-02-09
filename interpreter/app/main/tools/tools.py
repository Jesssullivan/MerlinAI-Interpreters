import datetime
import random
import uuid
from pytz import timezone, UTC
import bson


def nowDatetimeUserTimezone(user_timezone):
    tzone = timezone(user_timezone)
    return datetime.datetime.now(tzone)


def nowDatetimeUTC():
    tzone = UTC
    now = datetime.datetime.now(tzone)
    return now


def JsonResp(data, status):
    from flask import Response
    import json
    return Response(json.dumps(data), mimetype="application/json", status=status)


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

