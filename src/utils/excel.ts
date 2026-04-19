import * as XLSX from 'xlsx';
import { Participant } from '../types';

export interface ImportedParticipant {
  last_name: string;
  first_name: string;
  middle_name: string;
  birth_date: string | null;
  municipality: string;
  phone: string;
}

const FIELD_MAP: Record<string, keyof ImportedParticipant> = {
  'фамилия': 'last_name',
  'имя': 'first_name',
  'отчество': 'middle_name',
  'дата рождения': 'birth_date',
  'муниципалитет': 'municipality',
  'телефон': 'phone',
};

function normalizeHeader(h: string): string {
  return h.toString().toLowerCase().trim();
}

export function parseExcel(buffer: ArrayBuffer): ImportedParticipant[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 });

  if (rows.length < 2) return [];

  const headers = (rows[0] as string[]).map(normalizeHeader);
  const result: ImportedParticipant[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const obj: ImportedParticipant = {
      last_name: '', first_name: '', middle_name: '',
      birth_date: null, municipality: '', phone: '',
    };

    headers.forEach((h, idx) => {
      const field = FIELD_MAP[h];
      if (!field) return;
      const val = row[idx];
      if (val === undefined || val === null || val === '') return;

      if (field === 'birth_date') {
        if (val instanceof Date) {
          obj.birth_date = val.toISOString().split('T')[0];
        } else {
          obj.birth_date = String(val);
        }
      } else {
        (obj[field] as string) = String(val).trim();
      }
    });

    if (obj.last_name && obj.first_name) {
      result.push(obj);
    }
  }

  return result;
}

export function exportToExcel(participants: Participant[], eventName: string): void {
  const data = participants.map((p) => ({
    'ID': p.id,
    'Фамилия': p.last_name,
    'Имя': p.first_name,
    'Отчество': p.middle_name,
    'Дата рождения': p.birth_date ?? '',
    'Муниципалитет': p.municipality,
    'Телефон': p.phone,
    'Вход': p.check_in_time
      ? new Date(p.check_in_time).toLocaleString('ru-RU')
      : '',
    'Выход': p.check_out_time
      ? new Date(p.check_out_time).toLocaleString('ru-RU')
      : '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Участники');

  const colWidths = [
    { wch: 38 }, { wch: 18 }, { wch: 14 }, { wch: 18 },
    { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 20 }, { wch: 20 },
  ];
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `${eventName}_участники.xlsx`);
}
