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
    list = list.filter(x => x.confirmed == true && x.programmer == undefined && x.accepted == undefined);
    res.render('index', {
      list: list,
    });
    db.close();
  });
});

router.get('/work', function(req, res) {
  database.getList(function(err, db, list) {
    list = list.filter(x => x.confirmed == true && x.programmer == undefined && x.accepted == true && x.workshop == 1 && x.acc === 1);
    res.render('index', {
      list: list,
    });
    db.close();
  });
});


router.get('/workshops', function(req, res) {
  database.getList(function(err, db, list) {
    list = list.filter(x => x.confirmed == true && x.programmer == undefined && x.accepted == true && x.workshops == 'Yes' && x.workshopMail != true);
    list.map(doc => {
      app.mailer.send('workshop', {
        to: doc.email,
        subject: 'Mutex workshop selection',
        fullname: doc.fullname,
        link: 'http://ieee-zsb.org/events/mutex/workshop?id=' + doc._id,
      }, function(err, message) {
        if (err) {
          console.log(err);
        } else {
          database.updateDoc(doc._id, {$set: {workshopMail: true}}, function(err, db) {
            if (err) {
              console.log(err);
            }
            if (db) db.close();
          });
        }
      });
    });
    res.send('OK');
    if (db) db.close();
  });
});

router.get('/invite', function(req, res) {
  database.getList(function(err, db, list) {  /* Updated error checking */
    if (err) {
      console.log(err);
    } else {
      list = list.filter(x => x.confirmed == true && x.programmer == undefined && x.accepted == true && x.invited != true && x.acc === 1);
      list.map(doc => {
        ejs.renderFile(__dirname + '/../views/invitation.ejs', {
          code: doc._id,
          qr: qr.imageSync(doc._id.toString(), {type: 'svg'}),
          fullname: doc.fullname,
          email: doc.email,
          base: 'file://' + global.pwd,
          workshop: doc.acc != undefined && doc.acc !== false && doc.acc.toString().match(/0|1|2/)? ['AI', 'Cloud', 'IoT'][doc.acc] : 'N/A',
        }, function(err, str) {
          if (err) {
            console.log(err);
          } else {
            pdf.create(str, {
              format: 'A4',
              height: "42cm",
              width: "29.7cm",
              timeout: 120000,
            }).toBuffer(function(err, buffer) {
              if (err) {
                console.log(err);
              } else {
                app.mailer.send('mail', {
                  to: doc.email,
                  subject: 'Mutex event invitation',
                  fullname: doc.fullname,
                  attachments: [{filename: "Mutex_Invitation.pdf", contents: buffer}]
                }, function(err, message) {
                  if (err) {
                    console.log(err);
                  } else {
                    database.updateDoc(doc._id, {$set: {invited: true}}, function(err, db) {
                      if (err) {
                        console.log(err);
                      }
                      if (db) db.close();
                    });
                  }
                });
              }
            });
          }
        });
      });
    }
    res.send('OK');
    if (db) db.close();
  });
});

router.get('/send', function(req, res) {
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
          base: 'file://' + global.pwd,
          workshop: doc.acc != undefined && doc.acc !== false && doc.acc.toString().match(/0|1|2/)? ['AI', 'Cloud', 'IoT'][doc.acc] : 'N/A',
        }, function(err, str) {
          pdf.create(str, {
            format: 'A4',
            height: "42cm",
            width: "29.7cm"
          }).toBuffer(function(err, buffer) {
            app.mailer.send('mail', {
              to: doc.email,
              subject: 'Mutex event invitation',
              fullname: doc.fullname,
              attachments: [{filename: "Mutex_Invitation.pdf", contents: buffer}]
            }, function(err, message) {
              if (err) {
                console.log(err);
              } else {
                database.updateDoc(doc._id, {$set: {invited: true}}, function(err, db) {
                  if (err) {
                    console.log(err);
                  }
                  if (db) db.close();
                });
              }
            });
          });
        });
      }
    });
    res.send('OK');
  }
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
          base: 'file://' + global.pwd,
          workshop: doc.acc != undefined && doc.acc !== false && doc.acc.toString().match(/0|1|2/)? ['AI', 'Cloud', 'IoT'][doc.acc] : 'N/A',
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
