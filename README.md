# Social Club — Bewerbungstool

Web-App für die Verwaltung von Bewerbungen zu Social Club Editions (Partys): öffentliches Bewerbungsformular, Admin-Bereich zum Prüfen/Annehmen/Ablehnen und eine private Community-Ansicht pro Edition für angenommene Mitglieder.

## Funktionen

- **Mehrere Editions**: jede Edition (Party) hat einen eigenen öffentlichen Link, eigene Bewerbungen und eigene Community.
- **Bewerbungsformular** (öffentlich, auf Englisch gemäß Brand-Tonalität): Name, Email, Telefon, Geburtsdatum, Instagram-Handle, Motivationstext, Foto-Upload (JPG/PNG/WEBP, max. 8 MB).
- **Admin-Bereich** (Login-geschützt, deutsch): Editions anlegen/bearbeiten, Bewerbungen ansehen, annehmen oder ablehnen.
- **Community-Ansicht**: Sobald jemand angenommen wird, entsteht ein persönlicher Link (`/community/<token>`). Über diesen Link sehen angenommene Mitglieder Foto, Name und Instagram-Handle aller anderen angenommenen Mitglieder derselben Edition. Der Link muss manuell (z. B. per Mail oder DM) verschickt werden — es gibt keinen automatischen Mail-Versand.
- **Design**: nutzt die offizielle Social Club Farbpalette (Social Red `#d60538`, Deep Red `#8f0526`, Warm White, Black, Greys) und die Schrift Familjen Grotesk gemäß Brandbook.

## Voraussetzungen

- Node.js Version 18 oder neuer ([nodejs.org](https://nodejs.org))
- Internetzugang beim ersten `npm install` (lädt die Pakete aus dem npm-Registry)

## Installation

```bash
cd social-club-bewerbungstool
npm install
cp .env.example .env
```

Dann `.env` öffnen und ausfüllen:

- `SESSION_SECRET`: ein langer, zufälliger String (z. B. mit `openssl rand -hex 32` erzeugen)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: Zugangsdaten für deinen ersten Admin-Account

Admin-Account anlegen:

```bash
npm run seed
```

Server starten:

```bash
npm start
```

Die App läuft danach unter `http://localhost:3000`. Admin-Bereich: `http://localhost:3000/admin/login`.

## Eine Edition anlegen

1. Im Admin-Bereich einloggen.
2. „+ Neue Edition" klicken, Name/Datum/Location/Beschreibung eintragen.
3. Häkchen bei „Veröffentlicht" setzen, damit die Edition öffentlich sichtbar ist.
4. Den öffentlichen Link (`/edition/<slug>`) teilen, z. B. auf Instagram.

## Bewerbungen bearbeiten

Im Admin-Dashboard auf eine Edition klicken → Liste aller Bewerbungen. Bei „Annehmen" wird automatisch ein persönlicher Community-Link erzeugt, der auf der Detailseite der Bewerbung angezeigt wird. Diesen Link manuell an die Person senden.

## Technische Hinweise

- **Datenspeicherung**: einfache JSON-Datei (`data/db.json`), kein Datenbankserver nötig. Für den aktuellen Umfang (eine Veranstaltungsreihe, überschaubare Bewerberzahlen) ausreichend; bei stark wachsendem Volumen ggf. später auf eine echte Datenbank migrieren.
- **Fotos** werden lokal im Ordner `uploads/` gespeichert.
- **Deployment**: Die App lässt sich auf jedem Node-fähigen Server oder PaaS (z. B. Render, Railway, ein eigener VPS) betreiben. Wichtig: `uploads/` und `data/` müssen auf persistentem Speicher liegen (nicht bei jedem Deploy gelöscht werden).
- **Sprache**: Gäste-Seiten (Formular, Erfolgsmeldung, Community) sind auf Englisch gehalten, passend zur im Brandbook festgelegten Tone of Voice („we speak english"). Der Admin-Bereich ist auf Deutsch, da er nur intern von dir genutzt wird.
- **Schrift**: Familjen Grotesk wird über Google Fonts geladen (Regular/Medium/Bold, inkl. Italic). Die Logo-Schrift Flood Std aus dem Brandbook wurde bewusst nicht eingebaut, da sie eine kostenpflichtige Adobe-Lizenz erfordert, die hier nicht vorliegt — Headlines nutzen stattdessen Familjen Grotesk Bold Italic in Versalien, was dem dokumentierten Fallback in der Schrifthierarchie entspricht.

## Verifiziert

Die Kernlogik (Editions anlegen, Bewerbungen einreichen, Duplikatserkennung pro Email/Edition, Annehmen/Ablehnen, Token-Generierung, Community-Filterung auf „accepted", Slugify inkl. Umlauten, Altersberechnung) wurde mit einem Testskript durchgespielt und funktioniert wie erwartet. Alle EJS-Views wurden auf saubere Tag-Struktur und gültige Include-Pfade geprüft. `npm install` und ein Live-Start des Servers konnten in dieser Umgebung nicht durchgeführt werden (kein Zugriff auf das npm-Registry) — bitte nach der Installation auf deinem Rechner kurz durchklicken (Bewerbung abschicken → im Admin annehmen → Community-Link öffnen), um den vollen Durchlauf einmal selbst zu sehen.

## Deployment auf Render (mit dauerhaftem Speicher)

Diese App speichert Fotos und Bewerbungen in Dateien (`uploads/`, `data/db.json`). Auf Render muss dafür ein **Persistent Disk** eingehängt werden, sonst gehen die Daten bei jedem Neustart verloren. Der Code unterstützt das über die Umgebungsvariable `DATA_DIR` (siehe `.env.example`).

### 1. Code auf GitHub bringen
Render deployt direkt aus einem GitHub-Repository. Repo erstellen und den Projektordner hochladen (z. B. über GitHub Desktop oder die "Upload files"-Funktion im Browser).

### 2. Render Web Service anlegen
- Auf render.com registrieren, "New" → "Web Service", das GitHub-Repo auswählen.
- Build Command: `npm install`
- Start Command: `npm start`
- Plan: **Starter** (nicht Free, da Free keine Disk unterstützt)

### 3. Environment Variables setzen (Render Dashboard → Environment)
- `SESSION_SECRET` = langer zufälliger String
- `ADMIN_USERNAME` = gewünschter Admin-Benutzername
- `ADMIN_PASSWORD` = gewünschtes Admin-Passwort
- `DATA_DIR` = `/var/data`

Der Admin-Account wird beim ersten Start automatisch angelegt — kein manueller Seed-Schritt nötig.

### 4. Persistent Disk hinzufügen (Render Dashboard → Disks)
- Mount Path: `/var/data`
- Größe: 1 GB reicht für den Anfang (Fotos + JSON-Datenbank)

### 5. Eigene Subdomain verbinden
- Render Dashboard → Settings → Custom Domain → z. B. `apply.deinedomain.de` eintragen.
- Bei deinem DNS-Anbieter (oder in Webflow, falls die Domain dort verwaltet wird) einen CNAME-Eintrag anlegen: `apply` → die von Render angezeigte Zieladresse (`xxxx.onrender.com`).
- SSL-Zertifikat wird von Render automatisch eingerichtet (kann einige Minuten dauern).

### 6. Webflow verlinken
Auf der Webflow-Seite einen Button/Link einfügen, der auf `https://apply.deinedomain.de` zeigt (z. B. "Jetzt bewerben").
