# eos-activation-server

Server that logs all activation pings by the clients in the database and sends separate activation data to vendor server as well.

## Activation endpoint

- JSON only

- Schema:
```
  {
    'type': 'object',
    'properties': {
      'image':   { 'type': 'string' },
      'vendor':  { 'type': 'string' },
      'product': { 'type': 'string' },
      'serial':  { 'type': 'string' },
      'release': { 'type': 'string' },
      'live':    { 'type': 'boolean' },
      'dualboot':{ 'type': 'boolean' },
      'mac_hash':{ 'type': 'integer',
                   'minimum': 0,
                   'maximum': 2 ** 32 - 1 }
    },
    'required': ['image',
                 'vendor',
                 'product',
                 'release']
  }

```

## Local development and testing

* Install and start MongoDB
* Install and start Redis
* Install Node and NPM
* Run `npm install`
* Run `npm test`

### Docker-based development and testing

To test your changes in a reproducible environment, you can do the following:

1.  Install and run MongoDB:

    ```
    $ docker pull mongo:latest
    $ docker run --network=host mongo:latest
    ```

2.  Install and run Redis:

    ```
    $ docker pull redis:latest
    $ docker run --network=host redis:latest
    ```

3.  Build the test image:

    ```
    $ docker build --tag=test-eos-activation-server --file Dockerfile.test .
    ```

4.  Run the tests:

    ```
    $ docker run --tty --interactive --network=host test-eos-activation-server npm test
    ```
