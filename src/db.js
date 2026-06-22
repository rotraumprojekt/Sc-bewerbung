const fs = require('fs');
const path = require('path');

// DATA_DIR kann per Umgebungsvariable gesetzt werden (z. B. fuer einen
// Persistent Disk Mountpoint bei Render). Lokal ohne DATA_DIR wird einfach
// der Ordner "data" im Projekt verwendet.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      editions: [],
      applications: [],
      adminUsers: [],
      nextIds: { editions: 1, applications: 1, adminUsers: 1 }
    };
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// --- Editions ---
function listEditions() {
  const db = readDb();
  return db.editions.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
}

function listPublishedEditions() {
  return listEditions().filter(e => e.published);
}

function getEditionById(id) {
  const db = readDb();
  return db.editions.find(e => e.id === Number(id)) || null;
}

function getEditionBySlug(slug) {
  const db = readDb();
  return db.editions.find(e => e.slug === slug) || null;
}

function createEdition(data) {
  const db = readDb();
  const id = db.nextIds.editions++;
  const edition = {
    id,
    name: data.name,
    slug: data.slug,
    date: data.date || '',
    location: data.location || '',
    description: data.description || '',
    published: !!data.published,
    applicationsOpen: data.applicationsOpen !== undefined ? !!data.applicationsOpen : true,
    createdAt: new Date().toISOString()
  };
  db.editions.push(edition);
  writeDb(db);
  return edition;
}

function updateEdition(id, data) {
  const db = readDb();
  const edition = db.editions.find(e => e.id === Number(id));
  if (!edition) return null;
  Object.assign(edition, data);
  writeDb(db);
  return edition;
}

// --- Applications ---
function listApplicationsByEdition(editionId) {
  const db = readDb();
  return db.applications
    .filter(a => a.editionId === Number(editionId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function listAcceptedByEdition(editionId) {
  return listApplicationsByEdition(editionId).filter(a => a.status === 'accepted');
}

function getApplicationById(id) {
  const db = readDb();
  return db.applications.find(a => a.id === Number(id)) || null;
}

function getApplicationByToken(token) {
  const db = readDb();
  return db.applications.find(a => a.accessToken === token) || null;
}

function findExistingApplication(editionId, email) {
  const db = readDb();
  return db.applications.find(
    a => a.editionId === Number(editionId) && a.email.toLowerCase() === String(email).toLowerCase()
  ) || null;
}

function createApplication(data) {
  const db = readDb();
  const id = db.nextIds.applications++;
  const application = {
    id,
    editionId: Number(data.editionId),
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    birthdate: data.birthdate || '',
    instagram: data.instagram || '',
    motivation: data.motivation || '',
    photo: data.photo,
    status: 'pending',
    accessToken: null,
    createdAt: new Date().toISOString()
  };
  db.applications.push(application);
  writeDb(db);
  return application;
}

function setApplicationStatus(id, status, accessToken) {
  const db = readDb();
  const application = db.applications.find(a => a.id === Number(id));
  if (!application) return null;
  application.status = status;
  if (accessToken !== undefined) application.accessToken = accessToken;
  writeDb(db);
  return application;
}

// --- Admin users ---
function getAdminByUsername(username) {
  const db = readDb();
  return db.adminUsers.find(u => u.username.toLowerCase() === String(username).toLowerCase()) || null;
}

function countAdminUsers() {
  const db = readDb();
  return db.adminUsers.length;
}

function createAdminUser(username, passwordHash) {
  const db = readDb();
  const id = db.nextIds.adminUsers++;
  const user = { id, username, passwordHash, createdAt: new Date().toISOString() };
  db.adminUsers.push(user);
  writeDb(db);
  return user;
}

module.exports = {
  listEditions,
  listPublishedEditions,
  getEditionById,
  getEditionBySlug,
  createEdition,
  updateEdition,
  listApplicationsByEdition,
  listAcceptedByEdition,
  getApplicationById,
  getApplicationByToken,
  findExistingApplication,
  createApplication,
  setApplicationStatus,
  getAdminByUsername,
  countAdminUsers,
  createAdminUser
};
