#!/usr/bin/env bash
# Runs auth, ai-orchestration, and notification as sibling processes in one
# container, fronted by nginx on $PORT (see railway/nginx.conf). If any one
# process dies, the whole container exits so Railway restarts it cleanly —
# a half-alive service (e.g. auth up but notification's queue consumer
# dead) is worse than a full restart.
set -euo pipefail

pids=()

cleanup() {
  trap - TERM INT
  kill -TERM "${pids[@]}" 2>/dev/null || true
  wait "${pids[@]}" 2>/dev/null || true
}
trap cleanup TERM INT

# auth and notification both read GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET but
# need different OAuth clients (different redirect URIs), so each gets its
# own subshell env — same split docker-compose does per-container.
(
  export GOOGLE_CLIENT_ID="$AUTH_GOOGLE_CLIENT_ID"
  export GOOGLE_CLIENT_SECRET="$AUTH_GOOGLE_CLIENT_SECRET"
  exec bun apps/auth/src/index.ts
) &
pids+=("$!")

bun apps/ai-orchestration/src/index.ts &
pids+=("$!")

(
  export GOOGLE_CLIENT_ID="$NOTIFICATION_GOOGLE_CLIENT_ID"
  export GOOGLE_CLIENT_SECRET="$NOTIFICATION_GOOGLE_CLIENT_SECRET"
  exec bun apps/notification/src/index.ts
) &
pids+=("$!")

nginx -g 'daemon off;' &
pids+=("$!")

wait -n "${pids[@]}"
exit_code=$?
cleanup
exit "$exit_code"
