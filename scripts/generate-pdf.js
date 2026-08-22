// Генерация PDF из HTML-страницы материалов (Playwright + headless Chromium)
// Использование: node scripts/generate-pdf.js <html-путь> <pdf-путь>
const path = require('path');
const { chromium } = require('playwright');

(async () => {
    const htmlPath = process.argv[2];
    const pdfPath = process.argv[3];
    if (!htmlPath || !pdfPath) {
        console.error('Использование: node scripts/generate-pdf.js <html-путь> <pdf-путь>');
        process.exit(1);
    }
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('file://' + path.resolve(htmlPath));
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '16mm', bottom: '16mm', left: '12mm', right: '12mm' },
    });
    await browser.close();
    console.log('PDF создан:', pdfPath);
})();
