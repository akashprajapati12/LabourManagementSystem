#!/bin/bash

# Database backup script for Labour Management System

# Configuration
BACKUP_DIR="./backups"
DB_FILE="./database.sqlite"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/database_$DATE.sqlite"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating backup: $BACKUP_FILE"
cp "$DB_FILE" "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup successful!"
    
    # Remove backups older than 7 days
    echo "Cleaning up old backups..."
    find "$BACKUP_DIR" -name "database_*.sqlite" -mtime +7 -delete
    
    # Show backup status
    echo "Current backups:"
    ls -la "$BACKUP_DIR"
else
    echo "Backup failed!"
    exit 1
fi