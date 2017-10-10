var http     = require('http')
  , mosca = require('mosca')
  , authorizer = require('./authorizer')
  , debug = require('debug')('broker');

function app(settings) {

  var server = new mosca.Server(settings, done);


  function done() {}

  server.on('ready', setup);

  function setup() {
    server.authenticate       = authorizer.authenticate;
    server.authorizePublish   = authorizer.authorizePublish;
    server.authorizeSubscribe = authorizer.authorizeSubscribe;
  }

  return server
}

module.exports.start = app;
