import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Event, Participant, EventTab } from '../types';
import Header from './Header';
import RegistrationTab from './RegistrationTab';
import ScannerTab from './ScannerTab';
import ParticipantsTab from './ParticipantsTab';
import { UserCheck, QrCode, Users, Loader2 } from 'lucide-react';

interface EventDetailPageProps {
  event: Event;
  onBack: () => void;
}

export default function EventDetailPage({ event, onBack }: EventDetailPageProps) {
  const [activeTab, setActiveTab] = useState<EventTab>('registration');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipants();

    const channel = supabase
      .channel(`participants-${event.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `event_id=eq.${event.id}` },
        () => loadParticipants()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [event.id]);

  async function loadParticipants() {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .eq('event_id', event.id)
      .order('last_name', { ascending: true });
    setParticipants(data ?? []);
    setLoading(false);
  }

  const tabs: { id: EventTab; label: string; icon: React.ReactNode }[] = [
    { id: 'registration', label: 'Регистрация', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'scanner', label: 'Сканер', icon: <QrCode className="w-4 h-4" /> },
    { id: 'participants', label: 'Участники', icon: <Users className="w-4 h-4" /> },
  ];

  const eventDate = new Date(event.date).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title={event.name} subtitle={eventDate} onBack={onBack} />

      <div className="bg-white border-b border-slate-200">
        <div className="flex px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'participants' && !loading && (
                <span className="ml-1 bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                  {participants.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'registration' && (
              <RegistrationTab event={event} participants={participants} onRefresh={loadParticipants} />
            )}
            {activeTab === 'scanner' && (
              <ScannerTab event={event} participants={participants} onRefresh={loadParticipants} />
            )}
            {activeTab === 'participants' && (
              <ParticipantsTab event={event} participants={participants} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
