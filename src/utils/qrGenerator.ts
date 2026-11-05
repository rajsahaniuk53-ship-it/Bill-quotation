import QRCode from 'qrcode';

export async function generateUpiQrDataUrl(
  upiId: string,
  payeeName: string,
  amount: number,
  transactionNote: string
): Promise<string> {
  if (!upiId || !upiId.includes('@')) {
    return '';
  }

  // Format standard UPI deep link: upi://pay?pa=upiId&pn=payeeName&am=amount&cu=INR&tn=note
  const encodedName = encodeURIComponent(payeeName.trim() || 'Business');
  const encodedNote = encodeURIComponent((transactionNote || 'Payment').trim().slice(0, 30));
  const validAmount = amount > 0 ? amount.toFixed(2) : '';

  let upiString = `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodedName}&cu=INR`;
  if (validAmount) {
    upiString += `&am=${validAmount}`;
  }
  if (encodedNote) {
    upiString += `&tn=${encodedNote}`;
  }

  try {
    const dataUrl = await QRCode.toDataURL(upiString, {
      width: 256,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate UPI QR code:', err);
    return '';
  }
}
