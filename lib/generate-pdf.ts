import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

// Renders a single HTML document to PDF, honoring CSS page-break-before rules.
// Waits for networkidle0 to ensure Tailwind CDN and Google Fonts are fully applied.
export async function generatePDF(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 816, height: 1056 },
    executablePath: await chromium.executablePath(),
    // chromium.headless is string in v133+; cast via unknown to satisfy puppeteer-core types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    headless: chromium.headless as unknown as boolean,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 60000 });
    await page.emulateMediaType('print');
    const pdfBytes = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
}
