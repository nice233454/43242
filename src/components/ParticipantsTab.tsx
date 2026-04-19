import { useState } from 'react';
import { Participant, Event } from '../types';
import { exportToExcel } from '../utils/excel';
import { Download, Users, CheckCircle, Award, Search, X } from 'lucide-react';

interface ParticipantsTabProps {
  event: Event;
  participants: Participant[];
}

export default function ParticipantsTab({ event, participants }: ParticipantsTabProps) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? participants.filter((p) => {
        const full = `${p.last_name} ${p.first_name} ${p.middle_name} ${p.municipality}`.toLowerCase();
        return full.includes(query.toLowerCase());
      })
    : participants;

  const checkedIn = participants.filter((p) => p.check_in_time).length;
  const certified = participants.filter((p) => p.check_out_time).length;

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Users className="w-5 h-5 text-slate-600" />} label="Всего" value={participants.length} color="bg-slate-50" />
        <StatCard icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} label="Зарегистрировано" value={checkedIn} color="bg-emerald-50" />
        <StatCard icon={<Award className="w-5 h-5 text-blue-600" />} label="Сертификатов" value={certified} color="bg-blue-50" />
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по ФИО или муниципалитету..."
            className="w-full pl-11 pr-10 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => exportToExcel(participants, event.name)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          Экспорт Excel
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>{query ? 'Участники не найдены' : 'Нет участников'}</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">ФИО</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Муниципалитет</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">ДР</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Вход</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Сертификат</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{p.last_name} {p.first_name}</p>
                      {p.middle_name && <p className="text-slate-500 text-xs">{p.middle_name}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{p.municipality || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                      {p.birth_date ? new Date(p.birth_date).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {p.check_in_time ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          {new Date(p.check_in_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.check_out_time ? (
                        <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg text-xs font-medium">
                          <Award className="w-3 h-3" />
                          {new Date(p.check_out_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            Показано: {filtered.length} из {participants.length}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`${color} rounded-2xl p-4 border border-slate-200`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs font-medium text-slate-600">{label}</span></div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
