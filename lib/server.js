var http     = require('http')
  , mosca = require('mosca')
  , authorizer = require('./authorizer')
  , debug = require('debug')('broker');

function app(settings) {

  var server = new mosca.Server(settings, done);
  var httpServ = http.createServer();
  function done() {}

  server.attachHttpServer(httpServ);

  server.on('ready', setup);
  httpServ.listen(8083);

  function setup() {
    server.authenticate       = authorizer.authenticate;
    server.authorizePublish   = authorizer.authorizePublish;
    server.authorizeSubscribe = authorizer.authorizeSubscribe;
  }

  return server
}

module.exports.start = app;
