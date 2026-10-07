// Safety rail shared by every probe: they create and delete users, courses, posts and money records, so they must
// only ever run against a database on THIS machine (or the CI service container), never the live one.
const DEFAULT_URL = 'postgresql://postgres:audit@localhost:55432/audit';

function probeDatabaseUrl() {
  const url = process.env.PROBE_DATABASE_URL || DEFAULT_URL;
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error('PROBE_DATABASE_URL is not a valid URL');
  }
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) {
    throw new Error(`Refusing to run probes against "${host}": they write test data. Use a local throwaway database.`);
  }
  return url;
}

module.exports = { probeDatabaseUrl };
