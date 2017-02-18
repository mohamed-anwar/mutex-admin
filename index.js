var express = require('express');
var auth = require('basicauth-middleware');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mailer = require('express-mailer');
global.io = io;

global.app = app;

mailer.extend(app, {
  from: 'no-reply@ieee-zsb.org',
  host: 'smtp.gmail.com',
  secureConnection: true,
  port: 465,
  transportMethod: 'SMTP',
  auth: {
    user: 'no-reply@ieee-zsb.org',
    pass: process.env.MAIL_PW
  }
});

app.use(express.static(__dirname + '/public'));
app.use(auth(process.env.USERNAME, process.env.PASSWORD));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

require('./controllers/routes')(app);

port = process.env.PORT || 3000;
http.listen(port, function() {
  console.log('Started listening on port ' + port);
});
