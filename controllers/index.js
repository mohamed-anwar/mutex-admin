const router = require('express').Router();
const database = require('../models/database');
const qr = require('qr-image');
const ejs = require('ejs');
const pdf = require('html-pdf');
var app = global.app;
var io = global.io;

io.on('connection', function(socket) {
  console.log('User connected');
  socket.on('accept', function(req) {
    database.accept(req.id, req.value, function(err, db) {
      if (err) {
        socket.emit('error', {id: req.id});
      } else {
        socket.emit('success', {id: req.id});
      }
      if (db) db.close();
    });
  });
});

router.get('/', function(req, res) {
  database.getList(function(err, db, list) {
    list = list.filter(x => x.confirmed == true).filter(x => x.accepted == undefined);
    res.render('index', {
      list: list,
    });
    db.close();
  });
});

router.get('/accepted', function(req, res) {
  database.getList(function(err, db, list) {
    list = list.filter(x => x.confirmed == true).filter(x => x.accepted == true);
    res.render('index', {
      list: list,
    });
    db.close();
  });
});

router.get('/declined', function(req, res) {
  database.getList(function(err, db, list) {
    list = list.filter(x => x.confirmed == true).filter(x => x.accepted == false);
    res.render('index', {
      list: list,
    });
    db.close();
  });
});

router.get('/invitation', function(req, res) {
  var id = req.query.id;

  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(404).send('ERR::INV_ID');
  } else {
    database.getDoc(id, function(err, db, doc) {
      if (err) {
        res.status(404).send('ERR::DB');
      } else {
        ejs.renderFile(__dirname + '/../views/invitation.ejs', {
          code: id,
          qr: qr.imageSync(id, {type: 'svg'}),
          fullname: doc.fullname,
          email: doc.email,
        }, function(err, str) {
          pdf.create(str, {
            format: 'A4',
            height: "42cm",
            width: "29.7cm"
          }).toStream(function(err, buffer) {
            /*app.mailer.send('mail', {
              to: doc.email,
              subject: 'Mutex event invitation',
              attachments: [{filename: "invitation.pdf", contents: buffer}]
            }, function(err, message) {
              res.send('Sent');
            });*/
            buffer.pipe(res);
          })
        });
      }
    });
  }
});

module.exports = router;
