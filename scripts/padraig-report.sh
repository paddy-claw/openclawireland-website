#!/bin/bash
# Padraig Self-Reporting Activity Script
# 
# This script is called by Padraig (the agent) to report activity.
# Place this in the workspace and call it when performing actions.
#
# Usage from OpenClaw:
#   bash /home/james2/.openclaw/workspace/website/scripts/padraig-report.sh [tool_name]
#
# The script will automatically determine intensity based on recent calls.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PING_SCRIPT="$SCRIPT_DIR/ping-activity.sh"
ACTIVITY_LOG="/tmp/padraig_activity_log"
MAX_LOG_LINES=100

# Ensure ping script exists
if [ ! -f "$PING_SCRIPT" ]; then
    echo "Error: ping-activity.sh not found" >&2
    exit 1
fi

# Load environment
if [ -f "$HOME/.openclaw/workspace/.env" ]; then
    source "$HOME/.openclaw/workspace/.env"
fi

# Log this activity
log_activity() {
    local tool="$1"
    local timestamp=$(date +%s)
    echo "$timestamp $tool" >> "$ACTIVITY_LOG"
    # Trim log to last 100 entries
    tail -n "$MAX_LOG_LINES" "$ACTIVITY_LOG" > "$ACTIVITY_LOG.tmp" && mv "$ACTIVITY_LOG.tmp" "$ACTIVITY_LOG"
}

# Calculate intensity based on recent activity
calculate_intensity() {
    if [ ! -f "$ACTIVITY_LOG" ]; then
        echo "1"
        return
    fi
    
    local now=$(date +%s)
    local ten_minutes_ago=$((now - 600))
    local count=0
    
    # Count activities in last 10 minutes
    while read -r line; do
        local ts=$(echo "$line" | cut -d' ' -f1)
        if [ "$ts" -gt "$ten_minutes_ago" ]; then
            ((count++)) || true
        fi
    done < "$ACTIVITY_LOG"
    
    # Map count to intensity
    # Level 1: 5-14 updates in 10 min
    # Level 2: 15-29 updates in 10 min  
    # Level 3: 30+ updates in 10 min
    if [ "$count" -ge 30 ]; then
        echo "3"
    elif [ "$count" -ge 15 ]; then
        echo "2"
    elif [ "$count" -ge 5 ]; then
        echo "1"
    else
        echo "1"  # Default to 1 when active
    fi
}

# Main
tool="${1:-openclaw}"

# Log and calculate
log_activity "$tool"
intensity=$(calculate_intensity)

# Send ping
exec "$PING_SCRIPT" "working" "$intensity" "$tool"
