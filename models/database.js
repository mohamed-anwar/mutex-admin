var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;

var mongoURI = process.env.MONGO_URI;
var collection = "testing";

exports.getList = function(callback) {
  MongoClient.connect(mongoURI, function(err, db) {
    db.collection(collection).find({}).toArray(function(err, items) {
      if (err) {
        callback(err, db);
      } else {
        callback(null, db, items);
      }
    });
  });
};

exports.getDoc = function(id, callback) {
  MongoClient.connect(mongoURI, function(err, db) {
    db.collection(collection).findOne({'_id': new ObjectId(id)}, function(err, doc) {
      if (err) {
        callback(err, db);
      } else {
        callback(err, db, doc);
      }
    });
  });
};

exports.decline = function(id, callback) {
  MongoClient.connect(mongoURI, function(err, db) {
    if (err) {
      callback(err, db);
    } else {
      db.collection(collection).findOne({'_id': new ObjectId(id)}, function(err, doc) {
        if (err) {
          callback(err, db);
        } else {
          db.collection(collection).update({'_id': new ObjectId(id)}, {$set: {accepted: false}}, function(err, count) {
            if (err) {
              callback(err, db);
            } else {
              callback(null, db);
            }
          });
        }
      });
    }
  });
}
