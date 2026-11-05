export interface VisitingCardData {
  personName: string;
  designation: string;
  companyName: string;
  tagline: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  website: string;
  address: string;
  cityStatePincode: string;
  gstin?: string;
  logoUrl?: string;
  qrType: 'vcard' | 'upi' | 'website';
  qrContent: string;
  themeId: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: 'sans' | 'serif' | 'modern' | 'mono';
  activeSide: 'front' | 'back' | 'both';
  printLayout: 'single' | 'sheet'; // 'single' card or 'sheet' of 8-10 cards on A4
}

export interface VisitingCardTheme {
  id: string;
  name: string;
  hindiName: string;
  category: string;
  defaultPrimary: string;
  defaultSecondary: string;
  defaultFont: 'sans' | 'serif' | 'modern' | 'mono';
  bgGradient: string;
  textColor: string;
  accentColor: string;
}
