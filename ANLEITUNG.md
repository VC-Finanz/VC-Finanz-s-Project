# 🚀 CRM Setup Anleitung - Vercel + Supabase

## Zeitaufwand: ca. 20-30 Minuten

---

## SCHRITT 1: Supabase Account erstellen (5 Min)

1. Gehe zu **https://supabase.com**
2. Klicke auf **"Start your project"**
3. Login mit GitHub oder E-Mail
4. Klicke auf **"New Project"**
5. Fülle aus:
   - **Name:** `mein-crm` (oder wie du willst)
   - **Database Password:** Wähle ein sicheres Passwort → **AUFSCHREIBEN!**
   - **Region:** Frankfurt (EU) für beste Geschwindigkeit
6. Klicke **"Create new project"**
7. Warte 1-2 Minuten bis es fertig ist

---

## SCHRITT 2: Datenbank-Tabellen erstellen (3 Min)

1. In Supabase, klicke links auf **"SQL Editor"**
2. Klicke auf **"New query"**
3. Kopiere den GESAMTEN Inhalt aus der Datei `database-setup.sql` (liegt im Projektordner)
4. Füge ihn ein und klicke **"Run"**
5. Du solltest sehen: "Success. No rows returned"

---

## SCHRITT 3: Supabase-Schlüssel kopieren (2 Min)

1. Klicke links auf **"Project Settings"** (Zahnrad unten)
2. Klicke auf **"API"**
3. Du siehst dort:
   - **Project URL** → Kopieren (sieht aus wie: `https://xxxxx.supabase.co`)
   - **anon public** Key → Kopieren (langer Text)

Diese beiden Werte brauchst du gleich!

---

## SCHRITT 4: Vercel Account erstellen (3 Min)

1. Gehe zu **https://vercel.com**
2. Klicke **"Sign Up"**
3. Wähle **"Continue with GitHub"** (am einfachsten)
   - Falls du kein GitHub hast: **"Continue with Email"**
4. Account bestätigen

---

## SCHRITT 5: Projekt auf Vercel hochladen (10 Min)

### Option A: Per Drag & Drop (einfachste)

1. Lade die ZIP-Datei `crm-vercel.zip` herunter
2. Entpacke sie auf deinem Computer
3. Gehe zu **https://vercel.com/new**
4. Scrolle runter zu **"Import Third-Party Git Repository"**
   
   ODER einfacher:
   
5. Installiere die Vercel CLI (einmalig):
   - Öffne Terminal/Eingabeaufforderung
   - Tippe: `npm install -g vercel`

6. Navigiere zum entpackten Ordner:
   - `cd pfad/zum/crm-vercel`

7. Tippe: `vercel`
   - Folge den Anweisungen
   - Bei "Link to existing project?" → No
   - Bei "Project name?" → Enter drücken
   - Bei "Directory?" → Enter drücken

### Option B: Per GitHub (für Fortgeschrittene)

1. Erstelle ein neues Repository auf GitHub
2. Lade alle Dateien hoch
3. In Vercel: "Import Git Repository"
4. Wähle dein Repository

---

## SCHRITT 6: Umgebungsvariablen setzen (2 Min)

1. In Vercel, gehe zu deinem Projekt
2. Klicke auf **"Settings"**
3. Klicke auf **"Environment Variables"**
4. Füge diese zwei Variablen hinzu:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Deine Project URL von Schritt 3 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dein anon public Key von Schritt 3 |

5. Klicke jeweils **"Save"**

---

## SCHRITT 7: Neu deployen (1 Min)

1. Gehe zu **"Deployments"**
2. Klicke auf die drei Punkte beim letzten Deployment
3. Klicke **"Redeploy"**
4. Warte 1-2 Minuten

---

## 🎉 FERTIG!

Deine App ist jetzt online unter:
**https://dein-projektname.vercel.app**

### Standard-Login:
- **Benutzer:** admin
- **Passwort:** admin123

⚠️ **WICHTIG:** Ändere das Passwort nach dem ersten Login!

---

## Probleme?

### "Invalid API Key"
→ Überprüfe die Umgebungsvariablen in Vercel

### "Database error"
→ Hast du das SQL-Script in Supabase ausgeführt?

### Seite lädt nicht
→ Warte 2 Minuten und lade neu (Strg+F5)

---

## Benutzer hinzufügen

1. Gehe zu Supabase → SQL Editor
2. Führe aus:

```sql
INSERT INTO users (username, password_hash, name)
VALUES ('neueruser', 'neuespasswort', 'Neuer Name');
```

---

## Fragen?

Schreib mir einfach! 😊
