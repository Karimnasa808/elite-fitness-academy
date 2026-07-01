// seed.js
// سكريبت بسيط لإنشاء حساب المدرب الأول (يشتغل مرة واحدة فقط).
// تشغيله: npm run seed -- --username=coach --password=yourpassword --name="اسم المدرب"

import bcrypt from "bcryptjs";
import db from "./db.js";
import { DEFAULT_EXERCISE_TYPES } from "./utils/defaultExerciseTypes.js";

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function seedExerciseTypes() {
  const existing = db.all("exerciseTypes");
  if (existing.length > 0) return;
  DEFAULT_EXERCISE_TYPES.forEach((t) => {
    db.insert("exerciseTypes", { ...t, createdAt: new Date().toISOString() });
  });
  console.log("✅ تم إضافة أنواع القياسات الافتراضية (تقدر تعدّلها من صفحة «أنواع القياسات»).");
}

async function main() {
  seedExerciseTypes();

  const existing = db.getCoach();
  if (existing) {
    console.log("⚠️  يوجد حساب مدرب بالفعل (username: " + existing.username + ").");
    console.log("لو عايز تغيّر بيانات الدخول، احذف ملف server/src/data/db.json وابدأ من جديد،");
    console.log("أو استخدم صفحة تغيير كلمة المرور بعد تسجيل الدخول.");
    return;
  }

  const username = getArg("username", "coach");
  const password = getArg("password", "elite2009");
  const name = getArg("name", "المدرب");

  const passwordHash = await bcrypt.hash(password, 10);

  db.setCoach({
    id: 1,
    username,
    passwordHash,
    name,
  });

  console.log("✅ تم إنشاء حساب المدرب بنجاح:");
  console.log("   اسم المستخدم: " + username);
  console.log("   كلمة المرور: " + password);
  console.log("⚠️  احتفظ بكلمة المرور دي في مكان أمن، أو غيّرها بعد أول تسجيل دخول.");
}

main();
