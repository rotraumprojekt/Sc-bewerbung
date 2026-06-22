const express = require('express');
const router = express.Router();
const db = require('../db');
const { instagramUrl } = require('../utils/helpers');

router.get('/:token', (req, res) => {
  const application = db.getApplicationByToken(req.params.token);
  if (!application || application.status !== 'accepted') {
    return res.status(404).render('community/invalid');
  }
  const edition = db.getEditionById(application.editionId);
  const members = db.listAcceptedByEdition(edition.id);
  res.render('community/community', { edition, members, viewer: application, instagramUrl });
});

module.exports = router;
