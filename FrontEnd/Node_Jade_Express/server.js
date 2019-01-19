/*
1.17.19 - Jess Sullivan - EBPP app server.
*/

// local functionality requires a
const port = process.env.PORT || 8080;
const mysql = require("mysql");
const bodyParser = require('body-parser');
const express = require('express')
    , app = express()
    , template = require('jade').compileFile(__dirname + '/source/templates/home.jade');

/*  Define MySQL location
local functionality requires a MySQL server running locally.
You will refer to a table in the database specified below.  Once  a MySQL db is setup,
 it should remain functional on the local machine.  MySQL Workbench is a nice solution
 for managing local databases.  See https://www.mysql.com/products/workbench/
*/

 conloc = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "Jess.7699",
    database: "Mallard"
});

 // log initial test results to verify functionality

conloc.query("SELECT * FROM EBPP_28 WHERE spname_l = 'Common Loon'", function (err, results) {
    if (err) throw err;
    console.log(results)
});

/* Global app.use bits, parsing etc */

app.use(express.static(__dirname + '/static'));
app.use(bodyParser.json({ type: 'application/*+json' }));

/* MySQL Queries */

app.get('/What', function(req, resu) {
    try {
        console.log('got a What request');
        // take the first part of req.query.location before the ":"
        let loc = req.query.location.split(':')[0];
        // get county name
        let locname = req.query.location.split(':')[1];
        let currentWeek = new Date(req.query.Date);
        let lastWeek = new Date();
        // format date with "MM-DD" as min and max dates
        lastWeek.setDate(currentWeek.getDate() - 7);
        let MinDateRange = currentWeek.getMonth() + '-' + lastWeek.getDate();
        let MaxDateRange = currentWeek.getMonth() + '-' + currentWeek.getDate();
        // construct SQL "What" Query with this date range
        let What = 'SELECT * FROM EBPP_28 WHERE Mdata_l BETWEEN '
            + mysql.escape (MinDateRange) +' AND ' + mysql.escape (MaxDateRange) + ' AND Ccode_l = '
            + mysql.escape(loc) + 'ORDER BY running_num limit 0,20';

        // preform a the above query on db "conloc"
        conloc.query(What, function (err, res) {
            if (err) throw err;
            let DataReturn = '';
            //TODO: Data Being Returned to Browser - WHAT:
            // change semicolon return in favor of something prettier for browser
            /*
            Currently, we loop through values of .spname_l to collect a semicolon-separated data to return to browser
             */
            try {
                for (let i = 0; i <= 10; i++) {
                    SpeciesReturn = res[i].spname_l;
                    DataReturn = (DataReturn +' '+ SpeciesReturn +"\r\n")
                }
            } catch (e) {
                console.log('ran for species, finished')
            }
                let html = template({
                    return_val_What: DataReturn,
                    MinDateRange : MinDateRange,
                    MaxDateRange : MaxDateRange,
                    loc: locname});
                resu.send(html)  // Note this is the extent of data return thus far
        })
    } catch (e) {
        resu.send("no data available for these parameters")
    }
});

app.get('/When', function(req, resu) {
    try {
        let loc = req.query.location.split(':')[0];
        let locname = req.query.location.split(':')[1];
        let D = ''; // filler at this time.  No Data.
        let SP = req.query.Species;
        console.log('got a When request');

// make query

        let When = 'SELECT * FROM EBPP_28 WHERE spname_l = '
            + mysql.escape(SP) +' AND Ccode_l = '
            + mysql.escape(loc) + 'ORDER BY running_num limit 0,20';

        conloc.query(When, function (err, res) {
            if (err) throw err;
            let DataReturn = '';
            // loop in a "try" to get all best dates
            try {
                for (let i = 0; i <= 10; i++) {
                    Mdatareturn = res[i].Mdata_l;
                    DataReturn = (DataReturn +' '+ Mdatareturn +"\r\n")
                }
            } catch (e) {
                console.log('ran for dates, finished')
            }
            html = template({return_val_When : DataReturn ,SP : SP, D : D, loc: locname});
            resu.send(html);
        });
    } catch (e) {
        resu.send("no data available for these parameters")
    }
});

/* Site directory, one pager* */

app.get('/', function (req, res, next) {
    try {
        var html = template({ title: 'home' });
        res.send(html);
    } catch (e) {
        next(e)
    }
});

/* Listen on port */

app.listen(port,function(){
    console.log(`Server listening on port ${port}`);
});
