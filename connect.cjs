// Convenience runner to invoke backend/connect.cjs from repo root
const path = require('path');
const helper = require(path.join(__dirname, 'backend', 'connect.cjs'));

(async () => {
  try {
    console.log('Running backend/connect.cjs from repo root');
    await helper.connect();
    console.log('Done.');
    await helper.disconnect();
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
