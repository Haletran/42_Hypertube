#!/bin/bash

CURRENT_IP="backend:3333"
SEARCH_DIR="."

echo "Replacing 'localhost' with '$CURRENT_IP' in files under '$SEARCH_DIR'..."
find "$SEARCH_DIR" -type f ! -name "$(basename "$0")" ! -path "*/crypto/*" -exec sed -i "s/localhost:3333/$CURRENT_IP/g" {} +
echo "Replacement completed!"