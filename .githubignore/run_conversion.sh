#!/bin/bash

# Simple bash script to run the awk converter

# Input TypeScript file
TS_FILE="src/shared/data/lodges.ts"
# Awk script file
AWK_SCRIPT="converter.awk"
# Output SQL file
SQL_FILE="lodges.sql" # Changed output name back to standard

# Check if input files exist
if [ ! -f "$TS_FILE" ]; then
    echo "Error: Input TypeScript file '$TS_FILE' not found."
    exit 1
fi
if [ ! -f "$AWK_SCRIPT" ]; then
    echo "Error: Awk script file '$AWK_SCRIPT' not found."
    exit 1
fi

echo "Converting lodges from '$TS_FILE' using '$AWK_SCRIPT' to '$SQL_FILE'..."

# Run awk with the script file
awk -f "$AWK_SCRIPT" "$TS_FILE" > "$SQL_FILE"

# Check awk exit status and if SQL file was created and is not empty
AWK_EXIT_CODE=$?
if [ $AWK_EXIT_CODE -eq 0 ] && [ -s "$SQL_FILE" ]; then
    echo "Success: SQL INSERT statements written to '$SQL_FILE'."
    echo "Please review '$SQL_FILE' carefully for accuracy before importing."
elif [ $AWK_EXIT_CODE -ne 0 ]; then
    echo "Error: awk command failed with exit code $AWK_EXIT_CODE."
    rm -f "$SQL_FILE" # Remove potentially empty/partial file
    exit 1
else # awk succeeded but file is empty
    echo "Error: awk command succeeded, but the output file '$SQL_FILE' is empty or missing."
    echo "Check '$TS_FILE' format consistency or '$AWK_SCRIPT' logic."
    rm -f "$SQL_FILE"
    exit 1
fi

exit 0 