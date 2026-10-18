# Weinkeller

Persönliche Weinkeller-Verwaltung. Backend: Supabase (Projekt `cdxmdavnspgczenhgjmk`, Tabelle `public.weine`).

## Aktuelle App
- `weinkeller-app2.html`: neue App (Keller, Trinkreife, Getrunken), eine Datei, Login über Supabase Auth.
- Zugriff nur mit Anmeldung. Die Datenbank erlaubt Lesen und Schreiben nur dem Konto des Besitzers (Policy "Nur Besitzer").
- Der Schlüssel in der Datei ist der öffentliche anon-Schlüssel. Der Schutz liegt in der Policy, nicht im Schlüssel.

## Weitere Dateien
- `weinkeller-dashboard.html`: altes Dashboard (zeigt seit der Policy-Umstellung keine Daten, wird im Ausbau ersetzt).
- `archiv/`: alte Versionen der App (`weinkeller-fixed-v2.html`, `weinkeller-fixed.html`, `weinkeller-v3.html`), ohne Login, funktionieren nicht mehr.

## Stand
Siehe `APP2_STAND_20261018.md` im Claude-Projekt "Weine".
