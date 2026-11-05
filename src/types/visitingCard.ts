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
  upiId?: string;
  logoUrl?: string;
  qrType: 'vcard' | 'upi' | 'website';
  qrContent: string;
  themeId: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: 'sans' | 'serif' | 'modern' | 'mono';
  activeSide: 'front' | 'back' | 'both';
  printLayout: 'single' | 'sheet' | 'paired_duplex'; // 'single', 'sheet' of 10, or 'paired_duplex' Front+Back side-by-side with crop marks
  metalType?: 'gold' | 'silver' | 'copper' | 'titanium' | 'bronze' | 'none';
}

export interface VisitingCardTheme {
  id: string;
  name: string;
  subtitle?: string;
  category: 'Metallic Luxury' | 'Gold' | 'Silver' | 'Copper' | 'Luxury' | 'Corporate' | 'Minimal' | 'Traditional' | 'Tech';
  defaultPrimary: string;
  defaultSecondary: string;
  defaultFont: 'sans' | 'serif' | 'modern' | 'mono';
  bgGradient: string;
  textColor: string;
  accentColor: string;
  metalType?: 'gold' | 'silver' | 'copper' | 'titanium' | 'bronze';
  metallicFoil?: string;
  cardBorder?: string;
  sheenHighlight?: string;
}
