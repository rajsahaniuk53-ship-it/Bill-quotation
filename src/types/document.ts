export type DocumentType = 
  | 'quotation' 
  | 'invoice' 
  | 'estimate' 
  | 'proforma' 
  | 'delivery_challan' 
  | 'cash_memo';

export type TaxType = 'gst' | 'single_tax' | 'none';

export interface LineItem {
  id: string;
  description: string;
  hsn?: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPercent: number;
  taxRate: number; // e.g. 0, 5, 12, 18, 28
  amount: number;
  itemType?: 'charge' | 'advance'; // 'charge' is (+) work/bill, 'advance' is (-) minus / advance received / deduction
}

export interface CompanyProfile {
  name: string;
  tagline?: string;
  logoUrl?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  phone2?: string;
  email: string;
  website?: string;
  gstin?: string;
  pan?: string;
}

export interface ClientProfile {
  name: string;
  companyName?: string;
  siteLocation?: string; // e.g. "Kandivali Work Site"
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstin?: string;
  pan?: string;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId: string;
}

export interface DocumentData {
  id: string;
  type: DocumentType;
  docNumber: string;
  date: string;
  dueDate: string;
  validityDays?: number;
  poNumber?: string;
  referenceNumber?: string;
  workTypeTitle?: string; // e.g. "BILL FOR LABOUR WITH MATERIAL CHARGES"
  paymentTerms?: string;
  status: 'draft' | 'sent' | 'paid' | 'approved' | 'cancelled';
  
  // Profiles
  company: CompanyProfile;
  client: ClientProfile;
  
  // Items
  items: LineItem[];
  
  // Tax & Charges
  taxType: TaxType;
  isInterstate: boolean; // if true in GST: IGST, else CGST + SGST
  discountTotalType: 'percentage' | 'fixed';
  discountTotalValue: number;
  shippingCharges: number;
  packagingCharges: number;
  advanceReceived?: number; // Less Advance Received
  roundOff: boolean;
  
  // Payment info
  bankDetails: BankDetails;
  showUpiQr: boolean;
  
  // Terms & Signatures
  notes: string;
  termsConditions: string;
  signatureImage?: string;
  signatureTitle: string;
  companyStampImage?: string;
  
  // Styling & Theme
  templateId: string; // 1 to 30
  primaryColor: string;
  secondaryColor?: string;
  fontFamily: 'sans' | 'serif' | 'modern' | 'mono';
  fontSizeScale?: 'compact' | 'normal' | 'large' | 'xlarge';
  liningStyle?: 'contractor_ledger' | 'double_border' | 'executive_box' | 'ruled_ledger' | 'modern_clean' | 'architect_grid';
  tableMode?: 'direct_amount' | 'rate_qty'; // 'direct_amount' = Lumpsum amount / Khata (no sqft/qty required), 'rate_qty' = Qty x Rate
  customGrandTotal?: number;
  currency: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface LetterheadTemplate {
  id: string;
  number: number;
  name: string;
  hindiName: string;
  category: 'Corporate' | 'Modern Minimal' | 'Royal Luxury' | 'Vyapar Traditional' | 'Creative Studio' | 'Industrial' | 'Tech' | 'Medical' | 'Compact';
  description: string;
  defaultPrimaryColor: string;
  defaultSecondaryColor: string;
  defaultFont: 'sans' | 'serif' | 'modern' | 'mono';
  badgeStyle: 'filled' | 'outline' | 'minimal' | 'modern';
  headerLayout: 'split' | 'centered' | 'ribbon' | 'banner' | 'framed' | 'compact' | 'wave' | 'minimal' | 'cards';
  tableHeaderStyle: 'dark' | 'light' | 'subtle' | 'accent' | 'bordered';
  footerLayout: 'split' | 'centered' | 'boxed';
  previewBg: string;
}
