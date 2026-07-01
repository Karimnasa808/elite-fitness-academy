// utils/brand.js
export const BRAND = {
  name: "Elite Fitness Academy",
  nameArabic: "إيليت فيتنس أكاديمي",
  colors: {
    ink: "#232320",
    charcoal: "#3A3A35",
    red: "#9E2B2B",
    redLight: "#C1453B",
    cream: "#F4EFE3",
    creamCard: "#FFFDF7",
    gold: "#B08D4F",
    gray: "#8A8A82",
    lightGray: "#E5E1D5",
  },
};

export function formatDateArabic(isoDate) {
  if (!isoDate) return "—";
  return isoDate;
}

export default { BRAND, formatDateArabic };
