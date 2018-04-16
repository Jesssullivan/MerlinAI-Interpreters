var express= require('express');
var bodyParser= require('body-parser');
var app= express();
var mysql= require('mysql');
//MySQL section
var con= mysql.createConnection({
host: "******",
user: "******",
password: "******",
database: "******"
});
//Queries birb scores for given species
app.use(bodyParser.urlencoded({ extended: true })); 
app.post('/myaction', function(req, res) {
var Species= req.body.Species;
  con.query("SELECT X1 FROM table1 WHERE X8= '" + Species + "'", function(err, rows, fields) {
  if (!err)
//Returns results to browser
res.send(rows);
  else
    console.log('Error while performing Query.');
});
});
app.listen(8080, function() {
console.log('Server running...:) ');
});
