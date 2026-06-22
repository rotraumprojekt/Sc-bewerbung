require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

const db = require('./db');
const { UPLOAD_DIR } = require('./utils/upload');
const { ensureAdminUser } = require('./utils/ensureAdmin');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const communityRoutes = require('./routes/community');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

app.use(session({
  secret: process.env.SESSION_SECRET || 'insecure-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }
}));

app.use('/admin', adminRoutes);
app.use('/community', communityRoutes);
app.use('/', publicRoutes);

app.use((req, res) => {
  res.status(404).render('public/not-found');
});

ensureAdminUser().then((result) => {
  if (result.created) {
    console.log('Admin-User "' + process.env.ADMIN_USERNAME + '" wurde automatisch angelegt.');
  } else if (db.countAdminUsers() === 0) {
    console.log('Kein Admin-User vorhanden. Bitte .env anlegen (ADMIN_USERNAME/ADMIN_PASSWORD) und Server neu starten, oder "npm run seed" ausfuehren.');
  }
}).catch((err) => {
  console.error('Konnte Admin-User nicht automatisch anlegen:', err.message);
});

app.listen(PORT, () => {
  console.log('Social Club Bewerbungstool laeuft auf http://localhost:' + PORT);
});
