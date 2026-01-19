# Telemetry Analysis Guide

This guide explains how to download, import, and analyze telemetry data from the Saberloop production environment.

## Overview

Saberloop collects telemetry data (metrics, errors, Web Vitals, user events) from the production app and stores it on the VPS. This data can be downloaded and analyzed locally using either:

1. **Quick Analysis** - Error report script (no Docker required)
2. **Full Analysis** - Grafana + Loki stack (Docker required)

### Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌────────────────┐
│  Browser Events     │     │  VPS Endpoint    │     │  Daily JSONL    │     │  Local         │
│  (telemetry.js)     │────▶│  (ingest.php)    │────▶│  Files          │────▶│  Analysis      │
└─────────────────────┘     └──────────────────┘     └─────────────────┘     └────────────────┘
                                                              │
                                                              ▼
                                                     ┌─────────────────┐
                                                     │  Download via   │
                                                     │  FTP/WinSCP     │
                                                     └─────────────────┘
                                                              │
                                    ┌─────────────────────────┼─────────────────────────┐
                                    ▼                                                   ▼
                           ┌─────────────────┐                                 ┌─────────────────┐
                           │  Quick Analysis │                                 │  Full Analysis  │
                           │  (error-report) │                                 │  (Grafana+Loki) │
                           └─────────────────┘                                 └─────────────────┘
```

## Prerequisites

| Requirement | For | Check Command |
|-------------|-----|---------------|
| Node.js 18+ | All scripts | `node --version` |
| FTP credentials | Download | Check `.env` for `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD` |
| WinSCP (optional) | Automated download | `winget install WinSCP.WinSCP` |
| Docker Desktop | Grafana/Loki | `docker --version` |

## Quick Start

### Option A: Quick Error Analysis (No Docker)

```bash
# 1. Download logs (or manually via FTP client)
.\scripts\telemetry\download.ps1 -Days 7

# 2. Run error report
npm run telemetry:errors
```

### Option B: Full Analysis with Grafana

```bash
# 1. Download logs
.\scripts\telemetry\download.ps1 -Days 7

# 2. Start Loki + Grafana
docker-compose -f docker-compose.telemetry.yml up -d

# 3. Import logs to Loki
npm run telemetry:import

# 4. Open Grafana
# http://localhost:3000 (admin/admin)
```

---

## Step 1: Download Telemetry Logs

Telemetry logs are stored on the VPS at `/telemetry/logs/` as daily JSONL files:
- `telemetry-2025-12-23.jsonl`
- `telemetry-2025-12-24.jsonl`
- etc.

### Using the Download Script (Windows PowerShell)

```powershell
# Download last 7 days (default)
.\scripts\telemetry\download.ps1

# Download last 30 days
.\scripts\telemetry\download.ps1 -Days 30

# Download to custom directory
.\scripts\telemetry\download.ps1 -Days 7 -OutputDir .\my-logs
```

**Requirements:**
- FTP credentials in `.env`:
  ```
  FTP_HOST=your-ftp-host
  FTP_USER=your-username
  FTP_PASSWORD=your-password
  ```
- WinSCP CLI (optional, for automated download)

### Manual Download (FTP Client)

If you prefer FileZilla or another FTP client:

1. Connect to your FTP server
2. Navigate to `/telemetry/logs/`
3. Download `telemetry-*.jsonl` files
4. Save to `./telemetry-logs/` in the project root

### Verifying Downloaded Logs

```bash
# Check downloaded files
ls telemetry-logs/

# Check file sizes
ls -la telemetry-logs/

# Preview a log file (first 5 lines)
head -5 telemetry-logs/telemetry-2025-12-23.jsonl
```

---

## Step 2: Quick Analysis (Error Report)

The error report script analyzes downloaded logs without requiring Docker.

### Running the Report

```bash
# Analyze all available data
npm run telemetry:errors

# Analyze last 7 days only
npm run telemetry:errors -- --days 7

# Analyze last 24 hours
npm run telemetry:errors -- --days 1

