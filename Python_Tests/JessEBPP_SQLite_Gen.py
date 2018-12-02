#!/usr/bin/env python3
from datetime import datetime
import sys
import sqlite3

# files
temp_unix = "temp.txt"
file_unix = "Python_Tests/ebd_relMay-2018.txt"
temp = "E:/EBPP_Shared/files/temp.txt"
file = "E:/EBPP_Shared/files/ebd_relMay-2018.txt"

WD = {}  # single origin dictionary WD
import mysql
from mysql.connector import Error

linenum = 0  # starting num, handy- not used for calculating anything
with open(file_unix, encoding="utf8") as f:
    for line in f:
        RL = line.rstrip().split('\t')
        Ccode = RL[17]  # County Code
        spname = RL[4]  # species name
        obs_ct = RL[8]  # obs count
        obs_dt = RL[27]  # obs date
        try:  # evaluating obs count value - make sure it is a number
            obs_ct = int(obs_ct)
        except ValueError:
            obs_ct = 1  # if str or 'X', I know there was at least one sighting xD
        try:  # evaluating dates for %m-%d
            Ydate = datetime.strptime(obs_dt, '%Y-%m-%d')  # datetime obj with year
        except KeyError:  # if not a date, make something up
            Ydate = datetime.strptime(obs_dt, '%Y-%m-%d')
        except ValueError:
            Ydate = datetime.strptime("1100-01-01", '%Y-%m-%d')
        Mdate = str(Ydate)[5:10]  # does not contain year, just %m-%d
        try:  # establish a dict for each Ccode
            WD[Ccode]
        except KeyError:
            WD[Ccode] = {}
        try:  # establish a dict for each species in its Ccode
            WD[Ccode][spname]
        except KeyError:
            WD[Ccode][spname] = {}
        try:  # establish a dict for each date for each species in its Ccode
            WD[Ccode][spname][Mdate]
        except KeyError:
            WD[Ccode][spname][Mdate] = {}
        # sum is used to calculate average "running_num" later
        try:
            WD[Ccode][spname][Mdate]["sum"]
        except:
            WD[Ccode][spname][Mdate]["sum"] = 0
        # CT is used to calculate average "running_num" later, CT/sum
        try:
            WD[Ccode][spname][Mdate]["CT"]
        except:
            WD[Ccode][spname][Mdate]["CT"] = 0
        # once the above is established:
        WD[Ccode][spname][Mdate]["sum"] = WD[Ccode][spname][Mdate]["sum"] + obs_ct
        WD[Ccode][spname][Mdate]["CT"] = WD[Ccode][spname][Mdate]["CT"] + 1
        linenum += 1

        print(linenum)
        if linenum >= 10000:
            break

# Sqlite section
conn = sqlite3.connect('Owl_1.db')

c = conn.cursor()s

for Ccode_l in WD:
    for spname_l in WD[Ccode_l]:
        for Mdata_l in WD[Ccode_l][spname_l]:
            running_num = WD[Ccode_l][spname_l][Mdata_l]["CT"] / WD[Ccode_l][spname_l][Mdata_l]["sum"]
            # Unclear ATM why this works better
            C = Ccode_l
            S = spname_l
            M = str(Mdata_l)
            R = str(running_num)
            sql = '''INSERT INTO Owl_1(Ccode_l,spname_l,Mdata_l,running_num)
              VALUES(?,?,?,?)'''
            val = (C,S,M,R)
            print(Ccode_l, spname_l, Mdata_l, running_num)
            c.execute(sql, val)
            conn.commit()
# finally:
conn.close()