نسخة احتياطية شاملة لتطبيق خدمة (Khadma)

المحتوى:
1. شيفرة المصدر الكاملة (مجلد khadma-full-app)
2. نسخة بيانات قاعدة البيانات: database-backup/khadma_db_backup_2026-06-18.sql

لاستعادة البيانات لاحقاً في قاعدة PostgreSQL جديدة:
  psql "DATABASE_URL" < database-backup/khadma_db_backup_2026-06-18.sql

ملاحظة: المفاتيح السرية (روابط القاعدة، مفاتيح Clerk، التخزين) غير مضمّنة لأسباب أمنية.
