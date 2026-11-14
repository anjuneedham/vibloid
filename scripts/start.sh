#!/bin/bash
# Runs migrations, then the worker and the web server side by side. If either dies the container exits so the host restarts it.
set -e
pnpm db:migrate

pnpm worker &
WORKER=$!
pnpm exec next start -p "${PORT:-3000}" &
WEB=$!

trap 'kill $WORKER $WEB 2>/dev/null' TERM INT
wait -n $WORKER $WEB
EXIT=$?
kill $WORKER $WEB 2>/dev/null || true
exit $EXIT
