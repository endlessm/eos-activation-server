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
      'live':    { 'type': 'boolean' }
    },
    'required': ['image',
                 'vendor',
                 'product',
                 'release']
  }

```
