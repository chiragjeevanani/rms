import { jsPDF } from 'jspdf';

/**
 * Generates a proper finalized Bill PDF.
 */
export const printBillReceipt = (orderData, tableInfo, billingDetails) => {
  const { kots, waiter, customer, cart } = orderData;
  const allItems = [
    ...(kots || []).flatMap(kot => kot.items),
    ...(cart || [])
  ];
  
  if (allItems.length === 0) return;

  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200] // receipt width x estimated height
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB');
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Header Section - Restaurant Info
  doc.setFont('courier', 'bold');
  doc.setFontSize(14);
  doc.text('TAX INVOICE', 40, 10, { align: 'center' });
  doc.setFontSize(8);
  doc.text('123, Food Street, Gourmet City', 40, 15, { align: 'center' });
  doc.text('Contact: +91 9876543210', 40, 19, { align: 'center' });
  doc.text('GSTIN: 24AAACC1234F1Z5', 40, 23, { align: 'center' });

  // Divider
  doc.setLineWidth(0.1);
  doc.line(5, 27, 75, 27);

  // Bill Meta Info
  doc.setFontSize(9);
  doc.text(`Bill No: ${Math.floor(1000 + Math.random() * 9000)}`, 5, 33);
  doc.text(`Date: ${dateStr}`, 75, 33, { align: 'right' });
  doc.text(`Table: ${tableInfo.name}`, 5, 38);
  doc.text(`Time: ${timeStr}`, 75, 38, { align: 'right' });
  doc.text(`Server: ${waiter?.name || 'N/A'}`, 5, 43);

  if (customer?.name) {
    doc.text(`Guest: ${customer.name}`, 5, 48);
  }

  // Divider
  doc.line(5, 52, 75, 52);

  // Column Headers
  doc.setFontSize(9);
  doc.text('Item Name', 5, 57);
  doc.text('Qty', 45, 57, { align: 'center' });
  doc.text('Price', 60, 57, { align: 'right' });
  doc.text('Total', 75, 57, { align: 'right' });

  // Divider
  doc.line(5, 60, 75, 60);

  // Items List
  let y = 65;
  doc.setFont('courier', 'normal');
  allItems.forEach(item => {
    const splitName = doc.splitTextToSize(item.name, 38);
    doc.text(splitName, 5, y);
    doc.text(`${item.quantity}`, 45, y, { align: 'center' });
    doc.text(`${item.price.toFixed(2)}`, 60, y, { align: 'right' });
    doc.text(`${(item.price * item.quantity).toFixed(2)}`, 75, y, { align: 'right' });
    
    y += (splitName.length * 4.5);
    
    if (y > 180) doc.addPage(); // Basic page overflow handling
  });

  // Divider
  doc.line(5, y + 2, 75, y + 2);
  y += 7;

  // Totals Section
  doc.setFont('courier', 'bold');
  const { subTotal, tax, discount, total } = billingDetails;

  doc.text('Sub Total:', 45, y, { align: 'right' });
  doc.text(`${subTotal.toFixed(2)}`, 75, y, { align: 'right' });
  y += 5;

  if (discount > 0) {
    doc.text('Discount:', 45, y, { align: 'right' });
    doc.text(`-${discount.toFixed(2)}`, 75, y, { align: 'right' });
    y += 5;
  }

  doc.text('GST (5%):', 45, y, { align: 'right' });
  doc.text(`${tax.toFixed(2)}`, 75, y, { align: 'right' });
  y += 7;

  // Grand Total
  doc.setFontSize(12);
  doc.text('NET AMOUNT:', 45, y, { align: 'right' });
  doc.text(`INR ${total.toFixed(2)}`, 75, y, { align: 'right' });
  
  y += 10;
  doc.setFontSize(10);
  doc.text('*** THANK YOU ***', 40, y, { align: 'center' });
  y += 5;
  doc.setFontSize(8);
  doc.text('Visit Again!', 40, y, { align: 'center' });

  // Direct Download
  doc.save(`BILL_${tableInfo.name}_${now.getTime()}.pdf`);
};
