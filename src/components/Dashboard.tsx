'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Mitarbeiter, Zahlung, Dokument, Urlaub } from '@/types/database'
import {
  Users,
  CreditCard,
  FileText,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  Sun,
  Euro,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Thermometer,
  Car,
  FileCheck
} from 'lucide-react'

interface DashboardProps {
  mitarbeiter: Mitarbeiter[]
  onNavigate: (tab: string) => void
}

export default function Dashboard({ mitarbeiter, onNavigate }: DashboardProps) {
  const [zahlungen, setZahlungen] = useState<Zahlung[]>([])
  const [dokumente, setDokumente] = useState<Dokument[]>([])
  const [urlaube, setUrlaube] = useState<Urlaub[]>([])
  const [jahresZahlungen, setJahresZahlungen] = useState<Zahlung[]>([])
  const [loading, setLoading] = useState(true)

  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchAllData()
  }, [])

  async function fetchAllData() {
    setLoading(true)

    // Zahlungen (bu ay)
    const { data: zahlungenData } = await supabase
      .from('zahlungen')
      .select('*')
      .eq('zahlungsmonat', currentMonth)

    // Dokumente (tümü)
    const { data: dokumenteData } = await supabase
      .from('dokumente')
      .select('*')
      .order('ablaufdatum', { ascending: true })

    // Urlaub (bu yıl)
    const { data: urlaubData } = await supabase
      .from('urlaub')
      .select('*')
      .gte('startdatum', `${new Date().getFullYear()}-01-01`)

    setZahlungen(zahlungenData || [])
    setDokumente(dokumenteData || [])
    setUrlaube(urlaubData || [])

    // Tüm yıl zahlungen (grafik için)
    const { data: jahresData } = await supabase
      .from('zahlungen')
      .select('*')
      .gte('zahlungsdatum', `${new Date().getFullYear()}-01-01`)
      .lte('zahlungsdatum', `${new Date().getFullYear()}-12-31`)

    setJahresZahlungen(jahresData || [])
    setLoading(false)
  }

  // Hesaplamalar
  const aktiveMitarbeiter = mitarbeiter.filter(m => m.aktiv)

  // Bugün izinde olanlar
  const todayOnLeave = urlaube.filter(u =>
    u.status === 'genehmigt' &&
    u.startdatum <= today &&
    u.enddatum >= today
  )

  // Bekleyen izin talepleri
  const pendingLeaves = urlaube.filter(u => u.status === 'ausstehend')

  // Süresi dolan/dolacak belgeler
  const expiringDocs = dokumente.filter(d => {
    if (!d.ablaufdatum) return false
    const diffDays = Math.ceil((new Date(d.ablaufdatum).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 30
  })

  const expiredDocs = dokumente.filter(d => {
    if (!d.ablaufdatum) return false
    return new Date(d.ablaufdatum) < new Date()
  })

  // Bu ayki maaş hesaplamaları
  const totalGehalt = aktiveMitarbeiter.reduce((sum, m) => sum + m.grundgehalt, 0)
  const totalVorschuss = zahlungen
    .filter(z => z.zahlungsart === 'vorschuss')
    .reduce((sum, z) => sum + z.betrag, 0)
  const totalBonus = zahlungen
    .filter(z => z.zahlungsart === 'bonus')
    .reduce((sum, z) => sum + z.betrag, 0)
  const totalAuszahlung = totalGehalt - totalVorschuss + totalBonus

  // Aylık grafik verisi
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0')
    const monthKey = `${new Date().getFullYear()}-${month}`

    const monthZahlungen = jahresZahlungen.filter(z => z.zahlungsmonat === monthKey)
    const vorschuss = monthZahlungen
      .filter(z => z.zahlungsart === 'vorschuss')
      .reduce((sum, z) => sum + z.betrag, 0)
    const bonus = monthZahlungen
      .filter(z => z.zahlungsart === 'bonus')
      .reduce((sum, z) => sum + z.betrag, 0)

    const grundgehalt = aktiveMitarbeiter.reduce((sum, m) => sum + m.grundgehalt, 0)

    return {
      name: new Date(2024, i).toLocaleDateString('de-DE', { month: 'short' }),
      Gehalt: grundgehalt,
      Vorschuss: vorschuss,
      Bonus: bonus,
      Auszahlung: grundgehalt - vorschuss + bonus
    }
  })

  // Yardımcı fonksiyonlar
  function getMitarbeiterName(id: string) {
    const m = mitarbeiter.find(x => x.id === id)
    return m ? `${m.vorname} ${m.nachname}` : 'Unbekannt'
  }

  function getMitarbeiterInitials(id: string) {
    const m = mitarbeiter.find(x => x.id === id)
    return m ? `${m.vorname[0]}${m.nachname[0]}` : '??'
  }

  function getUrlaubsartIcon(art: string) {
    switch (art) {
      case 'jahresurlaub': return Sun
      case 'krankheit': return Thermometer
      default: return Calendar
    }
  }

  function getDokumentTypIcon(typ: string) {
    switch (typ) {
      case 'fuehrerschein': return Car
      case 'gesundheitszeugnis': return FileCheck
      default: return FileText
    }
  }

  function getDokumentTypLabel(typ: string) {
    const labels: Record<string, string> = {
      fuehrerschein: 'Führerschein',
      reisepass: 'Reisepass',
      src: 'SRC-Karte',
      personalausweis: 'Personalausweis',
      gesundheitszeugnis: 'Gesundheitszeugnis',
      sonstiges: 'Sonstiges'
    }
    return labels[typ] || typ
  }

  function getExpiryDays(date: string) {
    const diff = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return `${Math.abs(diff)} Tage abgelaufen`
    if (diff === 0) return 'Heute'
    return `${diff} Tage`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Willkommen zurück! 👋
        </h2>
        <p className="text-slate-500 mt-1">
          Hier ist Ihre Übersicht für heute, {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Uyarılar */}
      {(expiredDocs.length > 0 || pendingLeaves.length > 0) && (
        <div className="space-y-3 mb-8">
          {expiredDocs.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-800">{expiredDocs.length} abgelaufene Dokumente!</p>
                <p className="text-red-600 text-sm">Bitte erneuern Sie die Dokumente umgehend.</p>
              </div>
              <button
                onClick={() => onNavigate('dokumente')}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Anzeigen
              </button>
            </div>
          )}

          {pendingLeaves.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-yellow-800">{pendingLeaves.length} ausstehende Urlaubsanträge</p>
                <p className="text-yellow-600 text-sm">Warten auf Ihre Genehmigung.</p>
              </div>
              <button
                onClick={() => onNavigate('urlaub')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-xl font-medium hover:bg-yellow-700 transition-colors"
              >
                Prüfen
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ana İstatistikler */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div
          onClick={() => onNavigate('mitarbeiter')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
            <ChevronRight className="text-slate-400" size={20} />
          </div>
          <p className="text-slate-500 text-sm">Mitarbeiter</p>
          <p className="text-2xl font-bold text-slate-900">{aktiveMitarbeiter.length}</p>
          <p className="text-green-600 text-xs mt-1">Aktiv</p>
        </div>

        <div
          onClick={() => onNavigate('zahlungen')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Euro className="text-green-600" size={24} />
            </div>
            <ChevronRight className="text-slate-400" size={20} />
          </div>
          <p className="text-slate-500 text-sm">Auszahlung</p>
          <p className="text-2xl font-bold text-slate-900">{totalAuszahlung.toLocaleString('de-DE')}€</p>
          <p className="text-slate-400 text-xs mt-1">Dieser Monat</p>
        </div>

        <div
          onClick={() => onNavigate('dokumente')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              expiredDocs.length > 0 ? 'bg-red-100' : expiringDocs.length > 0 ? 'bg-orange-100' : 'bg-slate-100'
            }`}>
              <FileText className={
                expiredDocs.length > 0 ? 'text-red-600' : expiringDocs.length > 0 ? 'text-orange-600' : 'text-slate-600'
              } size={24} />
            </div>
            <ChevronRight className="text-slate-400" size={20} />
          </div>
          <p className="text-slate-500 text-sm">Dokumente</p>
          <p className="text-2xl font-bold text-slate-900">{dokumente.length}</p>
          {expiredDocs.length > 0 ? (
            <p className="text-red-600 text-xs mt-1">{expiredDocs.length} abgelaufen</p>
          ) : expiringDocs.length > 0 ? (
            <p className="text-orange-600 text-xs mt-1">{expiringDocs.length} bald ablaufend</p>
          ) : (
            <p className="text-green-600 text-xs mt-1">Alle gültig</p>
          )}
        </div>

        <div
          onClick={() => onNavigate('urlaub')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              todayOnLeave.length > 0 ? 'bg-purple-100' : 'bg-slate-100'
            }`}>
              <Calendar className={todayOnLeave.length > 0 ? 'text-purple-600' : 'text-slate-600'} size={24} />
            </div>
            <ChevronRight className="text-slate-400" size={20} />
          </div>
          <p className="text-slate-500 text-sm">Heute abwesend</p>
          <p className="text-2xl font-bold text-slate-900">{todayOnLeave.length}</p>
          <p className="text-slate-400 text-xs mt-1">Mitarbeiter</p>
        </div>
      </div>

      {/* Yıllık Ödeme Grafiği */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-900">Zahlungsübersicht {new Date().getFullYear()}</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-slate-600">Gehalt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-slate-600">Vorschuss</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-slate-600">Bonus</span>
            </div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `${value.toLocaleString('de-DE')}€`} />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString('de-DE')} €`}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="Gehalt" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Vorschuss" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Bonus" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* İki Sütunlu Bölüm */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bu Ay Maaş Özeti */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Gehaltsübersicht</h3>
            <span className="text-sm text-slate-500">
              {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Euro className="text-slate-600" size={18} />
                </div>
                <span className="text-slate-600">Grundgehälter</span>
              </div>
              <span className="font-semibold text-slate-900">{totalGehalt.toLocaleString('de-DE')} €</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="text-orange-600" size={18} />
                </div>
                <span className="text-slate-600">Vorschüsse</span>
              </div>
              <span className="font-semibold text-orange-600">-{totalVorschuss.toLocaleString('de-DE')} €</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-green-600" size={18} />
                </div>
                <span className="text-slate-600">Boni</span>
              </div>
              <span className="font-semibold text-green-600">+{totalBonus.toLocaleString('de-DE')} €</span>
            </div>
            <div className="flex items-center justify-between py-3 bg-slate-50 rounded-xl px-4 -mx-1">
              <span className="font-semibold text-slate-900">Gesamt auszuzahlen</span>
              <span className="font-bold text-xl text-slate-900">{totalAuszahlung.toLocaleString('de-DE')} €</span>
            </div>
          </div>
        </div>

        {/* Bugün İzinde Olanlar + Yaklaşan Belgeler */}
        <div className="space-y-6">
          {/* Bugün İzinde */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Heute abwesend</h3>
              <span className="text-sm text-slate-500">{todayOnLeave.length} Personen</span>
            </div>
            {todayOnLeave.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle className="text-green-500 mx-auto mb-2" size={32} />
                <p className="text-slate-500">Alle Mitarbeiter sind heute da!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {todayOnLeave.slice(0, 5).map(u => {
                  const Icon = getUrlaubsartIcon(u.urlaubsart)
                  return (
                    <div key={u.id} className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                        {getMitarbeiterInitials(u.mitarbeiter_id)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{getMitarbeiterName(u.mitarbeiter_id)}</p>
                        <p className="text-sm text-slate-500">
                          bis {new Date(u.enddatum).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Icon size={16} className="text-slate-600" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Yaklaşan Belge Süreleri */}
          {expiringDocs.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Dokumente prüfen</h3>
                <button
                  onClick={() => onNavigate('dokumente')}
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  Alle anzeigen
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {expiringDocs.slice(0, 4).map(d => {
                  const Icon = getDokumentTypIcon(d.dokumenttyp)
                  const isExpired = new Date(d.ablaufdatum!) < new Date()
                  return (
                    <div key={d.id} className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isExpired ? 'bg-red-100' : 'bg-orange-100'
                      }`}>
                        <Icon size={18} className={isExpired ? 'text-red-600' : 'text-orange-600'} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {getDokumentTypLabel(d.dokumenttyp)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {getMitarbeiterName(d.mitarbeiter_id)}
                        </p>
                      </div>
                      <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                        {getExpiryDays(d.ablaufdatum!)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
