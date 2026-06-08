#!/bin/sh
set -eu

: "${PORT:=10000}"

envsubst '${PORT}' \
  < /app/deploy/nginx.conf.template \
  > /etc/nginx/nginx.conf

java -jar /app/app.jar &
java_pid=$!

shutdown() {
  kill -TERM "$java_pid" 2>/dev/null || true
  nginx -s quit 2>/dev/null || true
}

trap shutdown INT TERM EXIT

nginx -g 'daemon off;' &
nginx_pid=$!

while kill -0 "$java_pid" 2>/dev/null && kill -0 "$nginx_pid" 2>/dev/null; do
  sleep 1
done

if ! kill -0 "$java_pid" 2>/dev/null; then
  wait "$java_pid"
fi

wait "$nginx_pid"
