#!/bin/bash

# Workflow Monitor - Check GitHub Actions status
REPO_OWNER="srid90777"
REPO_NAME="standalone-context-server"
ACTIONS_URL="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs"
WEB_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}/actions"

echo "Checking status for: ${WEB_URL}"
echo ""

if command -v jq &> /dev/null; then
    curl -s "${ACTIONS_URL}?per_page=5" | jq -r '.workflow_runs[] | "[\(.status) - \(.conclusion // "running")] \(.name) (\(.created_at))"'
else
    curl -s "${ACTIONS_URL}?per_page=5" | grep -E '"name"|"status"|"conclusion"' | head -15
fi
