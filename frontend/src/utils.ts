import { Currency } from './types';

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'IQD') {
    return `IQD ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)}`;
  }
  const formatters: Record<string, Intl.NumberFormat> = {
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
    GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
  };
  return formatters[currency].format(amount);
}

export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function getMonthLabel(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(data: Record<string, unknown>[], title: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);

  const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const colWidths = headers.map(h =>
    Math.max(h.length, ...data.map(r => String(r[h] ?? '').length)) * 7 + 24
  );
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const pageWidth = Math.max(tableWidth + 80, 640);
  const rowH = 28;
  const headerH = 36;
  const topPad = 100;
  const pageHeight = topPad + headerH + data.length * rowH + 60;

  let headerCells = '';
  let xi = 40;
  headers.forEach((h, j) => {
    headerCells += `<rect x="${xi}" y="${topPad}" width="${colWidths[j]}" height="${headerH}" fill="#e8632a"/>`;
    headerCells += `<text x="${xi + 10}" y="${topPad + 24}" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="white">${esc(h)}</text>`;
    xi += colWidths[j];
  });

  let rowCells = '';
  data.forEach((row, i) => {
    let xr = 40;
    const bg = i % 2 === 0 ? '#f8f7f4' : '#ffffff';
    rowCells += `<rect x="40" y="${topPad + headerH + i * rowH}" width="${tableWidth}" height="${rowH}" fill="${bg}"/>`;
    headers.forEach((h, j) => {
      const val = esc(String(row[h] ?? ''));
      rowCells += `<text x="${xr + 10}" y="${topPad + headerH + i * rowH + 19}" font-family="Arial,sans-serif" font-size="12" fill="#1a1714">${val}</text>`;
      xr += colWidths[j];
    });
    rowCells += `<line x1="40" y1="${topPad + headerH + (i + 1) * rowH}" x2="${40 + tableWidth}" y2="${topPad + headerH + (i + 1) * rowH}" stroke="#e8e4de" stroke-width="0.5"/>`;
  });

  // Vertical column dividers
  let dividers = '';
  let xd = 40;
  headers.forEach((_, j) => {
    xd += colWidths[j];
    if (j < headers.length - 1) {
      dividers += `<line x1="${xd}" y1="${topPad}" x2="${xd}" y2="${topPad + headerH + data.length * rowH}" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>`;
    }
  });

  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}" height="${pageHeight}">
    <rect width="${pageWidth}" height="${pageHeight}" fill="white"/>
    <rect x="0" y="0" width="${pageWidth}" height="60" fill="#e8632a"/>
    <text x="40" y="38" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="white">${esc(title)}</text>
    <text x="${pageWidth - 40}" y="38" font-family="Arial,sans-serif" font-size="11" fill="rgba(255,255,255,0.75)" text-anchor="end">Generated on ${esc(now)}</text>
    <text x="40" y="84" font-family="Arial,sans-serif" font-size="13" fill="#6b6560">${data.length} record${data.length !== 1 ? 's' : ''} exported</text>
    ${headerCells}
    ${dividers}
    ${rowCells}
    <rect x="40" y="${topPad}" width="${tableWidth}" height="${headerH + data.length * rowH}" fill="none" stroke="#e8e4de" stroke-width="1"/>
    <text x="${pageWidth / 2}" y="${pageHeight - 16}" font-family="Arial,sans-serif" font-size="11" fill="#9c9690" text-anchor="middle">Ca$hCatcher · ${esc(now)}</text>
  </svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const svgUrl = URL.createObjectURL(blob);

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${esc(title)}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#f0ede8;font-family:Arial,sans-serif;padding:24px;display:flex;flex-direction:column;align-items:center}
    .bar{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:${pageWidth}px;margin-bottom:16px}
    .bar h2{font-size:16px;color:#1a1714;font-weight:700}
    .btn{background:#e8632a;color:white;border:none;padding:10px 22px;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px}
    .btn:hover{background:#d4541f}
    img{box-shadow:0 8px 40px rgba(0,0,0,0.12);border-radius:8px;max-width:100%}
    @media print{.bar{display:none}body{padding:0;background:white}}
  </style>
</head>
<body>
  <div class="bar">
    <h2>${esc(title)}</h2>
    <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <img src="${svgUrl}" width="${pageWidth}" height="${pageHeight}"/>
</body>
</html>`);
    win.document.close();
  }
}
