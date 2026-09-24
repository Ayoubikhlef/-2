/**
 * شغّل ها السكريبت مرة وحدة في Apps Script لتحسين حقول الفورم
 * ثم انسخ(entry IDs) من Logs وأبعتهم لي
 */
function updateOrderFormFields() {
  const form = FormApp.openById('1-jvAl2yrht34Q3CdMXtIpvzz_UkcvXqp9hVDCConQDc');

  const existing = form.getItems().map((i) => i.getTitle());
  const has = (title) => existing.some((t) => t.indexOf(title) !== -1);

  if (!has('البريد الإلكتروني')) {
    form.addTextItem().setTitle('البريد الإلكتروني').setRequired(false);
  }
  if (!has('الولاية')) {
    form.addTextItem().setTitle('الولاية').setRequired(false);
  }
  if (!has('الإجمالي')) {
    form.addTextItem().setTitle('الإجمالي (د.ج)').setRequired(false);
  }
  if (!has('طريقة الدفع')) {
    form.addMultipleChoiceItem()
      .setTitle('طريقة الدفع')
      .setChoiceValues(['عند الاستلام', 'CIB', 'Edahabia', 'BaridiMob'])
      .setRequired(false);
  }
  if (!has('مصدر الطلب')) {
    form.addMultipleChoiceItem()
      .setTitle('مصدر الطلب')
      .setChoiceValues(['الموقع - إتمام الطلب', 'الموقع - اطلب الآن', 'حجز خدمة', 'يدوي'])
      .setRequired(false);
  }

  // إظهار entry IDs لكل الحقول
  Logger.log('=== ENTRY IDs ===');
  form.getItems().forEach((item) => {
    const id = item.getId();
    const title = item.getTitle();
    const type = item.getType();
    let entry = '';
    if (type === FormApp.ItemType.TEXT || type === FormApp.ItemType.PARAGRAPH_TEXT) {
      entry = 'entry.' + id;
    } else if (type === FormApp.ItemType.MULTIPLE_CHOICE) {
      entry = 'entry.' + id;
    }
    Logger.log(title + ' => ' + entry + ' (type: ' + type + ')');
  });

  Logger.log('=== DONE. Share form: ' + form.getPublishedUrl() + ' ===');
}
