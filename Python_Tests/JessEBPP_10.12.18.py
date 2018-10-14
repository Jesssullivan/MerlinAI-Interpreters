#!/usr/bin/env python3
"""
Jess Sullivan EBPP Python attempt 10.12.18
:)
This tool  is supposed to create arbitrary sets of dictionaries
and lists while calculating and saving "birbscores" on the fly.
"""
WD = {}
from datetime import datetime
with open("temp.txt", encoding="utf8") as f:
    for line in f:
        RL = line.rstrip().split('\t')
        # define some basic variables
        Ccode = RL[17]  # County Code
        spname = RL[4]  # species name
        obs_ct = RL[8]  # obs count
        obs_dt = str(RL[27])  # obs date
        try:  # evaluating obs count value - make sure it is a number
            obs_ct = int(obs_ct)
        except ValueError:
            obs_ct = 1  # if str or 'X', I know there was at least one sighting xD
        try: # evaluating dates for %m-%d
            Ydate = datetime.strptime(obs_dt, '%Y-%m-%d')  # datetime obj with year
        except ValueError:  # if not a date, make something up
            Ydate = datetime.strptime("1100-01-01", '%Y-%m-%d')
        Mdate = str(Ydate)[5:10]  # does not contain year, just %m-%d
        try: # establish a dict for each Ccode
            WD[Ccode]
        except KeyError:
            WD[Ccode] = {}
        try: # establish a dict for each species in its Ccode
            WD[Ccode][spname]
        except KeyError:
            WD[Ccode][spname] = {}
        try: # establish a dict for each date for each species in its Ccode
            WD[Ccode][spname][Mdate]
        except KeyError:
            WD[Ccode][spname][Mdate] = {"list":[]}
        try: # establish a list for each date for each species in its Ccode, to hold observation #s as we go
            WD[Ccode][spname][Mdate]["Score"]
        except KeyError:  # here we put the current score info, replacing as we go (only most up-to-date list)
            WD[Ccode][spname][Mdate]["Score"] = []
        # here we add new observation count numbers to the correct list:
        WD[Ccode][spname][Mdate]["list"].append(obs_ct)
        # calc current birbscore from current line against "list" up to now:
        birbscore = obs_ct / max(WD[Ccode][spname][Mdate]["list"])
        # this only saves the most current data in list form, to be exported / processed in MySQL etc
        WD[Ccode][spname][Mdate]["Score"] = [spname,birbscore,Mdate,Ccode]
        # the output looks like this:
        print(WD[Ccode][spname][Mdate]["Score"])