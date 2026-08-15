#!/bin/bash

# Check for active SSH connections
SSH_CONNECTIONS=$(who | grep -c "pts/")
if [ "$SSH_CONNECTIONS" -gt 0 ]; then
    echo "$(date) - Active SSH connections found ($SSH_CONNECTIONS). Skipping shutdown."
    exit 0
fi

# Skip shutdown if system rebooted recently
UPTIME_SECONDS=$(awk '{print int($1)}' /proc/uptime)
if [ "$UPTIME_SECONDS" -lt 600 ]; then
    echo "$(date) - System just booted. Skipping check."
    exit 0
fi

# Get last database activity timestamp from log
LAST_ACTIVITY=$(tail -1 /var/log/infra_access.log | awk '{print $1, $2, $3, $4}')

# ✅ Guard: skip if log is empty or timestamp unreadable
if [ -z "$LAST_ACTIVITY" ]; then
    echo "$(date) - No log entries found. Skipping shutdown check."
    exit 0
fi

LAST_EPOCH=$(date -d "$LAST_ACTIVITY" +%s 2>/dev/null)

# ✅ Guard: skip if timestamp couldn't be parsed
if [ -z "$LAST_EPOCH" ]; then
    echo "$(date) - Could not parse timestamp. Skipping shutdown check."
    exit 0
fi

CURRENT_EPOCH=$(date +%s)
DIFF=$((CURRENT_EPOCH - LAST_EPOCH))

if [ $DIFF -gt 900 ]; then
    echo "$(date) : No activity for 15 mins - shutting down"
    sudo shutdown -h now
else
    echo "$(date) : Last activity ${DIFF}s ago - staying on"
fi
