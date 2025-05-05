#!/bin/bash

# LodgeTix Multi-Portal Deployment Script
# This script builds and deploys all portals at once

# Exit on error
set -e

# Display banner
echo "==============================================="
echo "LodgeTix Multi-Portal Deployment"
echo "==============================================="

# Step 1: Install dependencies if needed
if [ "$1" == "--fresh" ]; then
  echo "Installing dependencies..."
  npm ci
fi

# Step 2: Build all portals
echo "Building all portals..."
npm run build:all

# Step 3: Check if build succeeded
if [ ! -d "dist" ] || [ ! -d "dist/app" ] || [ ! -d "dist/admin" ]; then
  echo "Error: Build failed - missing output directories"
  exit 1
fi

# Step 4: Deploy based on environment
if [ "$1" == "--prod" ] || [ "$2" == "--prod" ]; then
  echo "Deploying to production..."
  
  # Replace with your production deployment commands
  # Examples:
  # rsync -avz --delete dist/ user@production-server:/var/www/html/
  # aws s3 sync dist/ s3://your-bucket/ --delete
  
  echo "Simulating production deployment (replace with actual commands)"
  sleep 2
  
elif [ "$1" == "--staging" ] || [ "$2" == "--staging" ]; then
  echo "Deploying to staging..."
  
  # Replace with your staging deployment commands
  # Examples:
  # rsync -avz --delete dist/ user@staging-server:/var/www/html/
  # aws s3 sync dist/ s3://staging-bucket/ --delete
  
  echo "Simulating staging deployment (replace with actual commands)"
  sleep 2
  
else
  echo "No deployment target specified. Build complete."
  echo "Use --prod or --staging to deploy to an environment."
  echo "Use --fresh to reinstall dependencies before building."
fi

# Step 5: Deployment verification
if [ "$1" == "--prod" ] || [ "$2" == "--prod" ] || [ "$1" == "--staging" ] || [ "$2" == "--staging" ]; then
  echo "Deployment completed."
  echo ""
  echo "==============================================="
  echo "Portal URLs:"
  echo "Public: https://yourdomain.com"
  echo "App:    https://app.yourdomain.com"
  echo "Admin:  https://admin.yourdomain.com"
  echo "==============================================="
  echo ""
  echo "Remember to verify all portals are working correctly!"
fi

exit 0