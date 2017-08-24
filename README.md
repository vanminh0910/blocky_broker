# Blocky MQTT Server/Broker

## Requirements

The MQTT server/broker is tested against Node 0.10.36


## Getting Started

```bash
$ git clone git@github.com:vanminh0910/blocky_broker.git
$ npm install && npm install -g foreman
$ nf start
```

## Install with docker

Running in development mode
$ export NODE_ENV=dev; docker-compose up

Running in staging mode
$ export NODE_ENV=staging; docker-compose up

Running in production mode
$ export NODE_ENV=prod; docker-compose up

File dev.env, staging.env or prod.env must exist and contains environment variables accordingly

## Resources


## Contributing

Fork the repo on github and send a pull requests with topic branches.
Do not forget to provide specs to your contribution.


## Coding guidelines

Follow [Felix](http://nodeguide.com/style.html) guidelines.


## Authors

[Minh Ha](mailto:vanminh0910@gmail.com)


## Contributors

Special thanks to all [contributors](https://github.com/vanminh0910/blocky_broker/graphs/contributors)
for submitting patches.

## License

Blocky is licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).
