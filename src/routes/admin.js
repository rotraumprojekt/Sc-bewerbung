const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { upload } = require('../utils/upload');
const { slugify, generateToken, calculateAge, formatDate, instagramUrl } = require('../utils/helpers');

router.get('/login', (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin');
  res.render('admin/login', { error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.getAdminByUsername(username || '');
  if (!user) {
    return res.status(401).render('admin/login', { error: 'Benutzername oder Passwort ist falsch.' });
  }
  const ok = await bcrypt.compare(password || '', user.passwordHash);
  if (!ok) {
    return res.status(401).render('admin/login', { error: 'Benutzername oder Passwort ist falsch.' });
  }
  req.session.isAdmin = true;
  req.session.username = user.username;
  res.redirect('/admin');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.use(requireAdmin);

router.get('/', (req, res) => {
  const editions = db.listEditions().map(e => {
    const applications = db.listApplicationsByEdition(e.id);
    return Object.assign({}, e, {
      total: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      accepted: applications.filter(a => a.status === 'accepted').length,
      rejected: applications.filter(a => a.status === 'rejected').length
    });
  });
  res.render('admin/dashboard', { editions, formatDate });
});

router.get('/editions/new', (req, res) => {
  res.render('admin/edition-form', { edition: null, error: null });
});

router.post('/editions/new', upload.single('eventPhoto'), (req, res) => {
  const { name, date, location, description, published, applicationsOpen } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).render('admin/edition-form', { edition: req.body, error: 'Bitte einen Namen fuer die Edition angeben.' });
  }
  let slug = slugify(name);
  if (!slug) slug = 'edition';
  if (db.getEditionBySlug(slug)) {
    slug = slug + '-' + Date.now().toString().slice(-5);
  }
  const edition = db.createEdition({
    name: name.trim(),
    slug,
    date: date || '',
    location: (location || '').trim(),
    description: (description || '').trim(),
    photo: req.file ? req.file.filename : null,
    published: published === 'on',
    applicationsOpen: applicationsOpen === 'on'
  });
  res.redirect('/admin/editions/' + edition.id);
});

router.get('/editions/:id', (req, res) => {
  const edition = db.getEditionById(req.params.id);
  if (!edition) return res.status(404).send('Edition nicht gefunden.');
  const applications = db.listApplicationsByEdition(edition.id);
  res.render('admin/edition-detail', { edition, applications, formatDate, calculateAge });
});

router.get('/editions/:id/edit', (req, res) => {
  const edition = db.getEditionById(req.params.id);
  if (!edition) return res.status(404).send('Edition nicht gefunden.');
  res.render('admin/edition-form', { edition, error: null });
});

router.post('/editions/:id/edit', upload.single('eventPhoto'), (req, res) => {
  const edition = db.getEditionById(req.params.id);
  if (!edition) return res.status(404).send('Edition nicht gefunden.');
  const { name, date, location, description, published, applicationsOpen } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).render('admin/edition-form', {
      edition: Object.assign({}, edition, req.body),
      error: 'Bitte einen Namen fuer die Edition angeben.'
    });
  }
  db.updateEdition(edition.id, {
    name: name.trim(),
    date: date || '',
    location: (location || '').trim(),
    description: (description || '').trim(),
    photo: req.file ? req.file.filename : edition.photo,
    published: published === 'on',
    applicationsOpen: applicationsOpen === 'on'
  });
  res.redirect('/admin/editions/' + edition.id);
});

router.get('/applications/:id', (req, res) => {
  const application = db.getApplicationById(req.params.id);
  if (!application) return res.status(404).send('Bewerbung nicht gefunden.');
  const edition = db.getEditionById(application.editionId);
  const communityUrl = (application.status === 'accepted' && application.accessToken)
    ? (req.protocol + '://' + req.get('host') + '/community/' + application.accessToken)
    : null;
  res.render('admin/application-detail', {
    application, edition, formatDate, calculateAge, instagramUrl, communityUrl
  });
});

router.post('/applications/:id/accept', (req, res) => {
  const application = db.getApplicationById(req.params.id);
  if (!application) return res.status(404).send('Bewerbung nicht gefunden.');
  const token = application.accessToken || generateToken();
  db.setApplicationStatus(application.id, 'accepted', token);
  res.redirect('/admin/applications/' + application.id);
});

router.post('/applications/:id/reject', (req, res) => {
  const application = db.getApplicationById(req.params.id);
  if (!application) return res.status(404).send('Bewerbung nicht gefunden.');
  db.setApplicationStatus(application.id, 'rejected');
  res.redirect('/admin/applications/' + application.id);
});

router.post('/applications/:id/reset', (req, res) => {
  const application = db.getApplicationById(req.params.id);
  if (!application) return res.status(404).send('Bewerbung nicht gefunden.');
  db.setApplicationStatus(application.id, 'pending');
  res.redirect('/admin/applications/' + application.id);
});

// Multer / Upload error handler fuer Edition-Fotos (muss 4 Argumente haben,
// damit Express sie als Error-Handler erkennt)
router.use((err, req, res, next) => {
  if (!err) return next();
  let message = 'Beim Hochladen des Fotos ist ein Fehler aufgetreten. Bitte erneut versuchen.';
  if (err.message === 'INVALID_FILE_TYPE') {
    message = 'Bitte das Event-Foto als JPG, PNG oder WEBP hochladen.';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'Das Event-Foto ist zu gross. Maximal 8 MB.';
  }
  const existing = req.params.id ? db.getEditionById(req.params.id) : null;
  res.status(400).render('admin/edition-form', {
    edition: Object.assign({}, existing, req.body),
    error: message
  });
});

module.exports = router;
