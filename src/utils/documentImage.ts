import html2canvas from 'html2canvas';
import { DocumentData } from '../types/document';

/**
 * Captures the rendered quotation/bill element as a high-resolution PNG Blob/File
 */
export async function captureDocumentAsImage(
  elementId: string = 'printable-document-sheet',
  doc?: DocumentData
): Promise<{ blob: Blob; file: File; dataUrl: string } | null> {
  const element = document.getElementById(elementId) || document.querySelector('.print-area');
  if (!element) {
    console.error(`Document element not found for capture: ${elementId}`);
    return null;
  }

  try {
    // Hide any no-print controls before snapshot
    const noPrintElements = element.querySelectorAll('.no-print');
    noPrintElements.forEach((el) => {
      (el as HTMLElement).style.visibility = 'hidden';
    });

    const isQuote = doc ? (doc.type === 'quotation' || doc.type === 'estimate') : true;
    const prefix = isQuote ? 'Quotation' : 'Invoice';
    const number = doc ? doc.docNumber.replace(/[^a-zA-Z0-9_-]/g, '_') : Date.now();
    const fileName = `${prefix}_${number}.png`;

    // High resolution capture
    const canvas = await html2canvas(element as HTMLElement, {
      scale: 2, // 2x for sharp print quality on mobile & desktop
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794, // Standard 210mm A4 width in 96 DPI
      onclone: (clonedDoc) => {
        // Ensure cloned element is fully visible without transform scale
        const clonedElement = clonedDoc.getElementById(elementId) || clonedDoc.querySelector('.print-area');
        if (clonedElement) {
          (clonedElement as HTMLElement).style.transform = 'none';
          (clonedElement as HTMLElement).style.margin = '0 auto';
          (clonedElement as HTMLElement).style.boxShadow = 'none';
        }
      },
    });

    // Restore no-print elements visibility
    noPrintElements.forEach((el) => {
      (el as HTMLElement).style.visibility = '';
    });

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const file = new File([blob], fileName, { type: 'image/png' });
          const dataUrl = canvas.toDataURL('image/png');
          resolve({ blob, file, dataUrl });
        },
        'image/png',
        0.98
      );
    });
  } catch (error) {
    console.error('Failed to capture document as image:', error);
    return null;
  }
}

/**
 * Downloads the quotation/bill as a high-quality PNG image to the user's phone gallery or computer
 */
export async function downloadDocumentAsImage(doc: DocumentData, elementId?: string): Promise<boolean> {
  const result = await captureDocumentAsImage(elementId, doc);
  if (!result) return false;

  const isQuote = doc.type === 'quotation' || doc.type === 'estimate';
  const fileName = `${isQuote ? 'Quotation' : 'Invoice'}_${doc.docNumber || 'doc'}.png`;

  const link = document.createElement('a');
  link.href = result.dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
