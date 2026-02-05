-- =============================================
-- CRM Datenbank Setup für Supabase
-- Kopiere diesen gesamten Code in den SQL Editor
-- =============================================

-- Benutzer-Tabelle
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kunden-Tabelle
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  status TEXT DEFAULT 'erstkontakt',
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Termine-Tabelle
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  reminder BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kontakt-Historie
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  note TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dokumente-Tabelle
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Demo-Daten einfügen
-- =============================================

-- Demo-Benutzer (Passwörter sind im Klartext für Demo - in Produktion hashen!)
INSERT INTO users (username, password_hash, name) VALUES
  ('admin', 'admin123', 'Administrator'),
  ('berater1', 'berater123', 'Max Mustermann'),
  ('berater2', 'berater123', 'Anna Schmidt')
ON CONFLICT (username) DO NOTHING;

-- Demo-Kunden
INSERT INTO customers (name, company, email, phone, address, status, notes, tags) VALUES
  (
    'Thomas Müller',
    'Müller & Co. GmbH',
    'mueller@example.de',
    '0151 12345678',
    'Hauptstraße 42, 80331 München',
    'konzept',
    'Interessiert an BU-Versicherung. Termin für Konzeptvorstellung vereinbart.',
    ARRAY['VIP', 'BU-Interesse']
  ),
  (
    'Sarah Weber',
    '',
    'sarah.weber@email.de',
    '0172 98765432',
    'Gartenweg 7, 60311 Frankfurt',
    'erstkontakt',
    'Empfehlung von Herrn Müller.',
    ARRAY['Privat']
  ),
  (
    'Michael Schneider',
    'Schneider Consulting',
    'm.schneider@consulting.de',
    '0160 11122233',
    'Businesspark 15, 70173 Stuttgart',
    'abschluss',
    'BU und Altersvorsorge abgeschlossen. Sehr zufrieden.',
    ARRAY['Gewerbe', 'Bestandskunde']
  );

-- Demo-Termine (für Thomas Müller)
INSERT INTO appointments (customer_id, title, date, time, reminder)
SELECT id, 'Konzeptvorstellung', CURRENT_DATE + INTERVAL '7 days', '14:00', true
FROM customers WHERE name = 'Thomas Müller';

-- Demo-Kontakte
INSERT INTO contacts (customer_id, type, note, date)
SELECT id, 'Telefon', 'Erstkontakt, großes Interesse', CURRENT_DATE - INTERVAL '10 days'
FROM customers WHERE name = 'Thomas Müller';

INSERT INTO contacts (customer_id, type, note, date)
SELECT id, 'E-Mail', 'Unterlagen zugesendet', CURRENT_DATE - INTERVAL '5 days'
FROM customers WHERE name = 'Thomas Müller';

INSERT INTO contacts (customer_id, type, note, date)
SELECT id, 'Telefon', 'Kurzes Erstgespräch', CURRENT_DATE - INTERVAL '3 days'
FROM customers WHERE name = 'Sarah Weber';

-- =============================================
-- Row Level Security (RLS) aktivieren
-- =============================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies für öffentlichen Zugriff (für Demo - in Produktion einschränken!)
CREATE POLICY "Allow all access to customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all access to appointments" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow all access to contacts" ON contacts FOR ALL USING (true);
CREATE POLICY "Allow all access to documents" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true);

-- =============================================
-- Fertig! 🎉
-- =============================================
