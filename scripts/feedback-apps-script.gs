/**
 * Travel Bestie feedback -> Google Sheet + email notification.
 *
 * Setup (once):
 * 1. Create a Google Sheet, e.g. "Travel Bestie feedback".
 * 2. In the sheet: Extensions > Apps Script. Delete what's there and paste this whole file. Save.
 * 3. Deploy > New deployment > type "Web app".
 *      Execute as: Me      Who has access: Anyone
 *    Click Deploy, allow the permissions, and copy the Web app URL (ends with /exec).
 * 4. Send that URL to Claude (it goes in src/plan/live.html as TB_FEEDBACK_URL).
 *
 * New feedback is added as a row in the "Feedback" tab and emailed to the sheet owner.
 * To pause emails, set NOTIFY to false.
 */
var NOTIFY = true;
var HEADERS = ['Received', 'Type', 'Rating', 'Message', 'Name', 'Email', 'Page', 'Language', 'Device'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.hp) return ok_();                                  // spam trap filled in: ignore
    var msg = clean_(d.message, 3000);
    if (!msg) return ok_();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Feedback') || ss.insertSheet('Feedback');
    if (sh.getLastRow() === 0) { sh.appendRow(HEADERS); sh.setFrozenRows(1); sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold'); }
    var email = clean_(d.email, 120);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) email = '';
    var row = [new Date(), clean_(d.type, 40), Number(d.rating) || '', msg, clean_(d.name, 80), email, clean_(d.page, 120), clean_(d.lang, 10), clean_(d.device, 200)];
    sh.appendRow(row);
    if (NOTIFY) {
      var me = Session.getEffectiveUser().getEmail();
      var stars = row[2] ? ' ' + new Array(row[2] + 1).join('★') : '';
      var body = 'New feedback on travelbestie.site\n\n' +
        'Type: ' + row[1] + stars + '\n' +
        (row[4] ? 'From: ' + row[4] + '\n' : '') + (email ? 'Email: ' + email + '\n' : '') +
        'Page: ' + row[6] + '\n\n' + msg + '\n\n' +
        'All feedback: ' + ss.getUrl();
      var opt = { to: me, subject: 'Travel Bestie feedback: ' + row[1] + stars, body: body, name: 'Travel Bestie' };
      if (email) opt.replyTo = email;
      MailApp.sendEmail(opt);
    }
    return ok_();
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return ok_(); }
function clean_(v, n) { return String(v == null ? '' : v).replace(/^[=+\-@]/, "'$&").slice(0, n).trim(); }
function ok_() { return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON); }
