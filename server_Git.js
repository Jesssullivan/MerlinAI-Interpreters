var express= require('express');
var bodyParser= require('body-parser');
var app= express();
var mysql= require('mysql');
//MySQL section
var con= mysql.createConnection({
host: "RDS Server",
user: "******",
password: "******",
database: "******"
});

app.use(bodyParser.urlencoded({ extended: true })); 
app.post('RDS Server/myaction', function(req, res) {
var Species= req.body.Species;
  con.connect();
  con.query("SELECT * FROM table1 WHERE X8= '" + Species + "'", function(err, rows, fields) {
  if (!err)
console.log('The solution is: ', rows);
  else
    console.log('Error while performing Query.');

});
con.end();
res.send('You sent a query!:)');
});

app.listen(8080, function() {
console.log('Server running...:) ');
});





