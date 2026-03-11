#!/bin/bash
# Simple deployment script - Just double-click this file!

echo "🚀 Starting deployment..."
echo ""

# Go to repo directory
cd /home/user/auto

# Checkout main
echo "📦 Preparing main branch..."
git checkout main
git pull origin main

# Merge feature branch
echo "🔀 Merging latest features..."
git merge claude/fix-black-screen-01PqyZ6CAvN9KHh9nDnk1GZw --no-edit

# Push to trigger deployments
echo "⬆️  Pushing to main..."
git push origin main

echo ""
echo "✅ Done! Railway and Vercel will deploy in 2 minutes."
echo "🌐 Then login at your Vercel URL with admin@test.com / admin123"
echo ""
