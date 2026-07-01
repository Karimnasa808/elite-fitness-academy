// utils/age.js
// حساب السن تلقائيًا من تاريخ الميلاد، بحيث يتحدث من نفسه كل سنة
// بدون الحاجة لتعديل يدوي.

export function calculateAge(birthDateIso) {
  if (!birthDateIso) return null;
  const birthDate = new Date(birthDateIso);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export default { calculateAge };
