var mysql = require("mysql");
const bodyParser = require('body-parser');
const port = process.env.PORT || 8080;
var path = require("path");

var express = require('express')
    , logger = require('morgan')
    , app = express()
    , template = require('jade').compileFile(__dirname + '/source/templates/default.jade');

var con = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "Jess.7699",
    database: "Mallard"
});

app.get('/request', function(req, res) {
    let Location_code = req.query.locations.split(':')[0];
    var SP = req.query.Species;
    var D = req.query.Date;
    console.log(Location_code);
    let sql = 'SELECT * FROM mallard WHERE spname_l = '
        + mysql.escape(req.query.Species) + ' AND Mdata_l = '
        + mysql.escape(req.query.Date) +' AND Ccode_l = '
        + mysql.escape(Location_code);
    con.query(sql, function (err, results) {
        if (err) throw err;
        var re = JSON.stringify(results).split(",")[3];
        var ret = re.split(":")[1];
        var retu = ret.substring(0, ret.length - 2);
        var html = template({func_h: retu, SP : SP, D : D});
        res.send(html)
    })
});

app.use(logger('dev'));
app.use(express.static(__dirname + '/static'));

app.get('/', function (req, res, next) {
    try {
        var html = template({ title: 'Home' });
        res.send(html);
    } catch (e) {
        next(e)
    }
});

app.get('/ebpp', function (req, res, next) {
    try {
        res.sendFile(path.join(__dirname+'/source/templates/ebpp_form.html'));
    } catch (e) {
        next(e)
    }
});

app.listen(port,function(){
    console.log(`Server listening on port ${port}`);
});
