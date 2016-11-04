# eos-activation-server

Server that logs all activation pings by the clients in hte database and sends separate activation data to vendor server as well.

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
      'dualboot':{ 'type': 'boolean' }
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
