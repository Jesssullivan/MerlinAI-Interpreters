#!/usr/bin/env python3
"""
Jess Sullivan EBPP Python attempt 10.15.18
:)
This tool  is supposed to create arbitrary sets of dictionaries
and lists while calculating and saving "birbscores" on the fly.
"E:/EBPP_Shared/files/ebd_obj.txt" is example full data path
"""
from datetime import datetime
import sys
temp_mac = "temp.txt"
temp = "E:/EBPP_Shared/files/temp.txt"
file = "E:/EBPP_Shared/files/ebd_relMay-2018.txt"
WD = {}
# https://pynative.com/python-mysql-update-data/
import mysql.connector
from mysql.connector import Error
from mysql.connector import errorcode

# cursor.execute("CREATE TABLE Table_test_1 (name VARCHAR(255), address VARCHAR(255))")
linenum = 0  # startingnum to see break point
with open(temp_mac, encoding="utf8") as f:
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
        try:
            WD[Ccode][spname][Mdate]["sum"]
        except:
            WD[Ccode][spname][Mdate]["sum"] = 0
        try:
            WD[Ccode][spname][Mdate]["CT"]
        except:
            WD[Ccode][spname][Mdate]["CT"] = 0
        # Below calculate running average
        WD[Ccode][spname][Mdate]["sum"] = WD[Ccode][spname][Mdate]["sum"] + obs_ct
        WD[Ccode][spname][Mdate]["CT"] = WD[Ccode][spname][Mdate]["CT"] + 1
        # this can be done at any time once the above sum and CT are calculated, not appending
        # running_num at this time due to space issues
        running_num = WD[Ccode][spname][Mdate]["CT"] / WD[Ccode][spname][Mdate]["sum"]
        val = ("John", "Highway 21")
        linenum += 1
        print(linenum, Ccode, spname, running_num)
try:
    conn = mysql.connector.connect(host='ebpp-1.cinxlnfuujhq.us-east-1.rds.amazonaws.com',
                                   database='jessdev',
                                   user='jessdev',
                                   password='Jess.7699')
except mysql.connector.Error as error:
    print("Failed to update record to database: {}".format(error))
cursor = conn.cursor(buffered=True)
for Ccode_l in WD:
    for spname_l in WD[Ccode_l]:
        for Mdata_l in WD[Ccode_l][spname_l]:
            running_num = WD[Ccode_l][spname_l][Mdata_l]["CT"] / WD[Ccode_l][spname_l][Mdata_l]["sum"]
            sqlintro = "INSERT INTO Test_2 VALUES("+ Ccode_l+","+spname_l+"," + Mdata_l+"," + running_num + ")"
            cursor.execute(sqlintro)
            conn.commit()
if (conn.is_connected()):
    conn.close()
    print("connection is closed")
    sys.exit()

