#!/bin/bash
# Push Code to GitHub

echo "This will push the CLEANED code to GitHub."
echo "No large files (binaries/natives) will be uploaded."
echo ""
echo "You need a Personal Access Token (PAT) with 'repo' scope."
echo "Generate one here: https://github.com/settings/tokens/new"
echo ""

read -sp "Enter PAT (starts with ghp_...): " TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "No token provided."
    exit 1
fi

git remote add origin "https://srid90777:${TOKEN}@github.com/srid90777/standalone-context-server.git" 2>/dev/null || git remote set-url origin "https://srid90777:${TOKEN}@github.com/srid90777/standalone-context-server.git"

echo "Pushing code..."
git push -u origin main --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed code!"
    echo "Build workflows will start automatically."
    echo "Check status: https://github.com/srid90777/standalone-context-server/actions"
else
    echo "❌ Push failed."
fi
