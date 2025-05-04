#!/bin/bash

# Script to safely update the client code for the ticket system upgrade

echo "Updating client code for ticket system..."

# Backup the original file
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_FILE="$BACKUP_DIR/reservationService.ts.backup-$TIMESTAMP"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Creating backup of current reservationService.ts..."
cp ./src/lib/reservationService.ts "$BACKUP_FILE"
echo "Backup created at $BACKUP_FILE"

# Copy the updated implementation
echo "Updating with new implementation..."
cp ./src/lib/reservationService.ts.updated ./src/lib/reservationService.ts

echo "Client code updated successfully!"
echo ""
echo "To test, run: npm run dev"
echo "To revert, run: cp $BACKUP_FILE ./src/lib/reservationService.ts"