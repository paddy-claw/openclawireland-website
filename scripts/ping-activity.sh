#!/bin/bash
# Padraig Activity Ping Script
# Sends activity updates to the OpenClaw Ireland website
# 
# Usage: ./ping-activity.sh [state] [intensity] [tool]
#   state: sleeping|working|coffee (default: working)
#   intensity: 0-3 (default: 1)
#   tool: name of tool being used (default: none)
#
# Examples:
#   ./ping-activity.sh working 2 web_search
#   ./ping-activity.sh coffee 0 break
#   ./ping-activity.sh sleeping 0 none

# Configuration
WEBHOOK_URL="${WEBHOOK_URL:-https://openclaw.ie/api/room}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-}"

# Default values
STATE="${1:-working}"
INTENSITY="${2:-1}"
TOOL="${3:-none}"

# Validate state
if [[ ! "$STATE" =~ ^(sleeping|working|coffee)$ ]]; then
    echo "Error: Invalid state '$STATE'. Must be: sleeping, working, or coffee"
    exit 1
fi

# Validate intensity
if ! [[ "$INTENSITY" =~ ^[0-3]$ ]]; then
    echo "Error: Invalid intensity '$INTENSITY'. Must be 0-3"
    exit 1
fi

# Check for webhook secret
if [ -z "$WEBHOOK_SECRET" ]; then
    # Try to load from environment file
    if [ -f "$HOME/.openclaw/workspace/.env" ]; then
        source "$HOME/.openclaw/workspace/.env"
    fi
    
    if [ -z "$WEBHOOK_SECRET" ]; then
        echo "Warning: WEBHOOK_SECRET not set. Ping may fail authentication."
    fi
fi

# Build JSON payload
PAYLOAD=$(cat <<EOF
{
  "state": "$STATE",
  "intensity": $INTENSITY,
  "tool": "$TOOL",
  "timestamp": $(date +%s%3N),
  "hostname": "$(hostname)"
}
EOF
)

# Send the ping
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
    -d "$PAYLOAD" 2>/dev/null)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Check response
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Activity ping sent: $STATE (intensity: $INTENSITY, tool: $TOOL)"
    echo "  Response: $BODY"
    exit 0
else
    echo "✗ Failed to send activity ping (HTTP $HTTP_CODE)"
    echo "  Response: $BODY"
    exit 1
fi
