#!/bin/bash
# Stop any running Vite processes
echo "Stopping any running Vite processes..."
killall -9 node 2>/dev/null || true
sleep 1

# Clear browser cache message
echo "Please also clear your browser cache or use incognito mode!"

# Start the admin development server directly
echo "Starting admin dev server..."
npx vite --config admin/vite.config.ts --port 5174 --clearScreen=false --force