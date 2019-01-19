#!/usr/bin/env python3
from datetime import datetime
import sys
import pymysql  # using this package instead of "mysql"
from pymysql import Error

# files
temp_unix = "temp.txt"
file_unix = "Python_Tests/ebd_relMay-2018.txt"
temp = "E:/EBPP_Shared/files/temp.txt"
file = "E:/EBPP_Shared/files/ebd_relMay-2018.txt"

WD = {}  # single origin dictionary WD
import pymysql
from pymysql import Error

linenum = 0  # starting num, handy- not used for calculating anything

with open(temp_unix, encoding="utf8") as f:
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

# MySQL section.

try:
    conn = pymysql.connect(host='127.0.0.1',
                                   database='Mallard',
                                   user='root',
                                   password='Jess.7699')

except pymysql.Error as error:
    print("Failed to update record to database: {}".format(error))
    sys.exit()

cursor = conn.cursor()  # no "buffered-True" for this package

cursor.execute(  # make a new table in db
    "CREATE TABLE Py_Test_1 (Ccode_l VARCHAR(255), spname_l VARCHAR(255), Mdata_l VARCHAR(255), CT VARCHAR(255), SUM VARCHAR(255))")

# Fill table.  Not calculating running_num as speed savings do not appear to be worthwhile,
# and need CT and SUM for abundance charting

for Ccode_l in WD:
    for spname_l in WD[Ccode_l]:
        for Mdata_l in WD[Ccode_l][spname_l]:
          # running_num = WD[Ccode_l][spname_l][Mdata_l]["CT"] / WD[Ccode_l][spname_l][Mdata_l]["sum"]
            C = Ccode_l  # Unclear ATM why this renaming is working better
            S = spname_l
            M = Mdata_l   # date
            CT = WD[Ccode_l][spname_l][Mdata_l]["CT"]
            SUM = WD[Ccode_l][spname_l][Mdata_l]["sum"]
            val = (C, S, M, CT, SUM)
            sql = "INSERT INTO Py_Test_1 (Ccode_l, spname_l, Mdata_l, CT, SUM) VALUES (%s, %s, %s, %s, %s)"
            print("inserted" + str(val) + "into" + " Py_Test_1")
            cursor.execute(sql, val)
            conn.commit()

# finally:

conn.close()
print("connection is closed, Py_Test_1 calculation complete")
sys.exit()
