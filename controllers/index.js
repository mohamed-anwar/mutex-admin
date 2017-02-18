const router = require('express').Router();
const database = require('../models/database');
const qr = require('qr-image');
const ejs = require('ejs');
const pdf = require('html-pdf');
var app = global.app;

router.get('/', function(req, res) {
  database.getList(function(err, db, list) {
    list = list.filter(x => x.confirmed == true).filter(x => x.accepted != false);
    res.render('index', {
      list: list,
    });
    db.close();
  });
});

router.get('/invitation', function(req, res) {
  var id = req.query.id;
  database.getDoc(id, function(err, db, doc) {
    if (err) {

    } else {
      ejs.renderFile(__dirname + '/../views/invitation.ejs', {
        qr: qr.imageSync(id, {type: 'svg'}),
        fullname: doc.fullname,
        email: doc.email,
      }, function(err, str) {
        pdf.create(str, {
          format: 'A4',
          height: "42cm",
          width: "29.7cm"
        }).toBuffer(function(err, buffer) {
          app.mailer.send('mail', {
            to: doc.email,
            subject: 'Mutex event invitation',
            attachments: [{filename: "invitation.pdf", contents: buffer}]
          }, function(err, message) {
            //res.header('Content-Type', 'text/plain');
            //res.send(message);
            res.send('Sent');
          });
        });
      });
    }
  });
});

module.exports = router;
