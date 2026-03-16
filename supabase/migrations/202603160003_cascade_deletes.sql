-- Allow cascading deletes from pastors, churches and events

-- attendance_records: cascade on pastor_id
ALTER TABLE events.attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_pastor_id_fkey;
ALTER TABLE events.attendance_records
  ADD CONSTRAINT attendance_records_pastor_id_fkey
  FOREIGN KEY (pastor_id) REFERENCES core.pastors(id) ON DELETE CASCADE;

-- credentials.credentials: cascade on pastor_id
ALTER TABLE credentials.credentials
  DROP CONSTRAINT IF EXISTS credentials_pastor_id_fkey;
ALTER TABLE credentials.credentials
  ADD CONSTRAINT credentials_pastor_id_fkey
  FOREIGN KEY (pastor_id) REFERENCES core.pastors(id) ON DELETE CASCADE;

-- pastors: cascade on church_id
ALTER TABLE core.pastors
  DROP CONSTRAINT IF EXISTS pastors_church_id_fkey;
ALTER TABLE core.pastors
  ADD CONSTRAINT pastors_church_id_fkey
  FOREIGN KEY (church_id) REFERENCES core.churches(id) ON DELETE CASCADE;

-- event_sessions: cascade on event_id
ALTER TABLE events.event_sessions
  DROP CONSTRAINT IF EXISTS event_sessions_event_id_fkey;
ALTER TABLE events.event_sessions
  ADD CONSTRAINT event_sessions_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES events.events(id) ON DELETE CASCADE;

-- attendance_records: cascade on event_session_id
ALTER TABLE events.attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_event_session_id_fkey;
ALTER TABLE events.attendance_records
  ADD CONSTRAINT attendance_records_event_session_id_fkey
  FOREIGN KEY (event_session_id) REFERENCES events.event_sessions(id) ON DELETE CASCADE;
