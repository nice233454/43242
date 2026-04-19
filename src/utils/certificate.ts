import { Participant, Event } from '../types';

export async function printCertificate(participant: Participant, event: Event): Promise<void> {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;

  const fullName = [participant.last_name, participant.first_name, participant.middle_name]
    .filter(Boolean)
    .join(' ');

  const eventDate = new Date(event.date).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const templateStyle = event.certificate_template_url
    ? `background-image: url('${event.certificate_template_url}'); background-size: cover; background-position: center;`
    : 'background: linear-gradient(135deg, #f5f0e8 0%, #ede5d5 100%); border: 8px double #8B7355;';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Сертификат — ${fullName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; background: #fff; }
        .certificate {
          width: 297mm; height: 210mm;
          ${templateStyle}
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; padding: 20mm;
          position: relative;
        }
        .cert-title {
          font-size: 36pt; font-weight: bold;
          color: #2c1810; text-transform: uppercase;
          letter-spacing: 4px; margin-bottom: 8mm;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        .cert-body { font-size: 14pt; color: #3a2a1a; line-height: 1.6; margin-bottom: 6mm; }
        .cert-name {
          font-size: 28pt; font-weight: bold;
          color: #1a0f00; margin: 6mm 0;
          border-bottom: 2px solid #8B7355;
          padding-bottom: 3mm;
        }
        .cert-event { font-size: 16pt; font-style: italic; color: #4a3728; margin-bottom: 4mm; }
        .cert-date { font-size: 12pt; color: #6a5040; margin-top: 8mm; }
        .cert-decoration {
          position: absolute; font-size: 60pt; opacity: 0.06;
          color: #8B7355; user-select: none;
        }
        .cert-decoration.top-left { top: 5mm; left: 5mm; }
        .cert-decoration.bottom-right { bottom: 5mm; right: 5mm; }
        @media print {
          body { margin: 0; }
          .certificate { width: 100vw; height: 100vh; }
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <span class="cert-decoration top-left">❋</span>
        <span class="cert-decoration bottom-right">❋</span>
        <div class="cert-title">Сертификат</div>
        <div class="cert-body">Настоящий сертификат подтверждает участие</div>
        <div class="cert-name">${fullName}</div>
        <div class="cert-body">в мероприятии</div>
        <div class="cert-event">«${event.name}»</div>
        <div class="cert-date">${eventDate}</div>
      </div>
      <script>
        window.onload = function() { window.print(); window.close(); };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
