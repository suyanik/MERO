export interface Mitarbeiter {
  id: string
  erstellt_am: string
  vorname: string
  nachname: string
  geburtsdatum: string | null
  telefon: string | null
  email: string | null
  adresse: string | null
  position: string
  eintrittsdatum: string
  grundgehalt: number
  monatliches_gehalt: number | null
  aktiv: boolean
  notizen: string | null
}

export interface Zahlung {
  id: string
  erstellt_am: string
  mitarbeiter_id: string
  zahlungsart: 'gehalt' | 'vorschuss' | 'bonus' | 'sonstiges'
  betrag: number
  zahlungsdatum: string
  zahlungsmonat: string | null
  beschreibung: string | null
}

export interface Dokument {
  id: string
  erstellt_am: string
  mitarbeiter_id: string
  dokumenttyp: 'fuehrerschein' | 'reisepass' | 'src' | 'personalausweis' | 'gesundheitszeugnis' | 'sonstiges'
  dokumentname: string | null
  datei_url: string | null
  ablaufdatum: string | null
  notizen: string | null
}

export interface Urlaub {
  id: string
  erstellt_am: string
  mitarbeiter_id: string
  urlaubsart: 'jahresurlaub' | 'krankheit' | 'sonderurlaub' | 'unbezahlt' | 'sonstiges'
  startdatum: string
  enddatum: string
  gesamttage: number | null
  status: 'ausstehend' | 'genehmigt' | 'abgelehnt'
  notizen: string | null
}

export interface MonatlichesGehalt {
  id: string
  erstellt_am: string
  mitarbeiter_id: string
  jahr: number
  monat: number
  betrag: number
  notizen: string | null
}