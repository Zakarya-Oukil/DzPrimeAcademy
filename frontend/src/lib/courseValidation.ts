// Shared by POST /api/courses and PUT /api/courses/[id]. Returns an Arabic error message, or null when valid.
export function badCourseFields(b: Record<string, any>): string | null {
  if (b.titleAr !== undefined && (typeof b.titleAr !== 'string' || b.titleAr.trim().length < 3 || b.titleAr.length > 160)) {
    return 'عنوان المقرر بين 3 و160 حرفاً';
  }
  if (b.lessonsCount !== undefined && !(Number.isInteger(b.lessonsCount) && b.lessonsCount >= 0 && b.lessonsCount <= 1000)) {
    return 'عدد الدروس عدد صحيح بين 0 و1000';
  }
  if (b.category !== undefined && !['BAC', 'UNIVERSITY_LMD', 'MEDICAL'].includes(b.category)) return 'التصنيف غير صالح';
  if (b.description !== undefined && b.description !== null && (typeof b.description !== 'string' || b.description.length > 4000)) {
    return 'الوصف طويل جداً';
  }
  return null;
}