# Use custom directory
npm run telemetry:errors -- --dir ./my-logs
```

### Understanding the Report

The report includes:

| Section | Description |
|---------|-------------|
| **Summary** | Total events, error counts, affected sessions |
| **Top Errors** | Most frequent error messages (top 10) |
| **Top Warnings** | Most frequent warnings (top 5) |
| **Failed Operations** | Failed quiz generation, API calls, etc. |
| **Error Patterns** | Errors by page and by hour (UTC) |
| **Recommendations** | Actionable fixes based on error analysis |

### Example Output

```
╔══════════════════════════════════════════════════════════════╗
║           SABERLOOP TELEMETRY ERROR REPORT                   ║
║           Last 7 days                                        ║
╚══════════════════════════════════════════════════════════════╝

SUMMARY
 Total Events:        15234
 Total Errors:        127 (0.8%)
 Total Warnings:      43 (0.3%)
 Failed Metrics:      12
 Sessions Analyzed:   456
 Sessions w/Errors:   34 (7.5%)

TOP ERRORS (by frequency)
  1. "Failed to fetch explanation" (45x)
     First: 2025-12-21
     Last:  2025-12-26
     Sessions: 23
```

---

## Step 3: Full Analysis with Grafana + Loki

For deeper analysis, use the Grafana + Loki Docker stack.

### Starting the Stack

```bash
# Start both containers (detached)
docker-compose -f docker-compose.telemetry.yml up -d

# Verify containers are running
docker ps --filter "name=saberloop"

# Expected output:
# NAMES              STATUS         PORTS
# saberloop-grafana  Up X minutes   0.0.0.0:3000->3000/tcp
# saberloop-loki     Up X minutes   0.0.0.0:3100->3100/tcp
```

### Importing Logs to Loki

```bash
# Import all logs from ./telemetry-logs
npm run telemetry:import

# Or with custom directory
node scripts/telemetry/import-to-loki.cjs ./my-logs
```

**What the import does:**
1. Checks Loki is ready (`/ready` endpoint)
2. Reads each `.jsonl` file (streaming for memory efficiency)
3. Groups events by type (metric, vital, event, error)
4. Batches 100 events at a time
5. Pushes to Loki with labels `{app="saberloop", type="..."}`

### Accessing Grafana

1. Open http://localhost:3000
2. Login with `admin` / `admin`
3. Skip password change (or set a new one)
4. Go to **Explore** (compass icon in sidebar)
5. Select **Loki** datasource (pre-configured)

### Querying Logs in Grafana

#### Basic Queries

```logql
# All Saberloop events
{app="saberloop"}

# Only errors
{app="saberloop", type="error"}

# Only Web Vitals
{app="saberloop", type="vital"}

# Only metrics (quiz generation, etc.)
{app="saberloop", type="metric"}

# User events (actions)
{app="saberloop", type="event"}
```

#### Filtering by Content

```logql
# Errors containing "fetch"
{app="saberloop", type="error"} |= "fetch"

# Quiz generation events
{app="saberloop", type="metric"} |= "quiz_generation"

# LCP Web Vitals
{app="saberloop", type="vital"} |= "LCP"

# Specific session
{app="saberloop"} |= "1766744160751-qg4abun"
```

#### JSON Parsing

```logql
# Parse JSON and filter by field
{app="saberloop", type="vital"} | json | data_name="LCP"

# Get average LCP value
avg_over_time({app="saberloop", type="vital"} | json | data_name="LCP" | unwrap data_value [1h])
```

### Stopping the Stack

```bash
# Stop containers (keeps data)
docker-compose -f docker-compose.telemetry.yml down

