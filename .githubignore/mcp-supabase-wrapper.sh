#!/bin/bash

# MCP Supabase Wrapper Script
# Usage: ./mcp-supabase-wrapper.sh <mcp_command>
# Example: ./mcp-supabase-wrapper.sh get_project_url

if [ $# -eq 0 ]; then
  echo "Usage: $0 <mcp_command>"
  echo "Example: $0 get_project_url"
  exit 1
fi

# Source the setup script to set environment variables
source ./setup-mcp-supabase.sh > /dev/null

# Extract project details from config file
PROJECT_ID=$(grep -o '"project_id": *"[^"]*"' mcp-supabase-config.json | cut -d'"' -f4)
PROJECT_URL=$(grep -o '"project_url": *"[^"]*"' mcp-supabase-config.json | cut -d'"' -f4)
ANON_KEY=$(grep -o '"anon_key": *"[^"]*"' mcp-supabase-config.json | cut -d'"' -f4)

# Override MCP environment variables directly
export MCP_SUPABASE_PROJECT_ID=$PROJECT_ID
export MCP_SUPABASE_URL=$PROJECT_URL
export MCP_SUPABASE_ANON_KEY=$ANON_KEY

echo "Running MCP command: $1"
echo "Using Supabase project: $PROJECT_ID"
echo "URL: $PROJECT_URL"

# Run the MCP command
mcp-supabase-$1 "${@:2}" 