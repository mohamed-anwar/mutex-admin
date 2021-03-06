var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;

var mongoURI = process.env.MONGO_URI;
var collection = process.env.DB_COLLECTION;

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

exports.updateDoc = function(id, update, callback) {
  MongoClient.connect(mongoURI, function(err, db) {
    if (err) {
      callback(err, db);
    } else {
      db.collection(collection).findOne({'_id': new ObjectId(id)}, function(err, doc) {
        if (err) {
          callback(err, db);
        } else {
          db.collection(collection).update({'_id': new ObjectId(id)}, update, function(err, count) {
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

exports.accept = function(id, value, callback) {
  MongoClient.connect(mongoURI, function(err, db) {
    if (err) {
      callback(err, db);
    } else {
      db.collection(collection).findOne({'_id': new ObjectId(id)}, function(err, doc) {
        if (err) {
          callback(err, db);
        } else {
          db.collection(collection).update({'_id': new ObjectId(id)}, {$set: {accepted: value}}, function(err, count) {
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
