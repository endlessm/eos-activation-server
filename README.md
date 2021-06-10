# eos-activation-server

Server that receives activations and pings submitted by Endless OS clients
running [eos-phone-home](https://github.com/endlessm/eos-phone-home) and queues
them for consumption by [azafea](https://github.com/endlessm/azafea).

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

* Install and start Redis
* Install Node and NPM
* Run `NODE_ENV=test npm install`
* Run `npm start`
* In another window run `npm test`

### Docker-based development and testing

You can use Docker to run and test the project.

To test your changes in a reproducible environment, you can do the following:

1.  Install and run Redis:

    ```
    $ docker pull redis:latest
    $ docker run --network=host redis:latest
    ```

2.  Build the test image:

    ```
    $ docker build --tag=eos-activation-server .
    ```

3. Start the server:

    ```
    $ docker run --network=host --rm --name=eos-activation-server eos-activation-server
    ```

4.  Run the tests (in a different window):

    ```
    $ docker exec --tty --interactive eos-activation-server npm test
    ```
