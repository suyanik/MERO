'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mitarbeiter, Zahlung } from '@/types/database'
import {
  Plus,
  X,
  Euro,
  Calendar,
  User,
  TrendingDown,
  TrendingUp,
  Wallet,
  AlertCircle
} from 'lucide-react'

interface ZahlungenProps {
  mitarbeiter: Mitarbeiter[]
  onUpdate: () => void
}

export default function Zahlungen({ mitarbeiter, onUpdate }: ZahlungenProps) {
  const [zahlungen, setZahlungen] = useState<Zahlung[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [formData, setFormData] = useState({
    mitarbeiter_id: '',
    zahlungsart: 'vorschuss' as 'gehalt' | 'vorschuss' | 'bonus' | 'sonstiges',
    betrag: '',
    zahlungsdatum: new Date().toISOString().split('T')[0],
    beschreibung: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchZahlungen()
  }, [selectedMonth])

  async function fetchZahlungen() {
    setLoading(true)
    const { data, error } = await supabase
      .from('zahlungen')
      .select('*')
      .eq('zahlungsmonat', selectedMonth)
      .order('zahlungsdatum', { ascending: false })

    if (error) {
      console.error('Fehler:', error)
    } else {
      setZahlungen(data || [])
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('zahlungen')
      .insert([{
        mitarbeiter_id: formData.mitarbeiter_id,
        zahlungsart: formData.zahlungsart,
        betrag: parseFloat(formData.betrag),
        zahlungsdatum: formData.zahlungsdatum,
        zahlungsmonat: selectedMonth,
        beschreibung: formData.beschreibung || null
      }])

    if (error) {
      alert('Fehler beim Speichern: ' + error.message)
    } else {
      setShowModal(false)
      setFormData({
        mitarbeiter_id: '',
        zahlungsart: 'vorschuss',
        betrag: '',
        zahlungsdatum: new Date().toISOString().split('T')[0],
        beschreibung: ''
      })
      fetchZahlungen()
      onUpdate()
    }
    setSaving(false)
  }

  // Personel bazında özet hesapla
  function getMitarbeiterSummary(mId: string) {
    const m = mitarbeiter.find(x => x.id === mId)
    if (!m) return null

    const personalZahlungen = zahlungen.filter(z => z.mitarbeiter_id === mId)
    const vorschuesse = personalZahlungen
      .filter(z => z.zahlungsart === 'vorschuss')
      .reduce((sum, z) => sum + z.betrag, 0)
    const bonusse = personalZahlungen
      .filter(z => z.zahlungsart === 'bonus')
      .reduce((sum, z) => sum + z.betrag, 0)
    const auszahlung = m.grundgehalt - vorschuesse + bonusse

    return {
      grundgehalt: m.grundgehalt,
      vorschuesse,
      bonusse,
      auszahlung
    }
  }

  // Ay adını Almanca göster
  function getMonthName(monthStr: string) {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  }

  // Zahlungsart'a göre renk ve ikon
  function getZahlungsartStyle(art: string) {
    switch (art) {
      case 'vorschuss':
        return { bg: 'bg-orange-100', text: 'text-orange-700', icon: TrendingDown, label: 'Vorschuss' }
      case 'gehalt':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: Wallet, label: 'Gehalt' }
      case 'bonus':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: TrendingUp, label: 'Bonus' }
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-700', icon: Euro, label: 'Sonstiges' }
    }
  }

  const aktiveMitarbeiter = mitarbeiter.filter(m => m.aktiv)

  // Toplam istatistikler
  const totalVorschuesse = zahlungen
    .filter(z => z.zahlungsart === 'vorschuss')
    .reduce((sum, z) => sum + z.betrag, 0)
  const totalBonusse = zahlungen
    .filter(z => z.zahlungsart === 'bonus')
    .reduce((sum, z) => sum + z.betrag, 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
              Zahlungsübersicht
            </h2>
            <p className="text-slate-500 mt-1">
              Vorschüsse, Gehälter und Boni verwalten
            </p>
          </div>
          <div className="flex gap-3">
            {/* Ay Seçici */}
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
            />
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Neue Zahlung</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monat Info */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Calendar size={24} />
          <h3 className="text-xl font-bold">{getMonthName(selectedMonth)}</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-slate-300 text-sm">Gesamte Gehälter</p>
            <p className="text-2xl font-bold">
              {aktiveMitarbeiter.reduce((sum, m) => sum + m.grundgehalt, 0).toLocaleString('de-DE')} €
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-slate-300 text-sm">Vorschüsse</p>
            <p className="text-2xl font-bold text-orange-400">
              -{totalVorschuesse.toLocaleString('de-DE')} €
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-slate-300 text-sm">Boni</p>
            <p className="text-2xl font-bold text-green-400">
              +{totalBonusse.toLocaleString('de-DE')} €
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-slate-300 text-sm">Auszuzahlen</p>
            <p className="text-2xl font-bold">
              {(aktiveMitarbeiter.reduce((sum, m) => sum + m.grundgehalt, 0) - totalVorschuesse + totalBonusse).toLocaleString('de-DE')} €
            </p>
          </div>
        </div>
      </div>

      {/* Mitarbeiter Karten mit Zahlungsübersicht */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {aktiveMitarbeiter.map((m) => {
          const summary = getMitarbeiterSummary(m.id)
          const personalZahlungen = zahlungen.filter(z => z.mitarbeiter_id === m.id)

          return (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Kart Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                    {m.vorname[0]}{m.nachname[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{m.vorname} {m.nachname}</p>
                    <p className="text-slate-500 text-sm">{m.position}</p>
                  </div>
                </div>
              </div>

              {/* Özet */}
              <div className="p-4 bg-slate-50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Grundgehalt</p>
                    <p className="font-semibold text-slate-900">{m.grundgehalt.toLocaleString('de-DE')} €</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Vorschüsse</p>
                    <p className="font-semibold text-orange-600">
                      {summary ? `-${summary.vorschuesse.toLocaleString('de-DE')} €` : '0 €'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Boni</p>
                    <p className="font-semibold text-green-600">
                      {summary ? `+${summary.bonusse.toLocaleString('de-DE')} €` : '0 €'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Auszahlung</p>
                    <p className="font-bold text-lg text-slate-900">
                      {summary?.auszahlung.toLocaleString('de-DE')} €
                    </p>
                  </div>
                </div>
              </div>

              {/* Zahlungen Liste */}
              {personalZahlungen.length > 0 && (
                <div className="p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Zahlungen</p>
                  {personalZahlungen.map((z) => {
                    const style = getZahlungsartStyle(z.zahlungsart)
                    return (
                      <div key={z.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 ${style.bg} rounded-lg flex items-center justify-center`}>
                            <style.icon size={16} className={style.text} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{style.label}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(z.zahlungsdatum).toLocaleDateString('de-DE')}
                              {z.beschreibung && ` • ${z.beschreibung}`}
                            </p>
                          </div>
                        </div>
                        <span className={`font-semibold ${z.zahlungsart === 'vorschuss' ? 'text-orange-600' : 'text-green-600'}`}>
                          {z.zahlungsart === 'vorschuss' ? '-' : '+'}{z.betrag.toLocaleString('de-DE')} €
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {personalZahlungen.length === 0 && (
                <div className="p-4 text-center text-slate-400 text-sm">
                  Keine Zahlungen in diesem Monat
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="border-b border-slate-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Neue Zahlung erfassen</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Mitarbeiter Seçimi */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mitarbeiter *
                </label>
                <select
                  required
                  value={formData.mitarbeiter_id}
                  onChange={(e) => setFormData({...formData, mitarbeiter_id: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                >
                  <option value="">Bitte auswählen...</option>
                  {aktiveMitarbeiter.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.vorname} {m.nachname} ({m.position})
                    </option>
                  ))}
                </select>
              </div>

              {/* Zahlungsart */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Zahlungsart *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'vorschuss', label: 'Vorschuss', icon: TrendingDown, color: 'orange' },
                    { value: 'bonus', label: 'Bonus', icon: TrendingUp, color: 'green' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({...formData, zahlungsart: option.value as any})}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        formData.zahlungsart === option.value
                          ? option.color === 'orange'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-green-500 bg-green-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <option.icon size={20} className={
                        formData.zahlungsart === option.value
                          ? option.color === 'orange' ? 'text-orange-600' : 'text-green-600'
                          : 'text-slate-400'
                      } />
                      <span className={`font-medium ${
                        formData.zahlungsart === option.value ? 'text-slate-900' : 'text-slate-600'
                      }`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Betrag */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Betrag (€) *
                </label>
                <div className="relative">
                  <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.betrag}
                    onChange={(e) => setFormData({...formData, betrag: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                    placeholder="500.00"
                  />
                </div>
              </div>

              {/* Datum */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Zahlungsdatum *
                </label>
                <input
                  type="date"
                  required
                  value={formData.zahlungsdatum}
                  onChange={(e) => setFormData({...formData, zahlungsdatum: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                />
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Beschreibung
                </label>
                <input
                  type="text"
                  value={formData.beschreibung}
                  onChange={(e) => setFormData({...formData, beschreibung: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                  placeholder="z.B. Vorschuss für Miete"
                />
              </div>

              {/* Uyarı */}
              {formData.zahlungsart === 'vorschuss' && formData.mitarbeiter_id && (
                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl">
                  <AlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm">
                    <p className="font-medium text-orange-800">Hinweis</p>
                    <p className="text-orange-700">
                      Dieser Vorschuss wird automatisch vom Gehalt für {getMonthName(selectedMonth)} abgezogen.
                    </p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
                >
                  {saving ? 'Speichern...' : 'Zahlung erfassen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
