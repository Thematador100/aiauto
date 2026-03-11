#!/bin/bash
# API Key Backup Script
# This script backs up your .env.local file to prevent accidental loss of API keys

BACKUP_DIR="$HOME/.auto-inspection-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/env.local.backup_$TIMESTAMP"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local file not found"
    exit 1
fi

# Create backup
cp .env.local "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ API keys backed up successfully to:"
    echo "   $BACKUP_FILE"

    # Keep only last 10 backups
    ls -t "$BACKUP_DIR"/env.local.backup_* | tail -n +11 | xargs -r rm
    echo "📦 Keeping last 10 backups"
else
    echo "❌ Failed to backup API keys"
    exit 1
fi
