import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

export async function generatePDF(pages: string[]): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const pagePDFs: Buffer[] = [];

  try {
    for (const pageHtml of pages) {
      const tab = await browser.newPage();
      await tab.setContent(pageHtml, { waitUntil: 'domcontentloaded' });
      await tab.emulateMediaType('screen');
      const pdfBytes = await tab.pdf({
        width: '816px',
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
      });
      pagePDFs.push(Buffer.from(pdfBytes));
      await tab.close();
    }
  } finally {
    await browser.close();
  }

  // Merge all page PDFs into one document using pdf-lib
  const merged = await PDFDocument.create();
  for (const pdfBuffer of pagePDFs) {
    const doc = await PDFDocument.load(pdfBuffer);
    const copiedPages = await merged.copyPages(doc, doc.getPageIndices());
    copiedPages.forEach(p => merged.addPage(p));
  }

  const mergedBytes = await merged.save();
  return Buffer.from(mergedBytes);
}
