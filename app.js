var request = require('request');
var server = require('./lib/server');

var debug  = require('debug')('broker');

var ascoltatore = {
  type: 'redis',
  redis: require('redis'),
  db: 12,
  port: 6379,
  host: 'redis'
};

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

  var topicPrefix = client.authKey + '/';

  // not process system or invalid message
  if (packet.topic.indexOf(topicPrefix) !== 0 || packet.payload.toString() == '')
    return;

  // pass user message to backend for further processing
  var topic = packet.topic.replace(topicPrefix, '');

  if (!topic) {
    debug('Blank topic used. Ignore this message');
    return;
  }      

  var postData = {
    authKey: client.authKey.toString(),
    topic: packet.topic.toString(),
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
      console.log(error);
      debug('Failed to send message to backend: ', error);
      return;
    }

    if (response.statusCode == 200) {
      debug('Sent message to backend successfully');
    } else {
      debug(body);
      console.log(body);
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
  var payload = {
    chipId: client.chipId,
    authKey: client.authKey.toString(),
    event: 'offline'
  }
  var message = {
    topic: client.authKey.toString() + '/sys/',
    payload: JSON.stringify(payload),
    qos: 0, // 0, 1, or 2
    retain: false // or true
  };

  app.publish(message, function() {
    debug('Sent mqtt message to inform device being offline!');
  });

  var postData = {
    authKey: client.authKey.toString(),
    topic: message.topic,
    data: message.payload
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
      debug(body);
      console.log(body);
      debug('Failed to send message to backend');
    }
  });
});

