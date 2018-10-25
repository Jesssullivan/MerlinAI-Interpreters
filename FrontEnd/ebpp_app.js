var mysql = require("mysql");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8080;
var path = require("path");

var con = mysql.createConnection({
    host: "ebpp-1.cinxlnfuujhq.us-east-1.rds.amazonaws.com",
    user: "jessdev",
    password: "Jess.7699",
    database: "jessdev"
});
app.use(bodyParser.text({ type: 'text/html' }));

app.get('/',function(req,res){
    res.sendFile(path.join(__dirname+'/ebpp_form.html'));

});

app.get('/request', function(req, res) {
    let Location_code = req.query.locations.split(':')[0];
    console.log(Location_code);
    let sql = 'SELECT * FROM EBPP_3 WHERE spname_l = '
        + mysql.escape(req.query.Species) + ' AND Mdata_l = '
        + mysql.escape(req.query.Date) +' AND Ccode_l = '
        + mysql.escape(Location_code);
    con.query(sql, function (err, result) {
        if (err) throw err;
            res.send(result);
    });
});
app.listen(port,function(){
    console.log(`Server listening on port ${port}`);
});