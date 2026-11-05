/**
 * Converts numbers to words in Indian Numbering System (Lakh, Crore)
 * e.g., 1,45,250 => "One Lakh Forty-Five Thousand Two Hundred Fifty Rupees Only"
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanThousand(num: number): string {
  let result = '';
  if (num >= 100) {
    result += ONES[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    result += TENS[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + ONES[num % 10] : '') + ' ';
  } else if (num > 0) {
    result += ONES[num] + ' ';
  }
  return result.trim();
}

export function numberToWordsIndian(amount: number, currencyName: string = 'Rupees'): string {
  if (isNaN(amount) || amount === 0) {
    return `Zero ${currencyName} Only`;
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const integerPart = Math.floor(absAmount);
  const decimalPart = Math.round((absAmount - integerPart) * 100);

  let remaining = integerPart;
  const parts: string[] = [];

  // Crores (10,000,000)
  if (remaining >= 10000000) {
    const crores = Math.floor(remaining / 10000000);
    parts.push(convertLessThanThousand(crores) + ' Crore');
    remaining %= 10000000;
  }

  // Lakhs (100,000)
  if (remaining >= 100000) {
    const lakhs = Math.floor(remaining / 100000);
    parts.push(convertLessThanThousand(lakhs) + ' Lakh');
    remaining %= 100000;
  }

  // Thousands (1,000)
  if (remaining >= 1000) {
    const thousands = Math.floor(remaining / 1000);
    parts.push(convertLessThanThousand(thousands) + ' Thousand');
    remaining %= 1000;
  }

  // Hundreds & below
  if (remaining > 0) {
    parts.push(convertLessThanThousand(remaining));
  }

  let result = (isNegative ? 'Minus ' : '') + parts.join(' ').trim();
  result += ` ${currencyName}`;

  if (decimalPart > 0) {
    const paiseText = convertLessThanThousand(decimalPart);
    result += ` and ${paiseText} Paise`;
  }

  return result + ' Only';
}

/**
 * Formats currency amount in Indian numbering format (e.g., ₹ 1,45,250.00)
 */
export function formatCurrency(amount: number, currencySymbol: string = '₹'): string {
  if (isNaN(amount)) return `${currencySymbol} 0.00`;
  
  const isNegative = amount < 0;
  const fixed = Math.abs(amount).toFixed(2);
  const [intPart, decPart] = fixed.split('.');

  // Indian format: last 3 digits, then pairs of 2 digits
  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '-' : ''}${currencySymbol} ${formattedInt}.${decPart}`;
}
