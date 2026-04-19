export interface Event {
  id: string;
  name: string;
  date: string;
  certificate_template_url: string | null;
  created_at: string;
}

export interface Participant {
  id: string;
  event_id: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  birth_date: string | null;
  municipality: string;
  phone: string;
  check_in_time: string | null;
  check_out_time: string | null;
  created_at: string;
}

export type AppView = 'events' | 'event-detail';
export type EventTab = 'registration' | 'scanner' | 'participants';
