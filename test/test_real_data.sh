#!/bin/bash -e

CURRENT_DIR=$(dirname $0)

for test_activation in $CURRENT_DIR/test_data/test_activation*.json; do
  echo "Testing ${test_activation}..."
  curl -X PUT \
       -H 'Content-Type: application/json' \
       --data @./$test_activation \
       http://localhost:3000/v1/activate
  echo
done

for test_ping in $CURRENT_DIR/test_data/test_ping*.json; do
  echo "Testing ${test_ping}..."
  curl -X PUT \
       -H 'Content-Type: application/json' \
       --data @./$test_ping \
       http://localhost:3000/v1/ping
  echo
done
