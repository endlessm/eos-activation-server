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

* Install and start Redis
* Install Node and NPM
* Run `NODE_ENV=test npm install`
* Run `npm start`
* In another window run `npm test`

### Docker-based development and testing

You can use use Docker and run and test the project. Because the
`eos-activation-server-vendor-signer` submodule is needed but it's a private repo
you need to create a personal access token (follow the instructions at
https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line
and select the `repo` scope).

To test your changes in a reproducible environment, you can do the following:

1.  Install and run Redis:

    ```
    $ docker pull redis:latest
    $ docker run --network=host redis:latest
    ```

2.  Build the test image:

    ```
    $ docker build --build-arg GITHUB_TOKEN=<INSERT TOKEN HERE> --tag=eos-activation-server .
    ```

3. Start the server:

    ```
    $ docker run --network=host --rm --name=eos-activation-server eos-activation-server
    ```

4.  Run the tests (in a different window):

    ```
    $ docker exec --tty --interactive eos-activation-server npm test
    ```
