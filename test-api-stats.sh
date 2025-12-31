#!/bin/bash
echo "Testing API stats endpoint..."
echo ""
curl -s http://127.0.0.1:3737/api/stats/daily | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('Date:', data.get('date'))
print('Total Active Seconds:', data.get('total_active_seconds'))
print('Total Active Time:', data.get('total_active_seconds', 0) // 3600, 'h', (data.get('total_active_seconds', 0) % 3600) // 60, 'm')
print('App Switches:', data.get('app_switches'))
print('')
print('Top Apps:')
for i, app in enumerate(data.get('top_apps', [])[:5], 1):
    hours = app['active_seconds'] // 3600
    mins = (app['active_seconds'] % 3600) // 60
    pct = (app['active_seconds'] / data.get('total_active_seconds', 1)) * 100
    print(f\"  {i}. {app['app_name']:30s} {hours}h {mins}m ({pct:.1f}%)\")
"

