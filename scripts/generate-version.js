  import fs from 'fs';

  const VERSION_FILE = 'src/version.js';
  const VERSION_HISTORY = '.version-history.json';

  /**
   * Pure function: Calculate next version number
   * @param {Object} history - Previous version history
   * @param {string} currentDate - Current date in YYYYMMDD format
   * @returns {Object} - New version info { version, seq, dateStr }
   */
  export function calculateVersion(history, currentDate) {
    // Determine sequence number (always increment, never reset)
    const seq = history.lastSeq + 1;

    // Format: YYYYMMDD.NN (e.g., 20251126.01)
    const version = `${currentDate}.${String(seq).padStart(2, '0')}`;

    return {
      version,
      seq,
      dateStr: currentDate
    };
  }

  /**
   * Format current date as YYYYMMDD
   * @param {Date} date - Date object
   * @returns {string} - Formatted date string
   */
  export function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  function generateVersion() {
    const now = new Date();
    const dateStr = formatDate(now);

    // Load version history
    let history = { lastDate: '', lastSeq: 0 };
    if (fs.existsSync(VERSION_HISTORY)) {
      history = JSON.parse(fs.readFileSync(VERSION_HISTORY, 'utf8'));
    }

    // Calculate new version
    const { version, seq } = calculateVersion(history, dateStr);

    // Save history
    fs.writeFileSync(VERSION_HISTORY, JSON.stringify({
      lastDate: dateStr,
      lastSeq: seq
    }, null, 2));

    // Generate version module
    const versionModule = `// Auto-generated - do not edit manually
  export const APP_VERSION = '${version}';
`;

    fs.writeFileSync(VERSION_FILE, versionModule);
    console.log(`✅ Generated version: ${version}`);

    return version;
  }

  generateVersion();