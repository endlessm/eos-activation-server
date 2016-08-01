#!/bin/bash -e

if [ $# -lt 1 ]; then
  echo "Usage: $0 <data_file> [<server>]"
  exit 1
fi

DATA_FILE="${1}"

curl -X PUT -H 'X-Forwarded-For: 12.10.13.2' -H 'Content-Type: application/json' --data @${1} localhost:3030/v1/activate
