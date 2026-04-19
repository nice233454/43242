import { Participant } from '../types';
import { buildQRContent, generateQRDataURL } from './qr';

export async function printBadge(participant: Participant): Promise<void> {
  const qrContent = buildQRContent(participant.event_id, participant.id);
  const qrDataURL = await generateQRDataURL(qrContent);

  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return;

  const fullName = [participant.last_name, participant.first_name, participant.middle_name]
    .filter(Boolean)
    .join(' ');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Бейдж — ${fullName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh; background: #fff;
        }
        .badge {
          width: 85mm; min-height: 54mm;
          border: 1px solid #000;
          padding: 6mm;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; gap: 3mm;
          page-break-inside: avoid;
        }
        .name-line { font-size: 16pt; font-weight: bold; line-height: 1.2; }
        .qr-code { margin-top: 3mm; }
        .qr-code img { width: 40mm; height: 40mm; }
        @media print {
          body { margin: 0; }
          .badge { border: 1px solid #000; }
        }
      </style>
    </head>
    <body>
      <div class="badge">
        <div class="name-line">${participant.last_name}</div>
        <div class="name-line">${participant.first_name}</div>
        ${participant.middle_name ? `<div class="name-line">${participant.middle_name}</div>` : ''}
        <div class="qr-code">
          <img src="${qrDataURL}" alt="QR" />
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); window.close(); };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
