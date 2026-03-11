#!/bin/bash
# API Key Restore Script
# This script restores your .env.local file from the most recent backup

BACKUP_DIR="$HOME/.auto-inspection-backups"

# Find the most recent backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/env.local.backup_* 2>/dev/null | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No backups found in $BACKUP_DIR"
    exit 1
fi

echo "📂 Found backup: $LATEST_BACKUP"

# Show backup contents (masked)
echo ""
echo "Backup contents (API keys masked):"
echo "-----------------------------------"
sed 's/\(.*=\).*/\1***MASKED***/' "$LATEST_BACKUP"
echo "-----------------------------------"
echo ""

# Ask for confirmation
read -p "Restore this backup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 0
fi

# Backup current .env.local if it exists
if [ -f ".env.local" ]; then
    CURRENT_BACKUP="$BACKUP_DIR/env.local.before_restore_$(date +"%Y%m%d_%H%M%S")"
    cp .env.local "$CURRENT_BACKUP"
    echo "💾 Current .env.local backed up to: $CURRENT_BACKUP"
fi

# Restore backup
cp "$LATEST_BACKUP" .env.local

if [ $? -eq 0 ]; then
    echo "✅ API keys restored successfully!"
    echo "⚠️  Please restart your dev server (npm run dev)"
else
    echo "❌ Failed to restore API keys"
    exit 1
fi