# Stop and delete all data
docker-compose -f docker-compose.telemetry.yml down -v
```

---

## Event Types Reference

### Event Structure

Every telemetry event has this structure:

```json
{
  "type": "metric|vital|event|error",
  "data": { /* event-specific payload */ },
  "timestamp": "2025-12-26T10:16:03.046Z",
  "sessionId": "1766744160751-qg4abun",
  "url": "https://saberloop.com/app/#/quiz",
  "userAgent": "Mozilla/5.0...",
  "_server": {
    "receivedAt": "2025-12-26T10:16:15+00:00",
    "batchSentAt": "2025-12-26T10:16:03.000Z"
  }
}
```

### Event Types

| Type | Description | Example Data |
|------|-------------|--------------|
| `metric` | Performance/operation metrics | `{ name: "quiz_generation", value: 5048, status: "success", topic: "Math" }` |
| `vital` | Core Web Vitals (LCP, INP, CLS) | `{ name: "LCP", value: 172, rating: "good" }` |
| `event` | User actions | `{ action: "explanation_opened", questionIndex: 0 }` |
| `error` | Errors caught | `{ message: "Failed to fetch", context: { error: "..." } }` |

### Web Vitals Ratings

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5s - 4s | > 4s |
| INP | < 200ms | 200ms - 500ms | > 500ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |

---

## Troubleshooting

### Download Script Fails

**"FTP credentials not found"**
- Ensure `.env` has `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`
- Restart PowerShell after editing `.env`

**"WinSCP not found"**
- Install: `winget install WinSCP.WinSCP`
- Or download manually via FTP client (FileZilla, etc.)

### Import Script Fails

**"Loki is not running"**
```bash
# Start the stack
docker-compose -f docker-compose.telemetry.yml up -d

# Check logs if container keeps restarting
docker logs saberloop-loki
```

**"Directory not found: ./telemetry-logs"**
- Run the download script first
- Or create the directory and copy `.jsonl` files manually

### Grafana Issues

**Can't login**
- Default credentials: `admin` / `admin`
- If changed, check Docker volume or recreate: `docker-compose down -v && docker-compose up -d`

**No data in Explore**
- Verify import completed: check console output for "Import Complete"
- Check time range in Grafana (top-right) - data may be outside visible range
- Verify Loki datasource is selected (not Prometheus)

**"No labels found" error**
- Loki needs time to index logs after import
- Wait 30 seconds and refresh
- Try simpler query: `{app="saberloop"}`

### Docker Issues

**Containers won't start**
```bash
# Check Docker is running
docker info

# Check for port conflicts
netstat -an | findstr "3000\|3100"

# View container logs
docker logs saberloop-loki
docker logs saberloop-grafana
```

**Out of disk space**
```bash
# Clean up Docker
docker system prune -f

# Remove old Loki data
docker-compose -f docker-compose.telemetry.yml down -v
```

---

## Best Practices

### Regular Analysis Schedule

| Frequency | Analysis Type | Purpose |
|-----------|--------------|---------|
| Daily | Quick error report | Catch critical issues |
| Weekly | Full Grafana analysis | Trend analysis, performance review |
| After deploy | Both | Verify no new errors introduced |

### Data Retention

- VPS keeps 30 days of logs (auto-rotated)
- Download important data before it expires
- Local Loki data persists in Docker volume

### Privacy Considerations

- Telemetry does not log user IP addresses
- Session IDs are random, not tied to users
- No PII is collected in telemetry events

---

## npm Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `telemetry:import` | `node scripts/telemetry/import-to-loki.cjs` | Import logs to Loki |
| `telemetry:errors` | `node scripts/telemetry/error-report.cjs` | Generate error report |

---

## Related Documentation

- [Configuration Guide](./CONFIGURATION.md) - Environment variables including telemetry settings
- [Troubleshooting](./TROUBLESHOOTING.md) - General troubleshooting
- [Epic 9 Plan](../learning/epic09_telemetry_analysis/EPIC9_TELEMETRY_ANALYSIS_PLAN.md) - Telemetry analysis epic

## File Locations

| File | Purpose |
|------|---------|
| `src/utils/telemetry.js` | Frontend telemetry client |
| `php-api/telemetry/ingest.php` | VPS endpoint |
| `scripts/telemetry/download.ps1` | Download script (PowerShell) |
| `scripts/telemetry/import-to-loki.cjs` | Import to Loki |
| `scripts/telemetry/error-report.cjs` | Quick error analysis |
| `docker-compose.telemetry.yml` | Grafana + Loki stack |
| `docker/loki-config.yml` | Loki configuration |
| `docker/grafana-datasources.yml` | Grafana datasource config |
