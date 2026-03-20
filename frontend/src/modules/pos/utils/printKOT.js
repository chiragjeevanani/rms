import { jsPDF } from 'jspdf';

/**
 * Directly downloads the KOT as a PDF file using jsPDF.
 */
export const printKOTReceipt = (orderData, tableInfo) => {
  // Extract items from either a direct cart or the latest KOT in the history
  const items = orderData.items || (orderData.kots?.[orderData.kots.length - 1]?.items) || [];
  const kotNumber = orderData.id || (orderData.kots?.[orderData.kots.length - 1]?.id) || Math.floor(Math.random() * 10) + 1;

  if (items.length === 0) return;

  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 150] // receipt width x height
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const tableNo = tableInfo.name;

  // Header Section
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.text(dateStr, 40, 10, { align: 'center' });
  doc.text(`KOT - ${kotNumber}`, 40, 15, { align: 'center' });
  doc.text('Dine In', 40, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(`Table No: ${tableNo}`, 40, 30, { align: 'center' });

  // Divider
  doc.setLineWidth(0.1);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, 35, 75, 35);

  // Column Headers
  doc.setFontSize(10);
  doc.text('Item', 5, 42);
  doc.text('Qty.', 75, 42, { align: 'right' });

  // Items List
  let y = 50;
  doc.setFont('courier', 'bold');
  items.forEach(item => {
    // Check if long name needs wrapping
    const splitName = doc.splitTextToSize(item.name, 60);
    doc.text(splitName, 5, y);
    doc.text(`${item.quantity}`, 75, y, { align: 'right' });
    
    y += (splitName.length * 5);
    
    if (item.notes) {
      doc.setFont('courier', 'italic');
      doc.setFontSize(8);
      doc.text(`[Note] ${item.notes}`, 8, y);
      y += 5;
      doc.setFontSize(10);
      doc.setFont('courier', 'bold');
    }
  });

  // Divider
  doc.line(5, y + 5, 75, y + 5);
  y += 15;

  // Footer / Barcode Placeholder
  doc.setFontSize(10);
  doc.text('Scan to Mark food readey:', 40, y, { align: 'center' });
  
  // Fake Barcode (Drawing lines)
  y += 5;
  const barcodeX = 25;
  for (let i = 0; i < 30; i++) {
    const lineWidth = Math.random() > 0.5 ? 0.3 : 0.8;
    const gap = Math.random() * 0.5 + 0.5;
    doc.setLineWidth(lineWidth);
    doc.setLineDashPattern([], 0);
    doc.line(barcodeX + (i * 1), y, barcodeX + (i * 1), y + 10);
  }
  
  y += 15;
  doc.text('025', 40, y, { align: 'center', charSpace: 5 });

  // Direct Download
  doc.save(`KOT_${tableNo}_${now.getTime()}.pdf`);
};
