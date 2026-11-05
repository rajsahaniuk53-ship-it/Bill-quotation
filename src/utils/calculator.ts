import { DocumentData, LineItem } from '../types/document';

export interface TaxBreakdown {
  rate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
}

export interface CalculationResult {
  items: (LineItem & { calculatedTax: number; finalLineTotal: number })[];
  rawSubtotal: number;
  totalWorkCharges: number; // Sum of (+) charges / bill items
  totalAdvanceDeductions: number; // Sum of (-) advance/deductions items + advanceReceived
  itemDiscountsTotal: number;
  taxableAmount: number;
  totalDiscount: number;
  totalTax: number;
  taxBreakdowns: TaxBreakdown[];
  shippingCharges: number;
  packagingCharges: number;
  roundOffAmount: number;
  grandTotal: number;
  advanceReceived: number;
  netRemainingDue: number;
}

export function calculateDocument(doc: DocumentData): CalculationResult {
  let rawSubtotal = 0;
  let totalWorkCharges = 0;
  let itemAdvancesTotal = 0;
  let itemDiscountsTotal = 0;
  let totalTax = 0;

  // Track breakdown by tax rate
  const taxMap = new Map<number, { taxable: number; tax: number }>();

  const processedItems = doc.items.map(item => {
    const isAdvance = item.itemType === 'advance'; // (-) minus / deduction / advance item
    const qty = Number(item.quantity) || 1;
    const rate = Number(item.rate) || 0;
    
    const isCashLedgerMode = doc.tableMode === 'cash_ledger' || doc.tableMode === 'direct_amount';
    // In cash_ledger mode, amount is taken directly; in measurement_sqft mode, qty * rate
    let gross = (isCashLedgerMode && item.amount !== undefined) 
      ? Math.abs(Number(item.amount)) 
      : (qty * rate);

    if (gross === 0 && Number(item.amount) > 0) {
      gross = Math.abs(Number(item.amount));
    }

    const discountPct = isAdvance ? 0 : (Number(item.discountPercent) || 0);
    const itemDiscount = (gross * discountPct) / 100;
    const netItemAmount = gross - itemDiscount;

    if (isAdvance) {
      itemAdvancesTotal += netItemAmount;
    } else {
      totalWorkCharges += netItemAmount;
      rawSubtotal += netItemAmount;
      itemDiscountsTotal += itemDiscount;
    }

    // Calculate item tax (only for work charges, not for advance payments)
    const taxRate = (isAdvance || doc.taxType === 'none') ? 0 : (Number(item.taxRate) || 0);
    const itemTax = (netItemAmount * taxRate) / 100;

    if (!isAdvance) {
      totalTax += itemTax;
      if (taxRate > 0) {
        const existing = taxMap.get(taxRate) || { taxable: 0, tax: 0 };
        existing.taxable += netItemAmount;
        existing.tax += itemTax;
        taxMap.set(taxRate, existing);
      }
    }

    return {
      ...item,
      amount: Number(netItemAmount.toFixed(2)),
      calculatedTax: Number(itemTax.toFixed(2)),
      finalLineTotal: Number((netItemAmount + itemTax).toFixed(2)),
    };
  });

  const netBeforeGlobalDiscount = rawSubtotal - itemDiscountsTotal;

  // Global document discount
  let globalDiscount = 0;
  if (doc.discountTotalValue > 0) {
    if (doc.discountTotalType === 'percentage') {
      globalDiscount = (netBeforeGlobalDiscount * doc.discountTotalValue) / 100;
    } else {
      globalDiscount = Number(doc.discountTotalValue) || 0;
    }
  }

  const totalDiscount = itemDiscountsTotal + globalDiscount;
  const taxableAmount = Math.max(0, rawSubtotal - totalDiscount);

  // Recalculate tax breakdown if global discount applies
  const taxBreakdowns: TaxBreakdown[] = [];
  taxMap.forEach((val, rate) => {
    // Pro-rate if global discount
    const ratio = netBeforeGlobalDiscount > 0 ? (netBeforeGlobalDiscount - globalDiscount) / netBeforeGlobalDiscount : 1;
    const adjustedTaxable = Math.max(0, val.taxable * ratio);
    const adjustedTax = (adjustedTaxable * rate) / 100;

    if (doc.isInterstate) {
      taxBreakdowns.push({
        rate,
        taxableAmount: Number(adjustedTaxable.toFixed(2)),
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: Number(adjustedTax.toFixed(2)),
        totalTax: Number(adjustedTax.toFixed(2)),
      });
    } else {
      const half = adjustedTax / 2;
      taxBreakdowns.push({
        rate,
        taxableAmount: Number(adjustedTaxable.toFixed(2)),
        cgstAmount: Number(half.toFixed(2)),
        sgstAmount: Number(half.toFixed(2)),
        igstAmount: 0,
        totalTax: Number(adjustedTax.toFixed(2)),
      });
    }
  });

  const totalTaxCalculated = taxBreakdowns.reduce((sum, b) => sum + b.totalTax, 0);

  const shipping = Number(doc.shippingCharges) || 0;
  const packaging = Number(doc.packagingCharges) || 0;

  const preTotal = taxableAmount + totalTaxCalculated + shipping + packaging;

  let grandTotal = preTotal;
  let roundOffAmount = 0;

  if (doc.roundOff) {
    const rounded = Math.round(preTotal);
    roundOffAmount = Number((rounded - preTotal).toFixed(2));
    grandTotal = rounded;
  } else {
    grandTotal = Number(preTotal.toFixed(2));
  }

  // If user directly edited/specified customGrandTotal, respect it
  if (doc.customGrandTotal !== undefined && doc.customGrandTotal !== null && doc.customGrandTotal >= 0) {
    grandTotal = Number(doc.customGrandTotal);
  }

  const explicitAdvance = Number(doc.advanceReceived) || 0;
  const totalAdvanceDeductions = Number((explicitAdvance + itemAdvancesTotal).toFixed(2));
  const netRemainingDue = Math.max(0, Number((grandTotal - totalAdvanceDeductions).toFixed(2)));

  return {
    items: processedItems,
    rawSubtotal: Number(rawSubtotal.toFixed(2)),
    totalWorkCharges: Number(totalWorkCharges.toFixed(2)),
    totalAdvanceDeductions,
    itemDiscountsTotal: Number(itemDiscountsTotal.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    totalTax: Number(totalTaxCalculated.toFixed(2)),
    taxBreakdowns,
    shippingCharges: shipping,
    packagingCharges: packaging,
    roundOffAmount,
    grandTotal: Math.max(0, grandTotal),
    advanceReceived: totalAdvanceDeductions,
    netRemainingDue,
  };
}
