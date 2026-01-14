  -- Party Backend Migration 003: Minimize Server Data
  -- Makes name fields optional for P2P mode where names are shared via WebRTC.
  --
  -- Run this migration after deploying the updated PHP code.
  -- Database: mdemaria_saberloop_party

  -- =====================================================
  -- Make host_name optional (P2P mode doesn't send it)
  -- =====================================================
  ALTER TABLE party_rooms
    MODIFY COLUMN host_name VARCHAR(50) NULL COMMENT 'Display name of host (NULL in P2P mode)';

  -- =====================================================
  -- Make participant name optional (P2P mode doesn't send it)
  -- =====================================================
  ALTER TABLE party_participants
    MODIFY COLUMN name VARCHAR(50) NULL COMMENT 'Display name (NULL in P2P mode)';

  -- =====================================================
  -- Add score column to party_participants (if not exists)
  -- This may already exist from a previous migration
  -- =====================================================
  -- Note: Skipping this as it likely already exists

  -- =====================================================
  -- Add expires_at for automatic room cleanup
  -- =====================================================
  ALTER TABLE party_rooms
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL COMMENT 'Auto-cleanup time'
    AFTER ended_at;

  -- Set default expiry for existing rooms (2 hours from creation)      
  UPDATE party_rooms
    SET expires_at = DATE_ADD(created_at, INTERVAL 2 HOUR)
    WHERE expires_at IS NULL;