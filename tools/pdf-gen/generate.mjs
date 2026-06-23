/**
 * Generates printable Arabic PDF guide for Khadma app flow.
 * Usage: cd tools/pdf-gen && npm install && node generate.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');
const outDir = path.join(projectRoot, 'docs');
const outFile = path.join(outDir, 'khadma-app-guide-ar.pdf');
const downloadsCopy = path.join('C:\\Users\\mix\\Downloads', 'khadma-app-guide-ar.pdf');

const fontCandidates = [
  'C:\\Windows\\Fonts\\segoeui.ttf',
  'C:\\Windows\\Fonts\\arial.ttf',
  'C:\\Windows\\Fonts\\tahoma.ttf',
];

function pickFont() {
  for (const f of fontCandidates) {
    if (fs.existsSync(f)) return f;
  }
  throw new Error('No Arabic-capable system font found on Windows.');
}

function drawBox(doc, x, y, w, h, text, opts = {}) {
  const { fill = '#f0f0f0', stroke = '#333333', fontSize = 11, bold = false } = opts;
  doc.save();
  doc.roundedRect(x, y, w, h, 6).fillAndStroke(fill, stroke);
  doc.fillColor('#111111');
  doc.fontSize(fontSize);
  if (bold) doc.font('Bold');
  else doc.font('Regular');
  doc.text(text, x + 8, y + (h - fontSize) / 2 - 2, {
    width: w - 16,
    align: 'center',
    features: ['rtla'],
  });
  doc.restore();
  return { x, y, w, h, cx: x + w / 2, bottom: y + h };
}

function drawDiamond(doc, cx, y, w, h, text) {
  const halfW = w / 2;
  const halfH = h / 2;
  doc.save();
  doc.moveTo(cx, y).lineTo(cx + halfW, y + halfH).lineTo(cx, y + h).lineTo(cx - halfW, y + halfH).closePath();
  doc.fillAndStroke('#fff8e6', '#c8a574');
  doc.fillColor('#111111').fontSize(10).font('Regular');
  doc.text(text, cx - halfW + 6, y + halfH - 6, {
    width: w - 12,
    align: 'center',
    features: ['rtla'],
  });
  doc.restore();
  return { cx, top: y, bottom: y + h };
}

function arrowDown(doc, x, y1, y2) {
  doc.save();
  doc.strokeColor('#555555').lineWidth(1.2);
  doc.moveTo(x, y1).lineTo(x, y2 - 8).stroke();
  doc.moveTo(x, y2 - 8).lineTo(x - 4, y2 - 14).lineTo(x + 4, y2 - 14).closePath().fill('#555555');
  doc.restore();
}

function arrowBranch(doc, cx, y, leftX, rightX, yEnd) {
  doc.save();
  doc.strokeColor('#555555').lineWidth(1.2);
  doc.moveTo(cx, y).lineTo(cx, y + 14).stroke();
  doc.moveTo(cx, y + 14).lineTo(leftX, y + 28).lineTo(leftX, yEnd - 8).stroke();
  doc.moveTo(cx, y + 14).lineTo(rightX, y + 28).lineTo(rightX, yEnd - 8).stroke();
  for (const x of [leftX, rightX]) {
    doc.moveTo(x, yEnd - 8).lineTo(x - 4, yEnd - 14).lineTo(x + 4, yEnd - 14).closePath().fill('#555555');
  }
  doc.restore();
}

function pageHeader(doc, title, pageNum) {
  doc.font('Bold').fontSize(18).fillColor('#c8a574').text(title, { align: 'center', features: ['rtla'] });
  doc.moveDown(0.3);
  doc.font('Regular').fontSize(10).fillColor('#666666').text(`صفحة ${pageNum}`, { align: 'center' });
  doc.moveDown(0.8);
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function main() {
  const fontPath = pickFont();
  ensureDir(outDir);

  const doc = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: false });
  const stream = fs.createWriteStream(outFile);
  doc.pipe(stream);

  doc.registerFont('Regular', fontPath);
  doc.registerFont('Bold', fontPath);

  doc.addPage();
  pageHeader(doc, 'كيف يعمل تطبيق خدما', 1);

  doc.font('Bold').fontSize(14).fillColor('#222222').text('1) التسجيل والدخول', { align: 'right', features: ['rtla'] });
  doc.moveDown(0.5);

  const cx = 297.5;
  let y = doc.y;
  const bw = 220;
  const bx = cx - bw / 2;
  const bh = 34;
  const gap = 18;

  const steps1 = [
    'اختيار اللغة',
    'التعريف بالتطبيق',
    'اختيار الدور: عميل أو مزود',
    'تسجيل بالبريد + رمز OTP',
    'إنشاء الحساب على السيرفر',
  ];

  let prevBottom = y;
  for (const text of steps1) {
    const box = drawBox(doc, bx, prevBottom, bw, bh, text);
    if (prevBottom > y) arrowDown(doc, cx, prevBottom - gap, box.y);
    prevBottom = box.bottom + gap;
  }

  const diamondY = prevBottom;
  drawDiamond(doc, cx, diamondY, 120, 44, 'الدور');
  arrowDown(doc, cx, prevBottom - gap + 4, diamondY);

  const branchY = diamondY + 44;
  const leftBx = 80;
  const rightBx = 315;
  const roleBoxY = branchY + 36;
  drawBox(doc, leftBx, roleBoxY, 180, bh, 'الرئيسية + خدماتي + طلباتي + حسابي', { fill: '#e8f4e8' });
  drawBox(doc, rightBx, roleBoxY, 180, bh, 'طلبات قريبة + عروض', { fill: '#e8f0f8' });
  doc.font('Regular').fontSize(9).fillColor('#444444');
  doc.text('عميل', leftBx + 60, roleBoxY - 14, { width: 60, align: 'center', features: ['rtla'] });
  doc.text('مزود', rightBx + 60, roleBoxY - 14, { width: 60, align: 'center', features: ['rtla'] });
  arrowBranch(doc, cx, branchY, leftBx + 90, rightBx + 90, roleBoxY);

  doc.y = roleBoxY + bh + 28;
  doc.font('Bold').fontSize(14).fillColor('#222222').text('2) واجهة العميل — التبويبات', { align: 'right', features: ['rtla'] });
  doc.moveDown(0.4);

  const tabs = [
    'تبويب الرئيسية → 8 أقسام + احجز الآن / عرض الكل',
    'تبويب خدماتي → كل الأقسام وبدء طلب جديد',
    'تبويب طلباتي → متابعة الطلبات والعروض',
    'تبويب حسابي → اللغة، الإشعارات، التواصل، الشروط',
  ];
  doc.font('Regular').fontSize(11).fillColor('#333333');
  for (const line of tabs) {
    doc.text(`• ${line}`, { align: 'right', features: ['rtla'] });
    doc.moveDown(0.25);
  }

  doc.moveDown(0.6);
  doc.font('Regular').fontSize(9).fillColor('#888888').text(
    'خدما — منصة خدمات منزلية | التطبيق ↔ سيرفر Render ↔ قاعدة بيانات Neon',
    { align: 'center', features: ['rtla'] },
  );

  doc.addPage();
  pageHeader(doc, 'كيف يعمل تطبيق خدما — مسار الطلب', 2);

  doc.font('Bold').fontSize(14).fillColor('#222222').text('3) مسار الطلب — من العميل للمزود', { align: 'right', features: ['rtla'] });
  doc.moveDown(0.5);

  y = doc.y;
  prevBottom = y;
  const steps2 = [
    'العميل يختار خدمة',
    'معالج الطلب: وصف + موقع + تأكيد',
    'إرسال الطلب للسيرفر',
    'السيرفر يبحث عن مزودين معتمدين بنفس المهارة',
    'إشعار لكل مزود مناسب',
    'المزود يرى الطلب ويرسل عرض سعر',
    'العميل يقبل العرض المناسب',
    'تنفيذ الخدمة في الموقع',
  ];

  for (const text of steps2) {
    const box = drawBox(doc, bx, prevBottom, bw, bh, text, { fill: '#fafafa' });
    if (prevBottom > y) arrowDown(doc, cx, prevBottom - gap, box.y);
    prevBottom = box.bottom + gap;
  }

  doc.y = prevBottom + 10;
  doc.font('Bold').fontSize(14).fillColor('#222222').text('4) واجهة المزود + الإشعارات', { align: 'right', features: ['rtla'] });
  doc.moveDown(0.4);

  const prov = [
    'قائمة الطلبات القريبة (فلترة حسب المهارة والموقع)',
    'فتح تفاصيل الطلب وإرسال عرض: السعر + الوقت',
    'بعد قبول العميل → التوجه لموقع العميل',
    'الإشعارات: طلب جديد | عرض مقبول | تحديث على الطلب',
    'الضغط على الإشعار يفتح الطلب مباشرة',
  ];
  doc.font('Regular').fontSize(11).fillColor('#333333');
  for (const line of prov) {
    doc.text(`• ${line}`, { align: 'right', features: ['rtla'] });
    doc.moveDown(0.25);
  }

  doc.moveDown(0.5);
  doc.font('Bold').fontSize(14).fillColor('#222222').text('5) البنية التقنية', { align: 'right', features: ['rtla'] });
  doc.moveDown(0.4);

  const techY = doc.y + 10;
  drawBox(doc, 55, techY, 140, 40, 'تطبيق Flutter\nعلى الهاتف', { fontSize: 10 });
  drawBox(doc, 230, techY, 140, 40, 'سيرفر Render\n(API)', { fontSize: 10 });
  drawBox(doc, 405, techY, 90, 40, 'Neon\nقاعدة بيانات', { fontSize: 9 });
  doc.save();
  doc.strokeColor('#c8a574').lineWidth(1.5);
  doc.moveTo(195, techY + 20).lineTo(230, techY + 20).stroke();
  doc.moveTo(370, techY + 20).lineTo(405, techY + 20).stroke();
  doc.restore();

  doc.y = techY + 60;
  doc.font('Regular').fontSize(10).fillColor('#555555').text(
    'ملاحظة: عند إرسال أي طلب، يُرسل إشعار تلقائياً لكل مزود خدمة معتمد لديه نفس تخصص الطلب.',
    { align: 'right', features: ['rtla'] },
  );

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  try {
    fs.copyFileSync(outFile, downloadsCopy);
    console.log(`Copied to: ${downloadsCopy}`);
  } catch (_) {
    /* optional */
  }

  console.log(`PDF created: ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
