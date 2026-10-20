/**
 * مصحف ابن رشد — استقبال تلاوات الطلاب في Google Drive الخاص بالقسم
 * إعداد: أ. طلال سعود المهلهل
 *
 * التركيب (مرة وحدة):
 * 1) script.google.com ← مشروع جديد ← الصق هذا الملف كاملًا بدل الموجود ← حفظ.
 * 2) اختر الدالة setup من القائمة فوق واضغط «تشغيل» ← وافق على الأذونات.
 *    (ينشئ مجلد «تلاوات مصحف ابن رشد» وملف «سجل تلاوات مصحف ابن رشد» في Drive)
 * 3) نشر ← نشر جديد ← النوع: تطبيق ويب ← التنفيذ: «أنا» ← الوصول: «أي شخص» ← نشر.
 * 4) انسخ رابط تطبيق الويب (ينتهي بـ /exec) وأرسله لمسؤول الموقع.
 *
 * الكشوف: في ملف السجل ورقة «الكشوف» (الصف | الشعبة | الاسم). الصق فيها أسماء الطلاب،
 * والسكربت يطابق الاسم اللي كتبه الطالب ويكتب الاسم الرسمي جنبه، وإذا ما لقاه يكتب «⚠️ راجع».
 */
var ROOT = 'تلاوات مصحف ابن رشد';
var BOOK = 'سجل تلاوات مصحف ابن رشد';
var ROSTER = 'الكشوف';
var HEAD = ['الوقت', 'الشعبة', 'الاسم كما كتبه الطالب', 'الاسم من الكشف', 'الدرس', 'الآيات', 'المدة التقريبية', 'التسجيل', 'ملاحظة المعلم / الدرجة'];
var GRADES = ['السادس الابتدائي', 'الأول الإعدادي', 'الثاني الإعدادي', 'الثالث الإعدادي'];
var MAX_BYTES = 20 * 1024 * 1024;

function setup() {
  var root = rootFolder_();
  var ss = book_();
  Logger.log('المجلد: ' + root.getUrl());
  Logger.log('السجل: ' + ss.getUrl());
}

function doGet() {
  return out_({ ok: true, msg: 'خدمة تلاوات مصحف ابن رشد تعمل' });
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var grade = clip_(d.gradeName, 40), sec = clip_(d.section, 4), name = clip_(d.name, 60).replace(/\s+/g, ' ');
    var lesson = clip_(d.lesson, 80), ayat = clip_(d.ayat, 12);
    if (!grade || !/^\d{1,2}$/.test(sec) || name.split(' ').length < 2 || !lesson || !d.data) return out_({ ok: false, error: 'missing' });
    var bytes = Utilities.base64Decode(d.data);
    if (bytes.length < 2000 || bytes.length > MAX_BYTES) return out_({ ok: false, error: 'size' });
    var mime = /^audio\/[\w.+-]+$/.test(d.mime || '') ? d.mime : 'audio/webm';
    var ext = /mp4|m4a|aac/.test(mime) ? 'm4a' : /ogg/.test(mime) ? 'ogg' : 'webm';
    var tz = Session.getScriptTimeZone(), now = new Date();
    var stamp = Utilities.formatDate(now, tz, 'dd-MM-yyyy HH-mm');

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var folder = sub_(sub_(sub_(rootFolder_(), grade), 'الشعبة ' + sec), lesson);
      var file = folder.createFile(Utilities.newBlob(bytes, mime, name + ' - ' + stamp + '.' + ext));
      var ss = book_();
      var sh = ss.getSheetByName(grade) || newTab_(ss, grade);
      var official = match_(ss, grade, sec, name);
      var mins = Math.round(bytes.length / (64000 / 8) / 6) / 10; // تقدير من معدّل التسجيل 64kbps
      sh.appendRow([now, Number(sec), name, official, lesson, ayat, mins + ' د', file.getUrl(), '']);
    } finally {
      lock.releaseLock();
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err).slice(0, 200) });
  }
}

/* ---------- مساعدات ---------- */
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function clip_(v, n) {
  return String(v == null ? '' : v).replace(/[\\\/:*?"<>|\u0000-\u001f]/g, ' ').trim().slice(0, n);
}
function sub_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}
function rootFolder_() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty('root');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var f = sub_(DriveApp.getRootFolder(), ROOT);
  p.setProperty('root', f.getId());
  return f;
}
function book_() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty('book');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  var ss = SpreadsheetApp.create(BOOK);
  DriveApp.getFileById(ss.getId()).moveTo(rootFolder_());
  var r = ss.getSheets()[0];
  r.setName(ROSTER);
  r.getRange(1, 1, 1, 3).setValues([['الصف', 'الشعبة', 'الاسم']]).setFontWeight('bold').setBackground('#0a6e4b').setFontColor('#ffffff');
  r.setFrozenRows(1);
  r.setRightToLeft(true);
  GRADES.forEach(function (g) { newTab_(ss, g); });
  p.setProperty('book', ss.getId());
  return ss;
}
function newTab_(ss, name) {
  var sh = ss.insertSheet(name);
  sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold').setBackground('#0a6e4b').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  sh.setRightToLeft(true);
  sh.setColumnWidth(3, 200); sh.setColumnWidth(4, 200); sh.setColumnWidth(5, 160); sh.setColumnWidth(8, 260); sh.setColumnWidth(9, 220);
  return sh;
}
/* توحيد الكتابة العربية للمقارنة: بلا تشكيل، والألفات والتاء المربوطة والياء موحّدة */
function norm_(s) {
  return String(s || '').replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/(^|\s)عبد\s+/g, '$1عبد').replace(/\s+/g, ' ').trim();
}
function match_(ss, grade, sec, name) {
  var r = ss.getSheetByName(ROSTER);
  if (!r || r.getLastRow() < 2) return '';
  var rows = r.getRange(2, 1, r.getLastRow() - 1, 3).getValues();
  var want = norm_(name).split(' '), hits = [];
  rows.forEach(function (x) {
    if (norm_(x[0]) !== norm_(grade) || String(x[1]).trim() !== String(sec)) return;
    var have = norm_(x[2]).split(' ');
    // كل كلمة كتبها الطالب موجودة بالترتيب في اسمه الرسمي (يسمح باختصار الاسم)
    var k = 0;
    for (var i = 0; i < have.length && k < want.length; i++) if (have[i] === want[k]) k++;
    if (k === want.length && have[0] === want[0]) hits.push(String(x[2]).trim());
  });
  return hits.length === 1 ? hits[0] : hits.length > 1 ? '⚠️ أكثر من طالب: ' + hits.join(' / ') : '⚠️ راجع';
}
