# Kofferklaar 🧳

Jouw eigen kledingkast + AI-stylist. Upload foto's van al je kleding, schoenen en accessoires. Daarna vraag je gewoon in de chat:

> *"Morgen ga ik 3 dagen naar Porto Cervo. Wat heb ik nodig?"*
> *"Ik ga vanavond uit eten in Monaco, wat trek ik aan?"*

en Kofferklaar:

1. **checkt het weer** op je bestemming (per dag: ochtend, middag, avond, regen, wind, zeewater, zonsondergang),
2. **kiest complete outfits uit je eigen kast** voor ochtend, middag en avond — met schoenen, riem, zonnebril — volgens de moderegels van nu en de dresscode van de plek,
3. maakt een **afvinkbare paklijst**: de kledingstukken (met foto) plus alles wat je vergeet — paspoort, pinpas, contant geld, oplader, powerbank, adapter, zonnebrand…,
4. zegt wat er **nog ontbreekt** in je kast voor die trip.

Je kunt doorvragen ("andere schoenen?", "kan het met minder koffer?") en eerdere reizen terugvinden.

## Zo werkt het

| Scherm | Wat |
|---|---|
| **Kast** (`/kast`) | Sleep foto's erin (meerdere tegelijk). Claude herkent per foto het stuk: naam, soort, kleur, materiaal, hoe formeel en hoe warm. Klik op een stuk om iets te corrigeren, een notitie toe te voegen ("valt klein") of het tijdelijk op *niet beschikbaar* te zetten (in de was). |
| **Stylist** (`/`) | De chat. Werkt ook prima op je telefoon — zet hem via *Deel → Zet op beginscherm* als app op je iPhone. |

**Foto-tips:** één stuk per foto, plat neergelegd of op een hanger, rustige achtergrond, daglicht. Vergeet schoenen, riemen, tassen, zonnebrillen en zwemkleding niet — dan worden de looks compleet.

## Online zetten (Vercel) · ± 10 minuten

> ⚠️ Deze repo bevatte eerder Schedulemode. Maak voor Kofferklaar een **nieuw Vercel-project met een nieuwe database** — de oude database heeft andere tabellen en de build weigert die automatisch weg te gooien.

1. **Vercel → Add New → Project** → importeer deze GitHub-repo (branch `main`, of deze branch na mergen).
2. **Storage → Create Database → Postgres** (regio Frankfurt) en koppel die aan het project. Voeg daarna handmatig toe: `DIRECT_URL` = de waarde van `DATABASE_URL_UNPOOLED`.
3. **Settings → Environment Variables**:
   - `ANTHROPIC_API_KEY` — van [console.anthropic.com](https://console.anthropic.com)
   - `APP_PASSWORD` — een wachtwoord naar keuze (verplicht: anders kan iedereen met de link erbij)
4. **Deploy.** De database-tabellen worden bij de build automatisch aangemaakt.

Open de URL, log in met je wachtwoord, ga naar **Kast** en upload je foto's.

## Lokaal draaien

```bash
cp .env.example .env      # vul DATABASE_URL, DIRECT_URL en ANTHROPIC_API_KEY in
npm install
npm run db:push           # maakt de tabellen
npm run dev               # http://localhost:3000
```

## Techniek

Next.js 16 · Prisma + PostgreSQL · Claude (`claude-opus-5`) voor foto-herkenning en de stylist · weer via [Open-Meteo](https://open-meteo.com) (gratis, geen sleutel). Foto's worden in de browser verkleind en in de database opgeslagen.

Kosten: alleen je Claude API-gebruik — grofweg een paar cent per geüploade foto en per vraag aan de stylist.
