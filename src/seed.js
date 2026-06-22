require('dotenv').config();
const { ensureAdminUser } = require('./utils/ensureAdmin');

async function seed() {
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    console.error('ADMIN_USERNAME und ADMIN_PASSWORD muessen in der .env gesetzt sein.');
    process.exit(1);
  }

  const result = await ensureAdminUser();
  if (result.created) {
    console.log('Admin-User "' + process.env.ADMIN_USERNAME + '" wurde angelegt.');
  } else {
    console.log('Admin-User "' + process.env.ADMIN_USERNAME + '" existiert bereits. Kein neuer Account angelegt.');
  }
}

seed();
