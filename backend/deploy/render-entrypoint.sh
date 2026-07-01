#!/bin/sh
set -eu

: "${PORT:=10000}"
: "${SERVER_PORT:=8080}"

envsubst '${PORT}' \
  < /app/deploy/nginx.conf.template \
  > /etc/nginx/nginx.conf

java -jar /app/app.jar &
java_pid=$!

ready=0
for attempt in $(seq 1 120); do
  if ! kill -0 "$java_pid" 2>/dev/null; then
    wait "$java_pid" || exit $?
  fi

  if curl -fsS "http://127.0.0.1:${SERVER_PORT}/api/public/health" >/dev/null 2>&1; then
    ready=1
    break
  fi

  sleep 1
done

if [ "$ready" != "1" ]; then
  echo "Spring backend did not become ready in time" >&2
  kill -TERM "$java_pid" 2>/dev/null || true
  exit 1
fi

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
