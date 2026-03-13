#!/bin/bash
# Padraig Activity Monitor
# Automatically tracks and reports activity to the website
# 
# This script monitors system activity and sends pings to the
# OpenClaw Ireland website to update the live room visualization.
#
# To install as a service:
#   sudo cp padraig-activity.service /etc/systemd/system/
#   sudo systemctl enable padraig-activity
#   sudo systemctl start padraig-activity

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PING_SCRIPT="$SCRIPT_DIR/ping-activity.sh"
LAST_ACTIVITY_FILE="/tmp/padraig_last_activity"
IDLE_THRESHOLD_MS=120000  # 2 minutes before considering idle
SLEEP_THRESHOLD_MS=1200000  # 20 minutes before considering sleeping
PING_INTERVAL_SEC=30

# Ensure ping script exists
if [ ! -f "$PING_SCRIPT" ]; then
    echo "Error: ping-activity.sh not found at $PING_SCRIPT"
    exit 1
fi

# Load environment
if [ -f "$HOME/.openclaw/workspace/.env" ]; then
    source "$HOME/.openclaw/workspace/.env"
fi

# Initialize last activity
update_last_activity() {
    date +%s%3N > "$LAST_ACTIVITY_FILE"
}

# Get milliseconds since last activity
get_idle_time_ms() {
    if [ ! -f "$LAST_ACTIVITY_FILE" ]; then
        update_last_activity
        echo "0"
        return
    fi
    
    local last_activity=$(cat "$LAST_ACTIVITY_FILE")
    local now=$(date +%s%3N)
    echo "$((now - last_activity))"
}

# Determine state based on idle time
get_state() {
    local idle_ms=$(get_idle_time_ms)
    
    if [ "$idle_ms" -gt "$SLEEP_THRESHOLD_MS" ]; then
        echo "sleeping"
    elif [ "$idle_ms" -gt "$IDLE_THRESHOLD_MS" ]; then
        echo "coffee"
    else
        echo "working"
    fi
}

# Calculate intensity based on recent activity frequency
# This is a simplified version - could be enhanced with actual tool tracking
calculate_intensity() {
    local idle_ms=$(get_idle_time_ms)
    
    # High activity = low idle time = high intensity
    if [ "$idle_ms" -lt 10000 ]; then  # < 10 seconds
        echo "3"
    elif [ "$idle_ms" -lt 60000 ]; then  # < 1 minute
        echo "2"
    elif [ "$idle_ms" -lt 120000 ]; then  # < 2 minutes
        echo "1"
    else
        echo "0"
    fi
}

# Main loop
main() {
    echo "Padraig Activity Monitor started"
    echo "Webhook URL: ${WEBHOOK_URL:-https://openclaw.ie/api/room}"
    echo "Ping interval: ${PING_INTERVAL_SEC}s"
    
    # Initialize
    update_last_activity
    
    while true; do
        local state=$(get_state)
        local intensity=$(calculate_intensity)
        local tool="monitor"
        
        # Send ping (suppress output unless error)
        if ! "$PING_SCRIPT" "$state" "$intensity" "$tool" > /dev/null 2>&1; then
            echo "$(date): Failed to send activity ping" >&2
        fi
        
        sleep "$PING_INTERVAL_SEC"
    done
}

# Handle activity notifications from OpenClaw
# Usage: padraig-activity.sh notify [tool_name]
if [ "$1" = "notify" ]; then
    update_last_activity
    tool="${2:-openclaw}"
    "$PING_SCRIPT" "working" "2" "$tool"
    exit $?
fi

# Run main loop if called directly
main
