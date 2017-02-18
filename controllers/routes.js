const indexRouter = require('./index');

var routes = function(app) {
  app.use('/', indexRouter);
};

module.exports = routes;
