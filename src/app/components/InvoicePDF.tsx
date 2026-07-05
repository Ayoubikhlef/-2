import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { OrderRecord } from '../utils/orderStorage';

export async function generateInvoice(order: OrderRecord, language: string) {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = 210;

    // === Header bar ===
    doc.setFillColor('#1e40af');
    doc.rect(0, 0, pw, 55, 'F');

    // Orange line
    doc.setDrawColor('#ff8c00');
    doc.setLineWidth(1.5);
    doc.line(0, 57, pw, 57);

    // === Company name ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor('#ffffff');
    doc.text('Ayoub Office Services', 14, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('El Milia, Jijel, Algeria', 14, 21);
    doc.text('Tel: 0674 11 32 90', 14, 28);

    // === Invoice title ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor('#ffffff');
    const title = language === 'ar' ? 'فاتورة' : 'INVOICE';
    doc.text(title, pw - 14, 44, { align: 'right' });

    // === Divider ===
    doc.setDrawColor('#e2e8f0');
    doc.setLineWidth(0.3);
    doc.line(14, 62, pw - 14, 62);

    // === Order info ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor('#1e40af');
    doc.text(language === 'ar' ? 'معلومات الطلب' : 'ORDER INFO', 14, 74);

    const oid = order.id.slice(0, 8).toUpperCase();
    const dt = new Date(order.createdAt).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor('#334155');
    doc.text(`${language === 'ar' ? 'الفاتورة:' : 'Invoice:'} #${oid}`, 14, 84);
    doc.text(`${language === 'ar' ? 'التاريخ:' : 'Date:'} ${dt}`, 14, 92);
    doc.text(`${language === 'ar' ? 'العميل:' : 'Customer:'} ${order.customer}`, pw / 2, 84);
    doc.text(`${language === 'ar' ? 'الهاتف:' : 'Phone:'} ${order.phone}`, pw / 2, 92);

    // === Table header ===
    const cols = [12, 66, 20, 36, 36];
    const startX = 14;
    const rowH = 8;
    let yPos = 106;

    doc.setFillColor('#1e40af');
    doc.setDrawColor('#1e40af');
    doc.rect(startX, yPos, pw - 28, rowH, 'F');
    doc.setTextColor('#ffffff');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    const headers = language === 'ar'
      ? ['#', 'المنتج', 'الكمية', 'السعر', 'المجموع']
      : ['#', 'Product', 'Qty', 'Price', 'Total'];

    let cx = startX;
    headers.forEach((h, i) => {
      doc.text(h, cx + 2, yPos + 6);
      cx += cols[i];
    });

    // === Table rows ===
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    yPos += rowH;

    order.items.forEach((item, idx) => {
      const isOdd = idx % 2 === 1;
      if (isOdd) {
        doc.setFillColor('#f8fafc');
        doc.rect(startX, yPos, pw - 28, rowH, 'F');
      }

      doc.setTextColor('#334155');
      cx = startX;
      const rowData = [
        String(idx + 1),
        item.name,
        String(item.quantity),
        `${item.price.toLocaleString()} DZD`,
        `${item.total.toLocaleString()} DZD`,
      ];

      // Draw cell borders
      doc.setDrawColor('#e2e8f0');
      doc.setLineWidth(0.2);

      rowData.forEach((val, i) => {
        doc.text(val, cx + 2, yPos + 5.5);
        if (i < 4) doc.line(cx + cols[i], yPos, cx + cols[i], yPos + rowH);
        cx += cols[i];
      });
      doc.line(cx, yPos, startX, yPos);

      yPos += rowH;
    });

    // Last row bottom border
    doc.line(startX, yPos, pw - 14, yPos);
    doc.line(pw - 14, 106, pw - 14, yPos);

    // === Total ===
    yPos += 10;
    doc.setFillColor('#eef2ff');
    doc.setDrawColor('#ff8c00');
    doc.setLineWidth(0.8);
    doc.rect(startX, yPos, pw - 28, 10, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor('#ff8c00');
    const totalLabel = language === 'ar' ? 'الإجمالي' : 'TOTAL';
    const totalVal = `${order.total.toLocaleString()} DZD`;
    doc.text(totalLabel, startX + 4, yPos + 7);
    doc.text(totalVal, pw - startX - 4, yPos + 7, { align: 'right' });

    // === Bottom bar ===
    doc.setFillColor('#1e40af');
    doc.rect(0, 282, pw, 15, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor('#bfdbfe');
    doc.text(language === 'ar' ? 'شكراً لتعاملكم معنا' : 'Thank you for your business', pw / 2, 292, { align: 'center' });

    doc.save(`invoice-${oid}.pdf`);
  } catch (err: any) {
    console.error('PDF generation error:', err?.message || err);
    throw err;
  }
}
