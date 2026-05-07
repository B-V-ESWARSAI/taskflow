const fs = require('fs');
const path = require('path');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '../data.json');

const defaultData = {
  users: [],
  projects: [],
  tasks: [],
  projectMembers: [],
};

function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {}
  return { ...defaultData };
}

function writeDB(data) {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Initialize DB
if (!fs.existsSync(DB_FILE)) writeDB(defaultData);

module.exports = { readDB, writeDB };
