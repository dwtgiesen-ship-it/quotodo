// Client-safe i18n dictionary. Locale lives in a `lang` cookie. Server code reads
// it via @/lib/i18n-server (getDict); client components use clientLocale() + dict.
// Add a language by extending `dict`.

export type Locale = "en" | "nl";
export const LOCALES: { id: Locale; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "nl", label: "NL" },
];

export type Dict = (typeof dict)["en"];

export const dict = {
  en: {
    nav: { features: "Features", who: "Who it's for", why: "Why Schedulemode", pricing: "Pricing", login: "Log in", startFree: "Start free" },
    hero: {
      badge: "Now with real-time calendar sync + AI",
      title: "Unlock your salon's potential",
      subtitle: "Booking, calendar, payments, clients and marketing — in one beautifully simple platform your whole team will love. Set up in 10 minutes and start taking bookings today.",
      ctaPrimary: "Start free", ctaSecondary: "See a live demo", noCard: "No card required · cancel anytime",
      floatCard: "AI filled 3 open slots this week",
    },
    trust: "Built for modern salons of every kind",
    who: ["Hair salons", "Nail salons", "Barbershops", "Beauty studios", "Lash & brow", "Spas", "Wellness centers", "Pet grooming"],
    why: {
      title: "Salon software, finally done right",
      subtitle: "Most tools are powerful but painful. Schedulemode is powerful and effortless — here's what makes it different.",
      items: [
        { title: "Live in 10 minutes", body: "A setup wizard with smart defaults for your vertical. No onboarding calls, no training, no spreadsheets to import by hand." },
        { title: "The best calendar sync, period", body: "Real-time two-way sync with Google, Microsoft 365 and Apple. Personal events block bookings automatically — zero double-bookings." },
        { title: "An AI assistant that does the work", body: "“Book Sarah for gel nails Tuesday.” “Fill next week's gaps.” “Who hasn't visited in 60 days?” Just ask — it acts behind a confirm step." },
        { title: "Everything in one place", body: "Calendar, online booking, payments, clients, memberships, loyalty and marketing — one tool your whole team actually enjoys using." },
      ],
    },
    band: { title: "Everything you need to run your salon", subtitle: "One platform that has quietly replaced the calendar, the POS, the spreadsheet and the four marketing apps.", pills: ["Calendar", "Online booking", "Payments", "Clients", "Memberships", "Loyalty", "Messaging", "Reporting", "AI assistant", "Calendar sync"] },
    features: [
      { tag: "Calendar & scheduling", title: "Take control of your day", body: "A fast, color-coded calendar your team runs from any device. Drag to reschedule, book multiple services back-to-back, and see conflicts and gaps before they cost you.", bullets: ["Day / week / staff views", "Drag-and-drop reschedule", "Group & back-to-back bookings", "Real-time across the team"] },
      { tag: "Client management", title: "Know every client by heart", body: "Rich profiles with history, spend, notes, photos and preferences — plus pet and nail extensions. Loyalty points, tiers and memberships are built in.", bullets: ["Visit & spend history", "Before/after photo galleries", "Loyalty points & VIP tiers", "Memberships & packages"] },
      { tag: "Real-time calendar sync", title: "Never double-book again", body: "Connect each staff member's Google, Microsoft or Apple calendar. Their personal events instantly become unavailable time, and every Schedulemode appointment mirrors out — both ways, in real time.", bullets: ["Two-way Google / Microsoft / Apple", "Personal events block bookings", "Webhook-driven, near-instant", "Per-staff & multi-location"] },
      { tag: "Reporting", title: "See what's actually working", body: "Revenue, retention, no-shows, lifetime value, staff performance and booking channels — at a glance, with one-click CSV export. Your AI assistant turns the numbers into actions.", bullets: ["Revenue & retention", "No-show & CLV tracking", "Staff & service breakdowns", "CSV export"] },
    ],
    whoSection: { title: "One platform, every kind of salon", subtitle: "Smart defaults per vertical mean you're live in minutes, whatever you do." },
    compare: {
      title: "Why salons switch to Schedulemode", subtitle: "The all-in-one experience legacy salon software can't match.",
      us: "Schedulemode", them: "Typical salon software",
      rows: [["Setup time", "Under 10 minutes", "Days, with onboarding calls"], ["Two-way calendar sync", true, "One-way or none"], ["AI scheduling assistant", true, false], ["Mobile-first for staff", true, "Desktop-era UI"], ["All-in-one (no add-ons)", true, "Paid modules"]] as [string, boolean | string, boolean | string][],
    },
    testimonials: {
      title: "Loved by busy salon teams", note: "Illustrative testimonials from the demo.",
      items: [
        { quote: "We were taking bookings the same afternoon we signed up. The calendar sync alone ended our double-booking headaches.", name: "Amara V.", role: "Owner · Lash studio" },
        { quote: "The assistant fills our quiet days without me lifting a finger. It feels like having an extra receptionist.", name: "Daniel R.", role: "Barbershop" },
        { quote: "Memberships and loyalty used to live in three apps. Now it's one screen my whole team understands.", name: "Priya S.", role: "Med spa" },
      ],
    },
    pricing: {
      title: "Simple pricing, per location", subtitle: "Start free. Upgrade when you grow.", per: "/mo", popular: "Popular",
      plans: [
        { name: "Starter", price: "€0", tag: "solo & new", features: ["Online booking", "1 calendar sync", "SMS + email reminders", "Basic reports"], cta: "Start free" },
        { name: "Pro", price: "€49", tag: "most popular", features: ["Everything in Starter", "Memberships & loyalty", "AI assistant", "WhatsApp + automations", "Full reporting"], cta: "Start Pro" },
        { name: "Premium", price: "€99", tag: "multi-location", features: ["Everything in Pro", "Multiple locations", "Advanced AI flows", "Priority support", "API access"], cta: "Start Premium" },
      ],
    },
    finalCta: { title: "Switch to Schedulemode with zero downtime", subtitle: "Set up in 10 minutes, keep your calendar in sync, and take your first booking today.", ctaPrimary: "Start free", ctaSecondary: "Explore the demo" },
    footer: { tagline: "The easiest salon software in the world. Live in 10 minutes.", builtFor: "Built for nail · hair · beauty · barber · lash · spa · pet grooming", rights: "Demo product.", cols: { platform: "Platform", who: "Who it's for", features: "Features", resources: "Resources" } },
    auth: {
      loginTitle: "Welcome back", loginSubtitle: "Log in to your salon.", loginCta: "Log in",
      signupTitle: "Start free", signupSubtitle: "Create your salon — live in 10 minutes.", signupCta: "Create my salon",
      name: "Your name", email: "Email", password: "Password", min8: "At least 8 characters", noCard: "No card required · free to start",
      haveAccount: "Already have an account?", noAccount: "New to Schedulemode?",
    },
  },

  nl: {
    nav: { features: "Functies", who: "Voor wie", why: "Waarom Schedulemode", pricing: "Prijzen", login: "Inloggen", startFree: "Gratis starten" },
    hero: {
      badge: "Nu met realtime agenda-synchronisatie + AI",
      title: "Haal het beste uit je salon",
      subtitle: "Afspraken, agenda, betalingen, klanten en marketing — in één prachtig eenvoudig platform waar je hele team van houdt. Binnen 10 minuten ingericht en vandaag nog boekingen ontvangen.",
      ctaPrimary: "Gratis starten", ctaSecondary: "Bekijk de demo", noCard: "Geen creditcard nodig · altijd opzegbaar",
      floatCard: "AI vulde deze week 3 vrije plekken",
    },
    trust: "Gemaakt voor moderne salons van elk type",
    who: ["Kapsalons", "Nagelsalons", "Barbershops", "Beautysalons", "Wimpers & brows", "Spa's", "Wellnesscentra", "Trimsalons"],
    why: {
      title: "Salonsoftware, eindelijk goed gedaan",
      subtitle: "De meeste tools zijn krachtig maar omslachtig. Schedulemode is krachtig én moeiteloos — dit maakt het anders.",
      items: [
        { title: "Binnen 10 minuten live", body: "Een instelwizard met slimme standaarden voor jouw branche. Geen onboardingsgesprekken, geen training, geen handmatige import." },
        { title: "De beste agenda-sync, punt uit", body: "Realtime tweerichtingssync met Google, Microsoft 365 en Apple. Privé-afspraken blokkeren automatisch boekingen — geen dubbele boekingen." },
        { title: "Een AI-assistent die het werk doet", body: "“Boek Sarah dinsdag voor gelnagels.” “Vul de gaten van volgende week.” “Wie is al 60 dagen niet geweest?” Vraag het gewoon — met een bevestigingsstap." },
        { title: "Alles op één plek", body: "Agenda, online boeken, betalingen, klanten, abonnementen, loyaliteit en marketing — één tool waar je hele team graag mee werkt." },
      ],
    },
    band: { title: "Alles wat je nodig hebt om je salon te runnen", subtitle: "Eén platform dat stilletjes de agenda, de kassa, de spreadsheet en vier marketing-apps heeft vervangen.", pills: ["Agenda", "Online boeken", "Betalingen", "Klanten", "Abonnementen", "Loyaliteit", "Berichten", "Rapportage", "AI-assistent", "Agenda-sync"] },
    features: [
      { tag: "Agenda & planning", title: "Houd grip op je dag", body: "Een snelle, kleurgecodeerde agenda die je team op elk apparaat bedient. Sleep om te verzetten, boek meerdere diensten achter elkaar en zie conflicten en gaten voordat ze geld kosten.", bullets: ["Dag- / week- / medewerkerweergave", "Slepen om te verzetten", "Groeps- en aaneengesloten boekingen", "Realtime voor het hele team"] },
      { tag: "Klantbeheer", title: "Ken elke klant van binnen en buiten", body: "Uitgebreide profielen met historie, besteding, notities, foto's en voorkeuren — plus huisdier- en nagel-uitbreidingen. Loyaliteitspunten, niveaus en abonnementen zitten erin.", bullets: ["Bezoek- & bestedingshistorie", "Voor/na fotogalerijen", "Loyaliteitspunten & VIP-niveaus", "Abonnementen & pakketten"] },
      { tag: "Realtime agenda-sync", title: "Nooit meer dubbel boeken", body: "Koppel de Google-, Microsoft- of Apple-agenda van elke medewerker. Privé-afspraken worden direct geblokkeerde tijd, en elke Schedulemode-afspraak wordt gespiegeld — beide kanten op, realtime.", bullets: ["Tweerichting Google / Microsoft / Apple", "Privé-afspraken blokkeren boekingen", "Webhook-gestuurd, vrijwel direct", "Per medewerker & meerdere locaties"] },
      { tag: "Rapportage", title: "Zie wat écht werkt", body: "Omzet, retentie, no-shows, klantwaarde, prestaties per medewerker en boekingskanalen — in één oogopslag, met CSV-export in één klik. Je AI-assistent zet cijfers om in acties.", bullets: ["Omzet & retentie", "No-show & klantwaarde", "Per medewerker & dienst", "CSV-export"] },
    ],
    whoSection: { title: "Eén platform, elke soort salon", subtitle: "Slimme standaarden per branche zorgen dat je in minuten live bent, wat je ook doet." },
    compare: {
      title: "Waarom salons overstappen naar Schedulemode", subtitle: "De alles-in-één-ervaring die verouderde salonsoftware niet kan bieden.",
      us: "Schedulemode", them: "Gangbare salonsoftware",
      rows: [["Inrichtingstijd", "Onder de 10 minuten", "Dagen, met onboardingsgesprekken"], ["Tweerichting agenda-sync", true, "Eenrichting of geen"], ["AI-planningsassistent", true, false], ["Mobile-first voor het team", true, "Verouderde desktop-UI"], ["Alles-in-één (geen extra's)", true, "Betaalde modules"]] as [string, boolean | string, boolean | string][],
    },
    testimonials: {
      title: "Geliefd bij drukke salonteams", note: "Illustratieve quotes uit de demo.",
      items: [
        { quote: "We ontvingen dezelfde middag al boekingen. Alleen de agenda-sync maakte al een einde aan onze dubbele boekingen.", name: "Amara V.", role: "Eigenaar · Wimperstudio" },
        { quote: "De assistent vult onze rustige dagen zonder dat ik iets hoef te doen. Net een extra receptionist.", name: "Daniel R.", role: "Barbershop" },
        { quote: "Abonnementen en loyaliteit zaten vroeger in drie apps. Nu is het één scherm dat mijn hele team snapt.", name: "Priya S.", role: "Med spa" },
      ],
    },
    pricing: {
      title: "Eenvoudige prijzen, per locatie", subtitle: "Gratis starten. Upgraden wanneer je groeit.", per: "/mnd", popular: "Populair",
      plans: [
        { name: "Starter", price: "€0", tag: "solo & nieuw", features: ["Online boeken", "1 agenda-sync", "Sms- + e-mailherinneringen", "Basisrapportage"], cta: "Gratis starten" },
        { name: "Pro", price: "€49", tag: "populairst", features: ["Alles uit Starter", "Abonnementen & loyaliteit", "AI-assistent", "WhatsApp + automatiseringen", "Volledige rapportage"], cta: "Kies Pro" },
        { name: "Premium", price: "€99", tag: "meerdere locaties", features: ["Alles uit Pro", "Meerdere locaties", "Geavanceerde AI-flows", "Voorrang bij support", "API-toegang"], cta: "Kies Premium" },
      ],
    },
    finalCta: { title: "Stap zonder downtime over naar Schedulemode", subtitle: "Binnen 10 minuten ingericht, je agenda gesynchroniseerd, en vandaag nog je eerste boeking.", ctaPrimary: "Gratis starten", ctaSecondary: "Verken de demo" },
    footer: { tagline: "De makkelijkste salonsoftware ter wereld. Binnen 10 minuten live.", builtFor: "Voor nagels · haar · beauty · barber · wimpers · spa · trimsalon", rights: "Demoproduct.", cols: { platform: "Platform", who: "Voor wie", features: "Functies", resources: "Bronnen" } },
    auth: {
      loginTitle: "Welkom terug", loginSubtitle: "Log in op je salon.", loginCta: "Inloggen",
      signupTitle: "Gratis starten", signupSubtitle: "Maak je salon aan — binnen 10 minuten live.", signupCta: "Maak mijn salon aan",
      name: "Je naam", email: "E-mail", password: "Wachtwoord", min8: "Minimaal 8 tekens", noCard: "Geen creditcard nodig · gratis starten",
      haveAccount: "Heb je al een account?", noAccount: "Nieuw bij Schedulemode?",
    },
  },
};

export function clientLocale(): Locale {
  if (typeof document === "undefined") return "en";
  return document.cookie.includes("lang=nl") ? "nl" : "en";
}
