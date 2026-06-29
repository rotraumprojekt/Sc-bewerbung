const express = require('express');
const router = express.Router();
const db = require('../db');
const { upload } = require('../utils/upload');
const { formatDate } = require('../utils/helpers');

router.get('/', (req, res) => {
  const editions = db.listPublishedEditions();
  res.render('public/home', { editions, formatDate });
});

router.get('/edition/:slug', (req, res) => {
  const edition = db.getEditionBySlug(req.params.slug);
  if (!edition || !edition.published) {
    return res.status(404).render('public/not-found');
  }
  const views = db.incrementEditionViews(edition.id);
  res.render('public/edition', { edition, formatDate, errors: [], formData: {}, views });
});

router.post('/edition/:slug/apply', upload.single('photo'), (req, res) => {
  const edition = db.getEditionBySlug(req.params.slug);
  if (!edition || !edition.published) {
    return res.status(404).render('public/not-found');
  }

  if (!edition.applicationsOpen) {
    return res.status(400).render('public/edition', {
      edition, formatDate, formData: req.body,
      errors: ['Bewerbungen für diese Edition sind geschlossen.'],
      views: edition.views || 0
    });
  }

  const { name, email, phone, birthdate, instagram, motivation } = req.body;
  const errors = [];

  if (!name || !name.trim()) errors.push('Bitte gib deinen Namen ein.');
  if (!email || !email.trim()) errors.push('Bitte gib deine E-Mail-Adresse ein.');
  if (!req.file) errors.push('Bitte lade ein Foto von dir hoch.');

  if (!errors.length && db.findExistingApplication(edition.id, email)) {
    errors.push('Für diese Edition wurde mit dieser E-Mail-Adresse bereits eine Bewerbung eingereicht.');
  }

  if (errors.length) {
    return res.status(400).render('public/edition', {
      edition, formatDate, formData: req.body, errors, views: edition.views || 0
    });
  }

  db.createApplication({
    editionId: edition.id,
    name: name.trim(),
    email: email.trim(),
    phone: (phone || '').trim(),
    birthdate: birthdate || '',
    instagram: (instagram || '').trim(),
    motivation: (motivation || '').trim(),
    photo: req.file.filename
  });

  res.render('public/success', { edition });
});

// Multer / Upload error handler (must have 4 args to be recognized by Express)
router.use((err, req, res, next) => {
  if (!err) return next();
  const edition = db.getEditionBySlug(req.params.slug);
  if (!edition) return res.status(404).render('public/not-found');

  let message = 'Beim Absenden deiner Bewerbung ist ein Fehler aufgetreten. Bitte versuche es erneut.';
  if (err.message === 'INVALID_FILE_TYPE') {
    message = 'Bitte lade dein Foto als JPG, PNG oder WEBP hoch.';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'Dein Foto ist zu groß. Maximale Dateigröße: 8 MB.';
  }

  res.status(400).render('public/edition', {
    edition, formatDate, formData: req.body || {}, errors: [message],
    views: edition.views || 0
  });
});

module.exports = router;
