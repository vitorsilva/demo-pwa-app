# Party Mode: Cron Job Setup Guide

**Purpose:** Configure automated cleanup of temporary Party Mode data (signaling messages, expired rooms, rate limits)

**Status:** Required for production deployment

---

## What Gets Cleaned Up?

The cleanup script (`php-api/party/cleanup.php`) removes:

1. **Signaling messages** older than 60 seconds
   - These are WebRTC offer/answer/ICE messages
   - Only needed during P2P connection setup
   - Safe to delete after 60 seconds

2. **Expired rooms** older than 2 hours
   - Marks inactive rooms as 'ended'
   - Prevents abandoned rooms from accumulating

3. **Rate limit records** older than 2 hours
   - Tracks room creation per IP (10 rooms/hour limit)
   - Old records can be purged

**Why this matters:** Without cleanup, the database will fill with temporary data that's no longer needed.

---

## Quick Answer: ICE Stands For...

**ICE = Interactive Connectivity Establishment**

It's the algorithm that:
1. Discovers all possible connection paths between peers
2. Tests each path in priority order
3. Selects the best working path

See the main explanation for full details!

---

## Prerequisites

1. SSH access to your VPS (saberloop.com)
2. PHP CLI installed (should already be available)
3. Party Mode backend deployed to `/home/youruser/public_html/party/`
4. Cron access (usually via cPanel or direct SSH)

---

## Setup Instructions

### Option 1: cPanel Cron Jobs (Recommended for Shared Hosting)

**Step 1: Log in to cPanel**
- Go to your hosting control panel
- Navigate to: **Advanced** → **Cron Jobs**

**Step 2: Add New Cron Job**

**Schedule:** Every 15 minutes
- **Minute:** `*/15`
- **Hour:** `*`
- **Day:** `*`
- **Month:** `*`
- **Weekday:** `*`

**Command:**
```bash
/usr/bin/php /home/youruser/public_html/party/cleanup.php >> /home/youruser/party-cleanup.log 2>&1
```

**Important:** Replace `/home/youruser/` with your actual home directory path!

**What this does:**
- Runs every 15 minutes
- Logs output to `party-cleanup.log` in your home directory
- `2>&1` redirects errors to the same log file

**Step 3: Save and Verify**

After saving, you should see the cron job listed. Within 15 minutes, check the log:

```bash
# SSH into server
ssh youruser@saberloop.com

# Check the log file
cat ~/party-cleanup.log
```

**Expected output:**
```
[2026-01-12 14:30:01] Starting cleanup...
  - Expired rooms ended: 3
  - Signaling messages deleted: 47
[2026-01-12 14:30:01] Cleanup complete.

[2026-01-12 14:45:01] Starting cleanup...
  - Expired rooms ended: 0
  - Signaling messages deleted: 12
[2026-01-12 14:45:01] Cleanup complete.
```

---

### Option 2: Direct Crontab (SSH Access)

**Step 1: SSH into server**
```bash
ssh youruser@saberloop.com
```

**Step 2: Edit crontab**
```bash
crontab -e
```

**Step 3: Add this line**
```
*/15 * * * * /usr/bin/php /home/youruser/public_html/party/cleanup.php >> /home/youruser/party-cleanup.log 2>&1
```

**Step 4: Save and exit**
- If using nano: `Ctrl+X`, then `Y`, then `Enter`
- If using vim: `Esc`, then `:wq`, then `Enter`

**Step 5: Verify crontab**
```bash
crontab -l
```

Should show your new cron job.

---

### Option 3: Web-Based Cleanup (Fallback)

If cron access is unavailable, you can trigger cleanup via HTTP with a secret token.

**Step 1: Set CLEANUP_TOKEN environment variable**

Add to `.env` or server environment:
```
CLEANUP_TOKEN=your-random-secret-here-12345
```

**Step 2: Trigger via HTTP**
```bash
curl "https://saberloop.com/party/cleanup.php?token=your-random-secret-here-12345"
```

**Step 3: Automate with external cron service**

Use a free service like:
- **cron-job.org** (free, reliable)
- **EasyCron** (free tier available)
- **UptimeRobot** (can ping URLs)

Configure it to call your cleanup URL every 15 minutes.

**Security note:** Keep your CLEANUP_TOKEN secret! Anyone with this token can trigger cleanup.

---

## Monitoring & Troubleshooting

### Check Cleanup Logs

**View recent logs:**
```bash
tail -n 50 ~/party-cleanup.log
```

**Watch logs in real-time:**
```bash
tail -f ~/party-cleanup.log
```

**Check cron is running:**
```bash
grep -i cron /var/log/syslog | tail -n 20
```

### Common Issues

#### 1. "Permission denied"
```
-bash: /home/youruser/public_html/party/cleanup.php: Permission denied
```

**Fix:** Make script executable
```bash
chmod +x /home/youruser/public_html/party/cleanup.php
```

#### 2. "PHP command not found"
```
/usr/bin/php: No such file or directory
```

**Fix:** Find PHP path
```bash
which php
# Output: /usr/local/bin/php (or similar)

# Update cron command with correct path
/usr/local/bin/php /home/youruser/public_html/party/cleanup.php ...
```

#### 3. No output in log file

**Check:** Does the log file exist?
```bash
ls -l ~/party-cleanup.log
```

