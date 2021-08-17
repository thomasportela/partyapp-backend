require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(require('./routes/auth'));
app.use(require('./routes/uploads'));
app.use(require('./routes/searches'));
app.use(require('./routes/usersInfo'));
app.use(require('./routes/partiesInfo'));
app.use(require('./routes/notifications'));
app.use(require('./routes/ticketsSystem'));
app.use(require('./routes/friendshipSystem'));
app.use(require('./routes/verificationCode'));


var server = app.listen(port, function() {
    var host = server.address().address
    var port = server.address().port
});