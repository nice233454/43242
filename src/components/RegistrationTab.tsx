import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Participant, Event } from '../types';
import { printBadge } from '../utils/badge';
import { parseExcel } from '../utils/excel';
import { Search, UserPlus, Printer, Upload, X, CheckCircle, AlertTriangle, Loader2, User } from 'lucide-react';

interface RegistrationTabProps {
  event: Event;
  participants: Participant[];
  onRefresh: () => void;
}

export default function RegistrationTab({ event, participants, onRefresh }: RegistrationTabProps) {
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [printing, setPrinting] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'warn'; text: string } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const filtered = query.trim().length > 0
    ? participants.filter((p) => {
        const full = `${p.last_name} ${p.first_name} ${p.middle_name}`.toLowerCase();
        return full.includes(query.toLowerCase());
      })
    : participants;

  async function handlePrintBadge(p: Participant) {
    if (printing) return;
    setPrinting(p.id);
    const alreadyCheckedIn = !!p.check_in_time;

    const { error } = await supabase
      .from('participants')
      .update({ check_in_time: new Date().toISOString() })
      .eq('id', p.id);

    if (!error) {
      await printBadge(p);
      onRefresh();
      if (alreadyCheckedIn) {
        setNotification({ type: 'warn', text: `Повторная печать бейджа для ${p.last_name} ${p.first_name}` });
      } else {
        setNotification({ type: 'success', text: `${p.last_name} ${p.first_name} зарегистрирован(а)` });
      }
    }
    setPrinting(null);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const imported = parseExcel(buffer);
    if (imported.length === 0) {
      setNotification({ type: 'warn', text: 'Не удалось найти участников в файле' });
      return;
    }
    const rows = imported.map((p) => ({ ...p, event_id: event.id }));
    const { error } = await supabase.from('participants').insert(rows);
    if (!error) {
      onRefresh();
      setNotification({ type: 'success', text: `Импортировано участников: ${imported.length}` });
    } else {
      setNotification({ type: 'warn', text: error.message });
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-amber-500'}`}>
          {notification.type === 'success'
            ? <CheckCircle className="w-5 h-5 shrink-0" />
            : <AlertTriangle className="w-5 h-5 shrink-0" />}
          {notification.text}
        </div>
      )}

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по ФИО..."
            className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3 rounded-xl transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Добавить
        </button>

        <label className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold px-5 py-3 rounded-xl transition-colors cursor-pointer">
          <Upload className="w-5 h-5" />
          Импорт Excel
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
        </label>
      </div>

      <div className="mb-3 text-sm text-slate-500">
        {query ? `Найдено: ${filtered.length}` : `Всего участников: ${participants.length}`}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>{query ? 'Участники не найдены' : 'Нет участников. Добавьте или импортируйте.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${p.check_in_time ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {p.last_name.charAt(0)}{p.first_name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {p.last_name} {p.first_name} {p.middle_name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {p.municipality && <span className="text-xs text-slate-500">{p.municipality}</span>}
                    {p.check_in_time && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {new Date(p.check_in_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {p.check_out_time && (
                      <span className="text-xs text-blue-600">Сертификат выдан</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePrintBadge(p)}
                disabled={printing === p.id}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
              >
                {printing === p.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Printer className="w-4 h-4" />}
                {p.check_in_time ? 'Повторно' : 'Бейдж'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddParticipantModal
          event={event}
          onClose={() => setShowAdd(false)}
          onAdded={async (p) => {
            onRefresh();
            setShowAdd(false);
            await printBadge(p);
            setNotification({ type: 'success', text: `${p.last_name} ${p.first_name} добавлен(а) и зарегистрирован(а)` });
          }}
        />
      )}
    </div>
  );
}

interface AddParticipantModalProps {
  event: Event;
  onClose: () => void;
  onAdded: (p: Participant) => void;
}

function AddParticipantModal({ event, onClose, onAdded }: AddParticipantModalProps) {
  const [form, setForm] = useState({
    last_name: '', first_name: '', middle_name: '',
    birth_date: '', municipality: '', phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.last_name.trim() || !form.first_name.trim()) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('participants')
      .insert({
        event_id: event.id,
        last_name: form.last_name.trim(),
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim(),
        birth_date: form.birth_date || null,
        municipality: form.municipality.trim(),
        phone: form.phone.trim(),
        check_in_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (err) { setError(err.message); setLoading(false); return; }
    onAdded(data as Participant);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white">
          <h3 className="text-lg font-bold text-slate-800">Новый участник</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {[
            { field: 'last_name', label: 'Фамилия', required: true },
            { field: 'first_name', label: 'Имя', required: true },
            { field: 'middle_name', label: 'Отчество', required: false },
            { field: 'municipality', label: 'Муниципалитет', required: false },
            { field: 'phone', label: 'Телефон', required: false },
          ].map(({ field, label, required }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <input
                value={form[field as keyof typeof form]}
                onChange={(e) => set(field, e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={required}
                autoFocus={field === 'last_name'}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Дата рождения</label>
            <input
              type="date"
              value={form.birth_date}
              onChange={(e) => set('birth_date', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors">
              Отмена
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-xl transition-colors">
              {loading ? 'Сохранение...' : 'Сохранить и печатать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
