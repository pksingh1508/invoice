// Invoice calculation utilities

export interface InvoiceCalculationResult {
  subtotal: number;
  vatAmount: number;
  discountAmount: number;
  totalAmount: number;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

/**
 * Calculate invoice totals based on unit price, quantity, VAT rate, and discount
 */
export function calculateInvoiceTotals(
  unitPrice: number,
  quantity: number,
  vatRate: number,
  discountRate: number = 0
): InvoiceCalculationResult {
  // Calculate subtotal
  const subtotal = unitPrice * quantity;
  
  // Calculate discount amount
  const discountAmount = subtotal * (discountRate / 100);
  
  // Calculate subtotal after discount
  const subtotalAfterDiscount = subtotal - discountAmount;
  
  // Calculate VAT amount (applied after discount)
  const vatAmount = subtotalAfterDiscount * (vatRate / 100);
  
  // Calculate total amount
  const totalAmount = subtotalAfterDiscount + vatAmount;
  
  return {
    subtotal,
    vatAmount,
    discountAmount,
    totalAmount
  };
}

/**
 * Calculate line item amount
 */
export function calculateLineItemAmount(quantity: number, rate: number): number {
  return quantity * rate;
}

/**
 * Calculate subtotal from multiple line items
 */
export function calculateSubtotal(lineItems: InvoiceLineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Calculate VAT amount from subtotal
 */
export function calculateVATAmount(subtotal: number, vatRate: number): number {
  return subtotal * (vatRate / 100);
}

/**
 * Calculate discount amount from subtotal
 */
export function calculateDiscountAmount(subtotal: number, discountRate: number): number {
  return subtotal * (discountRate / 100);
}

/**
 * Format currency value to 2 decimal places
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format number to 2 decimal places
 */
export function formatNumber(value: number): string {
  return value.toFixed(2);
}

/**
 * Parse string to number, returning 0 if invalid
 */
export function parseNumber(value: string): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumericInput(value: string): string {
  // Remove any non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  return cleaned;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Round to specified decimal places
 */
export function roundToDecimals(value: number, decimals: number = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Convert number to words (for invoice amounts)
 */
export function numberToWords(num: number): string {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const thousands = ['', 'thousand', 'million', 'billion'];

  if (num === 0) return 'zero';

  function convertHundreds(n: number): string {
    let result = '';
    
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' hundred ';
      n %= 100;
    }
    
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      return result;
    }
    
    if (n > 0) {
      result += ones[n] + ' ';
    }
    
    return result;
  }

  let result = '';
  let thousandCounter = 0;
  
  while (num > 0) {
    if (num % 1000 !== 0) {
      result = convertHundreds(num % 1000) + thousands[thousandCounter] + ' ' + result;
    }
    num = Math.floor(num / 1000);
    thousandCounter++;
  }
  
  return result.trim();
}

/**
 * Generate invoice number with current year and sequence
 */
export function generateInvoiceNumber(sequence: number, year?: number): string {
  const currentYear = year || new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(4, '0');
  return `INV-${currentYear}-${paddedSequence}`;
}

/**
 * Calculate days between two dates
 */
export function daysBetweenDates(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * Check if invoice is overdue
 */
export function isInvoiceOverdue(dueDate: string): boolean {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

/**
 * Calculate days until due or overdue
 */
export function getDaysUntilDue(dueDate: string): { days: number; isOverdue: boolean } {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const timeDiff = due.getTime() - today.getTime();
  const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return {
    days: Math.abs(days),
    isOverdue: days < 0
  };
}