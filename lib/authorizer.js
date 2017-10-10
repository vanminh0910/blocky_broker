var debug    = require('debug')('broker');
var request = require('request');

module.exports.authenticate = function(client, username, password, callback) {
  if (!password) {
    callback(null, false);
    return;
  }

  var postData = {
    authKey: password.toString()
  }

  request({
    method: 'post',
    body: postData,
    json: true,
    uri: process.env.VALIDATE_AUTH_KEY_API,
    headers: {
      'x-api-key': process.env.API_KEY
    }
  }, function (error, response, body) {
    if (error) {
      debug('Failed to validate authentication key: ', error);
      callback(null, false);
      return;
    }

    var statusCode = response.statusCode;
    
    if (statusCode == 200) {
      client.authKey = password;
      client.chipId = username;
      callback(null, true);
    } else {
      callback(null, false);
    }      
  });
}

module.exports.authorizePublish = function(client, topic, payload, callback) {
  debug('AUTHORIZING PUBLISH', client.authKey == topic.split('/')[0]);
  debug('PAYLOAD', payload.toString());
  debug('TOPIC', topic);
  callback(null, client.authKey == topic.split('/')[0]);
}

module.exports.authorizeSubscribe = function(client, topic, callback) {
  debug('AUTHORIZING SUBSCRIBE', client.authKey == topic.split('/')[0]);
  debug('TOPIC', topic);
  callback(null, client.authKey == topic.split('/')[0]);
}
