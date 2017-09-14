var request = require('request');
var server = require('./lib/server');

var debug  = require('debug')('broker');

//var SECURE_KEY = '/etc/letsencrypt/live/broker.getblocky.com/privkey.pem'; //__dirname + '/../key.pem';
//var SECURE_CERT = '/etc/letsencrypt/live/broker.getblocky.com/cert.pem'; //__dirname + '/../cert.pem';

var ascoltatore = {
  type: 'redis',
  redis: require('redis'),
  db: 12,
  port: 6379,
  host:  'redis'
}; //process.env.REDIS_HOST

var settings = {
  port: process.env.NODE_PORT || 1883,
  backend: ascoltatore,
  allowNonSecure: true,
  secure: {
    port: process.env.SECURE_PORT || 8443,
    keyPath: process.env.SECURE_KEY,
    certPath: process.env.SECURE_CERT,
  },
  http: {
    port: process.env.WS_PORT || 8083,
    bundle: true,
    static: './'
  },
  https: {
    port: process.env.WSS_PORT || 8883,
    bundle: true,
    static: './'
  }
};

var app = new server.start(settings);

app.on('published', function(packet, client) {
  if (packet.topic.indexOf('$SYS') === 0 || !client || client === null || !client.authKey)
    return; // doesn't print stats info

  debug('ON PUBLISHED', packet.payload.toString(), 'on topic', packet.topic);

  var topicPrefix = '/' + client.authKey + '/';

  if (packet.topic.indexOf(topicPrefix) !== 0 || packet.payload.toString() == '')
    return;

  // save message to backend
  var topic = packet.topic.replace(topicPrefix, '');

  if (!topic) {
    debug('Blank topic used. Ignore this message');
    return;
  }      

  var postData = {
    authKey: client.authKey.toString(),
    topic: topic.toString(),
    data: packet.payload.toString()
  }

  request({
    method: 'post',
    body: postData,
    json: true,
    uri: process.env.PROCESS_MESSAGE_API,
    headers: {
      'x-api-key': process.env.API_KEY
    }
  }, function (error, response, body) {
    if (error) {
      debug('Failed to send message to backend: ', error);
      return;
    }

    if (response.statusCode == 200) {
      debug('Sent message to backend successfully');
    } else {
      debug(body.toString());
      debug('Failed to send message to backend');
    }
  });
});

app.on('ready', function() {
  debug('MQTT Server listening on port', process.env.NODE_PORT);
});

app.on('clientConnected', function(client) {
  debug('client connected', client.id);
});

app.on('clientDisconnected', function(client) {

  // if client is not device, ignore this event
  if (!client.chipId)
    return;

  debug('Device going offline', client.chipId);

  // broadcast message for web clients to update device status
  var message = {
    topic: '/' + client.authKey + '/' + client.chipId + '/offline',
    payload: '0',
    qos: 0, // 0, 1, or 2
    retain: false // or true
  };

  app.publish(message, function() {
    debug('Send message to inform device being offline!');
  });

  // update device status to offline
  var postData = {
    authKey: client.authKey.toString(),
    chipId: client.chipId.toString(),
    status: 0 //0: offline, 1: online
  }

  request({
    method: 'post',
    body: postData,
    json: true,
    uri: process.env.UPDATE_DEVICE_STATUS_API,
    headers: {
      'x-api-key': process.env.API_KEY
    }
  }, function (error, response, body) {
    if (error) {
      debug('Failed to update device status: ', error);
      return;
    }

    if (response.statusCode == 200) {
      debug('Update device status successfully');
    } else {
      debug('Failed to update device status: ', body);
    }

  });
});

