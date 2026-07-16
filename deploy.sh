#!/usr/bin/env bash
# Usage:
#   ./deploy.sh                  → commits with timestamp message
#   ./deploy.sh "my message"     → commits with custom message
#   npm run ship                 → same as ./deploy.sh
#   npm run ship -- "my message" → same as ./deploy.sh "my message"
set -euo pipefail

REGISTRY="sfcogsops-snowhouse-aws-us-west-2.registry.snowflakecomputing.com"
IMAGE="$REGISTRY/temp/mlemke/revops_repo/revops-onboarding:latest"
MSG="${*:-Deploy $(date '+%Y-%m-%d %H:%M')}"

# ── 1. GitHub ─────────────────────────────────────────────────────────────────
echo ""
echo "=== GitHub ==="
git add -A
if git diff --cached --quiet; then
  echo "  Nothing to commit"
else
  git commit -m "$MSG"
  echo "  Committed: $MSG"
fi
git push origin main
echo "  Pushed to main"

# ── 2. Build Next.js (required for COPY-only Dockerfile) ─────────────────────
echo ""
echo "=== Building Next.js ==="
npm run build

# ── 3. Docker build ───────────────────────────────────────────────────────────
echo ""
echo "=== Building Docker image ==="
docker build --platform linux/amd64 -t "$IMAGE" .

# ── 4. Login immediately before push to get the freshest token ───────────────
echo ""
echo "=== Logging in to registry ==="
snow spcs image-registry login

# Write credentials directly to Docker config to bypass credsStore caching
CRED_JSON=$(printf "%s" "$REGISTRY" | docker-credential-desktop get 2>/dev/null || echo "")
if [ -n "$CRED_JSON" ]; then
  python3 - "$REGISTRY" "$CRED_JSON" <<'PYEOF'
import sys, json, os, base64
registry = sys.argv[1]
cred = json.loads(sys.argv[2])
username = cred.get("Username", "0sessiontoken")
secret   = cred.get("Secret", "")
auth     = base64.b64encode(f"{username}:{secret}".encode()).decode()
path = os.path.expanduser("~/.docker/config.json")
with open(path) as f: config = json.load(f)
config.setdefault("auths", {})[registry] = {"auth": auth}
with open(path, "w") as f: json.dump(config, f, indent=2)
print("  Credentials written directly to Docker config")
PYEOF
fi

echo ""
echo "=== Pushing to registry ==="
docker push "$IMAGE"

# ── 5. Upgrade SPCS service ───────────────────────────────────────────────────
echo ""
echo "=== Upgrading SPCS service ==="
snow spcs service upgrade REVOPS_ONBOARDING \
  --spec-path service-spec.yaml \
  --database TEMP \
  --schema MLEMKE

echo ""
echo "Done!"
echo "  GitHub → https://github.com/sfc-gh-michael-lemke/employee-onboarding-tracker"
echo "  SPCS   → https://oqpshaixd-spcs.sfcogsops-snowhouse-aws-us-west-2.us-west-2.aws.snowflake.app"
echo "  (SPCS restart takes ~30-60s)"
