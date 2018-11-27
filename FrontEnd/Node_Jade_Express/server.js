/*
11.27.18 - Jess Sullivan - EBPP app server.
*/

const port = process.env.PORT || 8080;
const mysql = require("mysql");
const express = require('express')
    , logger = require('morgan')
    , app = express()
    , template = require('jade').compileFile(__dirname + '/source/templates/home.jade');


const bodyParser = require('body-parser');

/* Optional/not needed */
const path = require("path");

/* Define MySQL locationss */

var conloc = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "******",
    database: "******"
});

conloc.query("SELECT * FROM EBPP_28 WHERE spname_l = 'Common Loon'", function (err, results) {
    if (err) throw err;
    console.log(results)
});


var conrds = mysql.createConnection({
    host: "***.rds.amazonaws.com",
    user: "***",
    password: "***",
    database: "***"
});

/* Global app.use bits */

app.use(logger('dev'));
app.use(express.static(__dirname + '/static'));
app.use(bodyParser.json({ type: 'application/*+json' }));
let day = new Date();

/* MySQL Queries */

app.get('/What', function(req, resu) {
    try {
        let loc = req.query.location.split(':')[0];
        /*TODO: create date range + - 1 day*/
        let D = req.query.Date;
        console.log('got a What request');

// make query

        let What = 'SELECT * FROM EBPP_28 WHERE Mdata_l = '
            + mysql.escape (D) +' AND Ccode_l = '
            + mysql.escape(loc) + 'ORDER BY running_num limit 0,20';

        conloc.query(What, function (err, res) {
            if (err) throw err;
            let datar = ("");
            try {
                for (let i = 0; i <= 10; i++) {
                    sp_ret = res[i].spname_l;
                    datar = (datar + " " +sp_ret +"\r\n")
                }
            } catch (e) {
                try {
                    datar = (res[0].spname_l + " " +sp_ret +"\r\n")
                } catch (e) {
                    res.send("no data available for these parameters")
                }
            }
                console.log(datar);
                let html = template({returnr: datar, D : D, loc: loc});
                resu.send(html)
        })
    } catch (e) {
        resu.send("no data available for these parameters")
    }
});



app.get('/When', function(req, resu) {

    try {

        let loc = req.query.location_2.split(':')[0];
        let locname = req.query.location_2.split(':')[1];
        let D = req.query.Date;
        let SP = req.query.Species;
        console.log('got a When request');

// make query

        let When = 'SELECT * FROM EBPP_28 WHERE spname_l = '
            + mysql.escape(SP) +' AND Ccode_l = '
            + mysql.escape(loc) + 'ORDER BY running_num limit 0,20';

        conloc.query(When, function (err, res) {
            if (err) throw err;
            let datar = res[0].Mdata_l;
            html = template({mdater : datar ,SP : SP, D : D, loc: locname});
            resu.send(html);

        });
    } catch (e) {
        resu.send("no data available for these parameters")
    }
});

/* Site directory */

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
