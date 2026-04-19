
/*
  # Initial Schema: Events, Participants, Admin User

  ## Tables Created
  
  ### events
  - id (uuid, PK)
  - name (text) - event name
  - date (date) - event date
  - certificate_template_url (text, nullable) - background image URL for certificate
  - created_at (timestamptz)

  ### participants
  - id (uuid, PK)
  - event_id (uuid, FK -> events)
  - last_name, first_name, middle_name (text)
  - birth_date (date, nullable)
  - municipality (text, nullable)
  - phone (text, nullable)
  - check_in_time (timestamptz, nullable) - set when badge printed
  - check_out_time (timestamptz, nullable) - set when certificate issued

  ## Security
  - RLS enabled on both tables
  - Authenticated users can read/write all events and participants
  
  ## Admin User
  - Email: admin@event.ru
  - Password: Admin123!
*/

-- EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  certificate_template_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (true);

-- PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  last_name text NOT NULL,
  first_name text NOT NULL,
  middle_name text DEFAULT '',
  birth_date date,
  municipality text DEFAULT '',
  phone text DEFAULT '',
  check_in_time timestamptz,
  check_out_time timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read participants"
  ON participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert participants"
  ON participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update participants"
  ON participants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete participants"
  ON participants FOR DELETE
  TO authenticated
  USING (true);

-- INDEX for fast search
CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_names ON participants(last_name, first_name);

-- ADMIN USER
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@event.ru') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'admin@event.ru',
      crypt('Admin123!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false, '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      new_user_id::text,
      json_build_object('sub', new_user_id::text, 'email', 'admin@event.ru'),
      'email',
      now(), now(), now()
    );
  END IF;
END $$;
