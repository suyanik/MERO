'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mitarbeiter, Zahlung, Dokument, Urlaub } from '@/types/database'
import {
  X,
  Euro,
  Calendar,
  FileText,
  TrendingDown,
  TrendingUp,
  Wallet,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Sun,
  Thermometer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface MitarbeiterDetailProps {
  mitarbeiter: Mitarbeiter
  onClose: () => void
}

export default function MitarbeiterDetail({ mitarbeiter, onClose }: MitarbeiterDetailProps) {
  const [zahlungen, setZahlungen] = useState<Zahlung[]>([])
  const [dokumente, setDokumente] = useState<Dokument[]>([])
  const [urlaube, setUrlaube] = useState<Urlaub[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchData()
  }, [selectedYear])

  async function fetchData() {
    setLoading(true)

    // Zahlungen (seçili yıl)
    const { data: zahlungenData } = await supabase
      .from('zahlungen')
      .select('*')
      .eq('mitarbeiter_id', mitarbeiter.id)
      .gte('zahlungsdatum', `${selectedYear}-01-01`)
      .lte('zahlungsdatum', `${selectedYear}-12-31`)
      .order('zahlungsdatum', { ascending: false })

    // Dokumente
    const { data: dokumenteData } = await supabase
      .from('dokumente')
      .select('*')
      .eq('mitarbeiter_id', mitarbeiter.id)

    // Urlaub (seçili yıl)
    const { data: urlaubData } = await supabase
      .from('urlaub')
      .select('*')
      .eq('mitarbeiter_id', mitarbeiter.id)
      .gte('startdatum', `${selectedYear}-01-01`)
      .lte('startdatum', `${selectedYear}-12-31`)

    setZahlungen(zahlungenData || [])
    setDokumente(dokumenteData || [])
    setUrlaube(urlaubData || [])
    setLoading(false)
  }

  // Yıllık hesaplamalar
  const jahresGehalt = mitarbeiter.grundgehalt * 12
  const totalVorschuss = zahlungen
    .filter(z => z.zahlungsart === 'vorschuss')
    .reduce((sum, z) => sum + z.betrag, 0)
  const totalBonus = zahlungen
    .filter(z => z.zahlungsart === 'bonus')
    .reduce((sum, z) => sum + z.betrag, 0)
  const totalAusgezahlt = jahresGehalt - totalVorschuss + totalBonus

  // Aylık detay
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0')
    const monthKey = `${selectedYear}-${month}`
    const monthZahlungen = zahlungen.filter(z => z.zahlungsmonat === monthKey)

    const vorschuss = monthZahlungen
      .filter(z => z.zahlungsart === 'vorschuss')
      .reduce((sum, z) => sum + z.betrag, 0)
    const bonus = monthZahlungen
      .filter(z => z.zahlungsart === 'bonus')
      .reduce((sum, z) => sum + z.betrag, 0)

    return {
      month: new Date(selectedYear, i).toLocaleDateString('de-DE', { month: 'short' }),
      grundgehalt: mitarbeiter.grundgehalt,
      vorschuss,
      bonus,
      auszahlung: mitarbeiter.grundgehalt - vorschuss + bonus
    }
  })

  // İzin hesaplamaları
  const jahresurlaub = urlaube
    .filter(u => u.urlaubsart === 'jahresurlaub' && u.status === 'genehmigt')
    .reduce((sum, u) => sum + (u.gesamttage || 0), 0)
  const krankheitstage = urlaube
    .filter(u => u.urlaubsart === 'krankheit' && u.status === 'genehmigt')
    .reduce((sum, u) => sum + (u.gesamttage || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
              {mitarbeiter.vorname[0]}{mitarbeiter.nachname[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{mitarbeiter.vorname} {mitarbeiter.nachname}</h2>
              <p className="text-white/80">{mitarbeiter.position}</p>
            </div>
          </div>

          {/* Kişisel Bilgiler */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            {mitarbeiter.telefon && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg">
                <Phone size={14} />
                <span>{mitarbeiter.telefon}</span>
              </div>
            )}
            {mitarbeiter.email && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg">
                <Mail size={14} />
                <span>{mitarbeiter.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg">
              <Briefcase size={14} />
              <span>Seit {new Date(mitarbeiter.eintrittsdatum).toLocaleDateString('de-DE')}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Yıl Seçici */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => setSelectedYear(y => y - 1)}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-xl font-bold text-slate-900">{selectedYear}</span>
            <button
              onClick={() => setSelectedYear(y => y + 1)}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Yıllık Özet Kartları */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Euro className="text-blue-600" size={20} />
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm">Jahresgehalt</p>
                  <p className="text-xl font-bold text-slate-900">{jahresGehalt.toLocaleString('de-DE')} €</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <TrendingDown className="text-orange-600" size={20} />
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm">Vorschüsse</p>
                  <p className="text-xl font-bold text-orange-600">-{totalVorschuss.toLocaleString('de-DE')} €</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-green-600" size={20} />
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm">Boni</p>
                  <p className="text-xl font-bold text-green-600">+{totalBonus.toLocaleString('de-DE')} €</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Wallet className="text-purple-600" size={20} />
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm">Gesamt ausgezahlt</p>
                  <p className="text-xl font-bold text-slate-900">{totalAusgezahlt.toLocaleString('de-DE')} €</p>
                </div>
              </div>

              {/* İzin Özeti */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Sun className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Jahresurlaub</p>
                    <p className="text-2xl font-bold text-slate-900">{jahresurlaub} Tage</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Thermometer className="text-red-600" size={24} />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Krankheitstage</p>
                    <p className="text-2xl font-bold text-slate-900">{krankheitstage} Tage</p>
                  </div>
                </div>
              </div>

              {/* Aylık Detay Tablosu */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">Monatliche Übersicht {selectedYear}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-3 font-semibold text-slate-600">Monat</th>
                        <th className="text-right p-3 font-semibold text-slate-600">Grundgehalt</th>
                        <th className="text-right p-3 font-semibold text-slate-600">Vorschuss</th>
                        <th className="text-right p-3 font-semibold text-slate-600">Bonus</th>
                        <th className="text-right p-3 font-semibold text-slate-600">Auszahlung</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((data, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="p-3 font-medium text-slate-900">{data.month}</td>
                          <td className="p-3 text-right text-slate-600">{data.grundgehalt.toLocaleString('de-DE')} €</td>
                          <td className="p-3 text-right text-orange-600">
                            {data.vorschuss > 0 ? `-${data.vorschuss.toLocaleString('de-DE')} €` : '-'}
                          </td>
                          <td className="p-3 text-right text-green-600">
                            {data.bonus > 0 ? `+${data.bonus.toLocaleString('de-DE')} €` : '-'}
                          </td>
                          <td className="p-3 text-right font-semibold text-slate-900">{data.auszahlung.toLocaleString('de-DE')} €</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-semibold">
                      <tr>
                        <td className="p-3">Gesamt</td>
                        <td className="p-3 text-right">{jahresGehalt.toLocaleString('de-DE')} €</td>
                        <td className="p-3 text-right text-orange-600">-{totalVorschuss.toLocaleString('de-DE')} €</td>
                        <td className="p-3 text-right text-green-600">+{totalBonus.toLocaleString('de-DE')} €</td>
                        <td className="p-3 text-right text-slate-900">{totalAusgezahlt.toLocaleString('de-DE')} €</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Belgeler */}
              {dokumente.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900">Dokumente ({dokumente.length})</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {dokumente.map(dok => {
                      const isExpired = dok.ablaufdatum && new Date(dok.ablaufdatum) < new Date()
                      return (
                        <div key={dok.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText size={20} className={isExpired ? 'text-red-500' : 'text-slate-400'} />
                            <span className="text-slate-900">{dok.dokumentname || dok.dokumenttyp}</span>
                          </div>
                          {dok.ablaufdatum && (
                            <span className={`text-sm ${isExpired ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                              {isExpired ? 'Abgelaufen: ' : 'Gültig bis: '}
                              {new Date(dok.ablaufdatum).toLocaleDateString('de-DE')}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
