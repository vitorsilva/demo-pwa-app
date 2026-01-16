<?php
/**
 * Cleanup Script
 *
 * Run periodically via cron to clean up expired data:
 * - End expired rooms (older than 2 hours)
 * - Delete old signaling messages
 * - Delete old rate limit records.
 */

// Allow running from CLI only or with a secret token
$isCliMode = php_sapi_name() === 'cli';
$hasValidToken = isset($_GET['token']) && $_GET['token'] === ($_ENV['CLEANUP_TOKEN'] ?? 'change-me');

if (!$isCliMode && !$hasValidToken) {
    http_response_code(403);
    echo "Forbidden\n";
    exit(1);
}

require_once __DIR__ . '/RoomManager.php';
require_once __DIR__ . '/SignalingManager.php';

$timestamp = date('Y-m-d H:i:s');
echo "[{$timestamp}] Starting cleanup...\n";

try {
    $roomManager = new RoomManager();
    $signalingManager = new SignalingManager();

    $expiredRooms = $roomManager->cleanup();
    echo "  - Expired rooms ended: {$expiredRooms}\n";

    $deletedMessages = $signalingManager->cleanup();
    echo "  - Signaling messages deleted: {$deletedMessages}\n";

    echo "[{$timestamp}] Cleanup complete.\n\n";

} catch (Exception $e) {
    echo "[{$timestamp}] Error: " . $e->getMessage() . "\n\n";
    exit(1);
}
