var mysql = require("mysql");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8080;
var path = require("path");

var con = mysql.createConnection({
    host: "ebpp-1.******.amazonaws.com",
    user: "******",
    password: "******",
    database: "******"
});

app.use(bodyParser.text({ type: 'text/html' }));

app.get('/',function(req,res){
    res.sendFile(path.join(__dirname+'/test_1.html'));
});


app.get('/S1', function(req, res) {
    var sql = 'SELECT * FROM ****** WHERE spname_l = ' + mysql.escape(req.query.Species) + ' LIMIT 0,5';
    con.query(sql, function (err, result) {
        if (err) throw err;
        res.send(result);
    });
});
app.listen(port,function(){
    console.log(`Server listening on port ${port}`);
});