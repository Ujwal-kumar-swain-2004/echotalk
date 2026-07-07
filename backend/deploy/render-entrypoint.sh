#!/bin/sh
set -eu

: "${PORT:=10000}"
: "${SERVER_PORT:=8080}"
: "${SOCKETIO_PORT:=8081}"

envsubst '${PORT} ${SERVER_PORT} ${SOCKETIO_PORT}' \
  < /app/deploy/nginx.conf.template \
  > /etc/nginx/nginx.conf

java -jar /app/app.jar &
java_pid=$!

nginx -g 'daemon off;' &
nginx_pid=$!

shutdown() {
  kill -TERM "$java_pid" 2>/dev/null || true
  nginx -s quit 2>/dev/null || true
}

trap shutdown INT TERM EXIT

while kill -0 "$java_pid" 2>/dev/null && kill -0 "$nginx_pid" 2>/dev/null; do
  sleep 5
done

if ! kill -0 "$java_pid" 2>/dev/null; then
  status=0
  wait "$java_pid" || status=$?
  kill -TERM "$nginx_pid" 2>/dev/null || true
  exit "$status"
fi

status=0
wait "$nginx_pid" || status=$?
kill -TERM "$java_pid" 2>/dev/null || true
exit "$status"
