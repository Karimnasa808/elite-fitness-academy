// db.js
// طبقة تخزين بسيطة تعتمد على ملف JSON واحد بدل قاعدة بيانات منفصلة.
// السبب: المشروع مخصص لمدرب واحد بعدد لاعبين محدود، فمفيش حاجة لتعقيد
// تشغيل قاعدة بيانات منفصلة. الملف نفسه هو "قاعدة البيانات" ويتم
// قراءته وكتابته بشكل متزامن (synchronous) لضمان عدم تعارض الكتابة.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "data", "db.json");

const DEFAULT_DB = {
  coach: null, // { id, username, passwordHash, name }
  branches: [],
  players: [],
  exerciseTypes: [], // { id, name, unit, lowerIsBetter, createdAt }
  measurements: [],
  attendance: [],
  branchHistory: [],
  meta: { nextId: 1 },
};

function ensureDbFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
  }
}

function readDb() {
  ensureDbFile();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error("ملف قاعدة البيانات تالف: " + e.message);
  }
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

function nextId(db) {
  const id = db.meta.nextId;
  db.meta.nextId += 1;
  return id;
}

// واجهة بسيطة على شكل "collections" تشبه قاعدة بيانات حقيقية
export const db = {
  read: readDb,
  write: writeDb,
  nextId,

  // Generic helpers
  all(collection) {
    const data = readDb();
    return data[collection] || [];
  },

  findById(collection, id) {
    const data = readDb();
    return (data[collection] || []).find((x) => x.id === Number(id)) || null;
  },

  insert(collection, record) {
    const data = readDb();
    if (!Array.isArray(data[collection])) data[collection] = [];
    const id = nextId(data);
    const newRecord = { id, ...record };
    data[collection].push(newRecord);
    writeDb(data);
    return newRecord;
  },

  update(collection, id, patch) {
    const data = readDb();
    if (!Array.isArray(data[collection])) data[collection] = [];
    const idx = (data[collection] || []).findIndex((x) => x.id === Number(id));
    if (idx === -1) return null;
    data[collection][idx] = { ...data[collection][idx], ...patch };
    writeDb(data);
    return data[collection][idx];
  },

  remove(collection, id) {
    const data = readDb();
    if (!Array.isArray(data[collection])) data[collection] = [];
    const idx = (data[collection] || []).findIndex((x) => x.id === Number(id));
    if (idx === -1) return false;
    data[collection].splice(idx, 1);
    writeDb(data);
    return true;
  },

  setCoach(coach) {
    const data = readDb();
    data.coach = coach;
    writeDb(data);
    return coach;
  },

  getCoach() {
    const data = readDb();
    return data.coach;
  },
};

export default db;
