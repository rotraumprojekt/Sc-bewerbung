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
  res.render('public/edition', { edition, formatDate, errors: [], formData: {} });
});

router.post('/edition/:slug/apply', upload.single('photo'), (req, res) => {
  const edition = db.getEditionBySlug(req.params.slug);
  if (!edition || !edition.published) {
    return res.status(404).render('public/not-found');
  }

  if (!edition.applicationsOpen) {
    return res.status(400).render('public/edition', {
      edition, formatDate, formData: req.body,
      errors: ['Applications for this Edition are closed.']
    });
  }

  const { name, email, phone, birthdate, instagram, motivation } = req.body;
  const errors = [];

  if (!name || !name.trim()) errors.push('Please enter your name.');
  if (!email || !email.trim()) errors.push('Please enter your email address.');
  if (!req.file) errors.push('Please upload a photo of yourself.');

  if (!errors.length && db.findExistingApplication(edition.id, email)) {
    errors.push('An application with this email has already been submitted for this Edition.');
  }

  if (errors.length) {
    return res.status(400).render('public/edition', {
      edition, formatDate, formData: req.body, errors
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

  let message = 'Something went wrong while submitting your application. Please try again.';
  if (err.message === 'INVALID_FILE_TYPE') {
    message = 'Please upload your photo as JPG, PNG or WEBP.';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'Your photo is too large. Maximum file size is 8 MB.';
  }

  res.status(400).render('public/edition', {
    edition, formatDate, formData: req.body || {}, errors: [message]
  });
});

module.exports = router;
