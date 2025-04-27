#!/bin/bash

# Setup script for MCP Supabase environment

echo "Setting up MCP Supabase environment..."

# Export Supabase credentials
export SUPABASE_PROJECT_ID=pwwpcjbbxotmiqrisjvf
export SUPABASE_URL=https://pwwpcjbbxotmiqrisjvf.supabase.co
export SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3BjamJieG90bWlxcmlzanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg1NjgsImV4cCI6MjA2MTEyNDU2OH0.Ep3pzGlPgXbnTrcE84dIIbBxk-OsnXq7BSwL7vG-p3Q

echo "Linking Supabase project..."
supabase link --project-ref pwwpcjbbxotmiqrisjvf --password "DpA24!CjE16@UGLTIX" || echo "Project linking failed. You may need to run this command manually."

echo "Environment setup complete. You can now run MCP commands with:"
echo "mcp-server --config mcp-supabase-config.json <command>" 