**Create it manually if needed:**
```bash
touch ~/party-cleanup.log
chmod 644 ~/party-cleanup.log
```

#### 4. Database connection errors
```
[2026-01-12 14:30:01] Error: SQLSTATE[HY000] [1045] Access denied
```

**Fix:** Verify `config.local.php` exists and has correct credentials
```bash
cat /home/youruser/public_html/party/config.local.php
```

Should contain:
```php
<?php
return [
    'db' => [
        'host' => 'localhost',
        'name' => 'youruser_saberloop_party',
        'user' => 'youruser_party',
        'pass' => 'your-password-here',
    ],
];
```

---

## Testing the Cleanup Script

**Manual test (SSH):**
```bash
# Navigate to party directory
cd /home/youruser/public_html/party/

# Run cleanup script
php cleanup.php

# Expected output:
# [2026-01-12 15:00:00] Starting cleanup...
#   - Expired rooms ended: 1
#   - Signaling messages deleted: 23
# [2026-01-12 15:00:00] Cleanup complete.
```

**Check what would be deleted:**

Query the database to see old data:

```sql
-- Signaling messages older than 60 seconds
SELECT COUNT(*)
FROM party_signaling
WHERE created_at < DATE_SUB(NOW(), INTERVAL 60 SECOND);

-- Rooms older than 2 hours (not ended)
SELECT COUNT(*)
FROM party_rooms
WHERE status != 'ended'
  AND created_at < DATE_SUB(NOW(), INTERVAL 2 HOUR);

-- Rate limits older than 2 hours
SELECT COUNT(*)
FROM party_rate_limits
WHERE created_at < DATE_SUB(NOW(), INTERVAL 2 HOUR);
```

---

## Cleanup Schedule Tuning

Default schedule is **every 15 minutes**. Adjust based on usage:

### High Traffic (adjust in crontab)

**Every 5 minutes:**
```
*/5 * * * * php /path/to/cleanup.php ...
```

**Every 10 minutes:**
```
*/10 * * * * php /path/to/cleanup.php ...
```

### Low Traffic

**Every 30 minutes:**
```
*/30 * * * * php /path/to/cleanup.php ...
```

**Every hour:**
```
0 * * * * php /path/to/cleanup.php ...
```

**Recommendation:** Start with 15 minutes, monitor log file size, adjust as needed.

---

## Cleanup Configuration (Advanced)

Cleanup behavior is configurable in `php-api/party/config.php`:

```php
return [
    'room' => [
        'expiry_hours' => 2,  // Rooms expire after 2 hours
    ],
    'signaling' => [
        'message_expiry_seconds' => 60,  // Signaling messages expire after 60 seconds
    ],
    'rate_limit' => [
        // Rate limit records deleted after 2 hours (hardcoded in RoomManager.php:621)
    ],
];
```

**To customize:** Create/edit `config.local.php`:

```php
<?php
return [
    'room' => [
        'expiry_hours' => 4,  // Keep rooms for 4 hours instead
    ],
    'signaling' => [
        'message_expiry_seconds' => 120,  // Keep signaling for 2 minutes
    ],
    // ... other config
];
```

**When to adjust:**

- **Increase expiry times:** If users report connection issues (needs more time to establish P2P)
- **Decrease expiry times:** If database is growing too large

---

## Log Rotation (Optional)

If `party-cleanup.log` grows too large, set up log rotation:

**Create `/etc/logrotate.d/party-cleanup`:**
```
/home/youruser/party-cleanup.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
}
```

Or use a simpler cron job to truncate the log monthly:

```bash
# Add to crontab: truncate log on 1st of each month at 3 AM
0 3 1 * * > /home/youruser/party-cleanup.log
```

---

## Verification Checklist

Once cron is configured, verify:

- [ ] Cron job is listed in `crontab -l` or cPanel
- [ ] Log file exists: `ls -l ~/party-cleanup.log`
- [ ] Log file is being written to (check timestamp)
- [ ] Cleanup script runs successfully (no errors in log)
- [ ] Old signaling messages are being deleted (query database)
- [ ] Expired rooms are being marked as 'ended'
- [ ] No PHP errors or warnings in log

**Monitor for the first 24 hours** to ensure everything works correctly.

---

## Next Steps

After setting up cron:

1. **Monitor logs** for the first day (check `party-cleanup.log`)
2. **Test Party Mode** in production to ensure no issues
3. **Set up database monitoring** (optional: track table sizes over time)
4. **Add alerting** (optional: get notified if cleanup fails)

---

## Related Documentation

- **Phase 3 Learning Notes:** `docs/learning/epic06_sharing/PHASE3_LEARNING_NOTES.md`
- **Party Mode Architecture:** `docs/learning/epic06_sharing/PHASE3_PARTY_SESSION.md`
- **Backend Code:** `php-api/party/cleanup.php`
- **Database Schema:** `php-api/party/migrations/001_create_tables.sql`

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review cleanup script logs: `tail -f ~/party-cleanup.log`
3. Test manual cleanup: `php cleanup.php`
4. Check database connectivity: verify `config.local.php`

**Common issues are usually:**
- Incorrect file paths in cron command
- PHP path mismatch (`/usr/bin/php` vs `/usr/local/bin/php`)
- Database credentials missing or incorrect
- File permissions preventing script execution
