#!/bin/bash

# MongoDB backup script for Labour Management System
# Requires mongodump to be installed and MONGODB_URI set in env or .env file

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/labourDB}"

BACKUP_PATH="$BACKUP_DIR/labourDB-$DATE"

echo "Creating MongoDB backup to: $BACKUP_PATH"
mongodump --uri "$URI" --out "$BACKUP_PATH"

if [ $? -eq 0 ]; then
    echo "Backup successful!"
    echo "Cleaning up backups older than 7 days..."
    find "$BACKUP_DIR" -maxdepth 1 -iname "labourDB-*" -mtime +7 -exec rm -rf {} \;
    echo "Current backups:"
    ls -la "$BACKUP_DIR"
else
    echo "Backup failed!"
    exit 1
fi