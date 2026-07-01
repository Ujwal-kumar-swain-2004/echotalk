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
  status=0
  wait "$java_pid" || status=$?
  kill -TERM "$nginx_pid" 2>/dev/null || true
  exit "$status"
fi

status=0
wait "$nginx_pid" || status=$?
kill -TERM "$java_pid" 2>/dev/null || true
exit "$status"
