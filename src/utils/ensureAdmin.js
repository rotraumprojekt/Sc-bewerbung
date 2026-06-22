const bcrypt = require('bcryptjs');
const db = require('../db');

// Legt beim Start automatisch einen Admin-User an, falls ADMIN_USERNAME /
// ADMIN_PASSWORD in den Umgebungsvariablen gesetzt sind und noch kein
// Account mit diesem Benutzernamen existiert. Praktisch fuer Cloud-Hosting
// (z. B. Render), wo man keinen separaten Shell-Befehl ausfuehren moechte.
// Existiert der Account schon, passiert nichts (idempotent).
async function ensureAdminUser() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return { created: false, reason: 'missing-env' };
  }

  const existing = db.getAdminByUsername(username);
  if (existing) {
    return { created: false, reason: 'already-exists' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  db.createAdminUser(username, passwordHash);
  return { created: true };
}

module.exports = { ensureAdminUser };
