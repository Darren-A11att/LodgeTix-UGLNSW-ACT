#!/bin/bash
# Script to fix Supabase imports across the codebase
# This script will:
# 1. Find all files that import from '@supabase/supabase-js' using the package default format
# 2. Replace them with named imports

set -e # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Supabase import fixes...${NC}"

# Base directory (repo root)
BASE_DIR=$(pwd)
echo -e "Working directory: ${BASE_DIR}"

# Counter for modified files
MODIFIED_COUNT=0
SCANNED_COUNT=0

# Function to check if a file contains default supabase imports
check_problematic_import() {
  local file="$1"
  grep -q "import pkg from .*@supabase/supabase-js" "$file" && grep -q "const { .* } = pkg" "$file"
  return $?
}

# Function to extract imported symbols 
extract_imports() {
  local file="$1"
  grep -A 1 "import pkg from .*@supabase/supabase-js" "$file" | \
    grep "const { .* } = pkg" | \
    sed -E 's/.*const \{ (.*) \} = pkg.*/\1/g' | \
    tr -d ' '
}

# List of file types to check
FILE_EXTENSIONS=("js" "ts" "jsx" "tsx")

# Track problematic files
PROBLEMATIC_FILES=()

for EXT in "${FILE_EXTENSIONS[@]}"; do
  echo -e "${YELLOW}Scanning ${EXT} files...${NC}"
  
  # Use find to get all files of the extension
  FILES=$(find "$BASE_DIR/src" -name "*.${EXT}" -type f)
  
  for FILE in $FILES; do
    SCANNED_COUNT=$((SCANNED_COUNT + 1))
    
    # Check for problematic import pattern
    if check_problematic_import "$FILE"; then
      PROBLEMATIC_FILES+=("$FILE")
      echo -e "${YELLOW}Found problematic import in: ${FILE}${NC}"
      
      # Extract what's being imported
      IMPORTS=$(extract_imports "$FILE")
      
      # Create a backup
      cp "$FILE" "$FILE.bak"
      
      # Replace the problematic import with named imports 
      # First line: get the file content
      # Second line: replace the import pattern
      cat "$FILE" | \
        awk -v imports="$IMPORTS" '
        {
          if ($0 ~ /import pkg from.*@supabase\/supabase-js/) {
            # Store the import line
            import_line = $0
            getline # Move to the next line
            if ($0 ~ /const \{.*\} = pkg/) {
              # This is the destructuring line, replace both lines with a single named import
              gsub(/import pkg from/, "import {" imports "} from", import_line)
              print import_line
            } else {
              # This was not what we expected, print both lines unchanged
              print import_line
              print $0
            }
          } else {
            # Not an import line, print unchanged
            print $0
          }
        }' > "$FILE.new"
      
      # Replace the original file with the new one
      mv "$FILE.new" "$FILE"
      
      if [ $? -eq 0 ]; then
        MODIFIED_COUNT=$((MODIFIED_COUNT + 1))
        echo -e "${GREEN}Fixed import in: ${FILE}${NC}"
        echo -e "  Imported: ${IMPORTS}"
      else
        echo -e "${RED}Failed to fix import in: ${FILE}${NC}"
        # Restore from backup if the edit failed
        mv "$FILE.bak" "$FILE"
      fi
      
      # Remove backup file if the edit succeeded
      if [ -f "$FILE.bak" ]; then
        rm -f "$FILE.bak"
      fi
    fi
  done
done

# Summary
echo -e "\n${GREEN}=== Summary ===${NC}"
echo -e "Files scanned: ${SCANNED_COUNT}"
echo -e "Files modified: ${MODIFIED_COUNT}"

if [ ${#PROBLEMATIC_FILES[@]} -gt 0 ]; then
  echo -e "\n${YELLOW}Modified files:${NC}"
  for FILE in "${PROBLEMATIC_FILES[@]}"; do
    echo "  - ${FILE#$BASE_DIR/}"
  done
fi

echo -e "\n${GREEN}Script completed.${NC}"

# Additionally check for all supabase imports to help with audit
echo -e "\n${YELLOW}All Supabase import patterns in use:${NC}"
grep -r --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" "import.*supabase" src/ | sort | uniq -c | sort -nr

# List all files using supabase import in any way
echo -e "\n${YELLOW}Files that import from supabase:${NC}"
grep -l -r --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" "@supabase/supabase-js" src/ | sort