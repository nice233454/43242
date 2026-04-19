import QRCode from 'qrcode';

export function buildQRContent(eventId: string, userId: string): string {
  return `event_${eventId}_user_${userId}`;
}

export function parseQRContent(qrContent: string): { eventId: string; userId: string } | null {
  const match = qrContent.match(/^event_(.+)_user_(.+)$/);
  if (!match) return null;
  return { eventId: match[1], userId: match[2] };
}

export async function generateQRDataURL(content: string): Promise<string> {
  return QRCode.toDataURL(content, {
    width: 200,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });
}
