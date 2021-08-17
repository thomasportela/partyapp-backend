const mysql = require('mysql');

var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'partyappdb',
})

con.connect(function(err){
    if(err){return console.log(err)}
    else{return console.log('connected')}
})

module.exports = con;