'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mitarbeiter, Urlaub } from '@/types/database'
import {
  Plus,
  X,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Sun,
  Thermometer,
  UserX,
  HelpCircle,
  Trash2,
  Filter
} from 'lucide-react'

interface UrlaubProps {
  mitarbeiter: Mitarbeiter[]
  onUpdate: () => void
}

export default function UrlaubComponent({ mitarbeiter, onUpdate }: UrlaubProps) {
  const [urlaube, setUrlaube] = useState<Urlaub[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'alle' | 'ausstehend' | 'genehmigt' | 'abgelehnt'>('alle')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [formData, setFormData] = useState({
    mitarbeiter_id: '',
    urlaubsart: 'jahresurlaub' as Urlaub['urlaubsart'],
    startdatum: '',
    enddatum: '',
    notizen: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUrlaube()
  }, [selectedYear])

  async function fetchUrlaube() {
    setLoading(true)
    const startOfYear = `${selectedYear}-01-01`
    const endOfYear = `${selectedYear}-12-31`

    const { data, error } = await supabase
      .from('urlaub')
      .select('*')
      .gte('startdatum', startOfYear)
      .lte('startdatum', endOfYear)
      .order('startdatum', { ascending: false })

    if (error) {
      console.error('Fehler:', error)
    } else {
      setUrlaube(data || [])
    }
    setLoading(false)
  }

  function calculateDays(start: string, end: string): number {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const gesamttage = calculateDays(formData.startdatum, formData.enddatum)

    const { error } = await supabase
      .from('urlaub')
      .insert([{
        mitarbeiter_id: formData.mitarbeiter_id,
        urlaubsart: formData.urlaubsart,
        startdatum: formData.startdatum,
        enddatum: formData.enddatum,
        gesamttage,
        status: 'ausstehend',
        notizen: formData.notizen || null
      }])

    if (error) {
      alert('Fehler beim Speichern: ' + error.message)
    } else {
      setShowModal(false)
      setFormData({
        mitarbeiter_id: '',
        urlaubsart: 'jahresurlaub',
        startdatum: '',
        enddatum: '',
        notizen: ''
      })
      fetchUrlaube()
      onUpdate()
    }
    setSaving(false)
  }

  async function updateStatus(id: string, status: 'genehmigt' | 'abgelehnt') {
    const { error } = await supabase
      .from('urlaub')
      .update({ status })
      .eq('id', id)

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      fetchUrlaube()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Möchten Sie diesen Urlaubsantrag wirklich löschen?')) return

    const { error } = await supabase
      .from('urlaub')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Fehler beim Löschen: ' + error.message)
    } else {
      fetchUrlaube()
    }
  }

  function getUrlaubsartStyle(art: string) {
    switch (art) {
      case 'jahresurlaub':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: Sun, label: 'Jahresurlaub' }
      case 'krankheit':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: Thermometer, label: 'Krankheit' }
      case 'sonderurlaub':
        return { bg: 'bg-purple-100', text: 'text-purple-700', icon: Calendar, label: 'Sonderurlaub' }
      case 'unbezahlt':
        return { bg: 'bg-orange-100', text: 'text-orange-700', icon: UserX, label: 'Unbezahlt' }
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-700', icon: HelpCircle, label: 'Sonstiges' }
    }
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case 'genehmigt':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Genehmigt' }
      case 'abgelehnt':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Abgelehnt' }
      default:
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Ausstehend' }
    }
  }

  function getMitarbeiterName(id: string) {
    const m = mitarbeiter.find(x => x.id === id)
    return m ? `${m.vorname} ${m.nachname}` : 'Unbekannt'
  }

  function getMitarbeiterInitials(id: string) {
    const m = mitarbeiter.find(x => x.id === id)
    return m ? `${m.vorname[0]}${m.nachname[0]}` : '??'
  }

  // Personel bazında izin özeti
  function getMitarbeiterUrlaubSummary(mId: string) {
    const personalUrlaube = urlaube.filter(u => u.mitarbeiter_id === mId && u.status === 'genehmigt')
    const jahresurlaub = personalUrlaube
      .filter(u => u.urlaubsart === 'jahresurlaub')
      .reduce((sum, u) => sum + (u.gesamttage || 0), 0)
    const krankheit = personalUrlaube
      .filter(u => u.urlaubsart === 'krankheit')
      .reduce((sum, u) => sum + (u.gesamttage || 0), 0)
    return { jahresurlaub, krankheit }
  }

  // Filter
  const filteredUrlaube = urlaube.filter(u => {
    if (filter === 'alle') return true
    return u.status === filter
  })

  // İstatistikler
  const stats = {
    ausstehend: urlaube.filter(u => u.status === 'ausstehend').length,
    genehmigt: urlaube.filter(u => u.status === 'genehmigt').length,
    abgelehnt: urlaube.filter(u => u.status === 'abgelehnt').length,
    total: urlaube.length
  }

  // Şu an izinde olan personel
  const today = new Date().toISOString().split('T')[0]
  const currentlyOnLeave = urlaube.filter(u =>
    u.status === 'genehmigt' &&
    u.startdatum <= today &&
    u.enddatum >= today
  )

  const aktiveMitarbeiter = mitarbeiter.filter(m => m.aktiv)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
              Urlaubsverwaltung
            </h2>
            <p className="text-slate-500 mt-1">
              Urlaub, Krankheit und Abwesenheiten verwalten
            </p>
          </div>
          <div className="flex gap-3">
            {/* Yıl Seçici */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {[2024, 2025, 2026, 2027].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Neuer Antrag</span>
            </button>
          </div>
        </div>
      </div>

      {/* Şu an izinde olanlar */}
      {currentlyOnLeave.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Sun size={24} />
            <h3 className="text-lg font-bold">Heute abwesend ({currentlyOnLeave.length})</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {currentlyOnLeave.map(u => {
              const artStyle = getUrlaubsartStyle(u.urlaubsart)
              return (
                <div key={u.id} className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center text-sm font-bold">
                    {getMitarbeiterInitials(u.mitarbeiter_id)}
                  </div>
                  <div>
                    <p className="font-medium">{getMitarbeiterName(u.mitarbeiter_id)}</p>
                    <p className="text-white/80 text-xs">{artStyle.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div
          onClick={() => setFilter('alle')}
          className={`bg-white rounded-2xl p-4 lg:p-6 shadow-sm border-2 cursor-pointer transition-all ${
            filter === 'alle' ? 'border-blue-500' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Gesamt</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setFilter('ausstehend')}
          className={`bg-white rounded-2xl p-4 lg:p-6 shadow-sm border-2 cursor-pointer transition-all ${
            filter === 'ausstehend' ? 'border-yellow-500' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Ausstehend</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.ausstehend}</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setFilter('genehmigt')}
          className={`bg-white rounded-2xl p-4 lg:p-6 shadow-sm border-2 cursor-pointer transition-all ${
            filter === 'genehmigt' ? 'border-green-500' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Genehmigt</p>
              <p className="text-2xl font-bold text-green-600">{stats.genehmigt}</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setFilter('abgelehnt')}
          className={`bg-white rounded-2xl p-4 lg:p-6 shadow-sm border-2 cursor-pointer transition-all ${
            filter === 'abgelehnt' ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Abgelehnt</p>
              <p className="text-2xl font-bold text-red-600">{stats.abgelehnt}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Personel İzin Özeti */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <h3 className="font-semibold text-slate-900 mb-4">Urlaubsübersicht {selectedYear}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {aktiveMitarbeiter.map(m => {
            const summary = getMitarbeiterUrlaubSummary(m.id)
            return (
              <div key={m.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {m.vorname[0]}{m.nachname[0]}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 text-sm">{m.vorname} {m.nachname}</p>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Sun size={12} className="text-blue-500" />
                      {summary.jahresurlaub} Tage
                    </span>
                    <span className="flex items-center gap-1">
                      <Thermometer size={12} className="text-red-500" />
                      {summary.krankheit} Tage
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Urlaub Liste */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">
            {filter === 'alle' && 'Alle Anträge'}
            {filter === 'ausstehend' && 'Ausstehende Anträge'}
            {filter === 'genehmigt' && 'Genehmigte Anträge'}
            {filter === 'abgelehnt' && 'Abgelehnte Anträge'}
            {' '}({filteredUrlaube.length})
          </h3>
        </div>

        {filteredUrlaube.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-slate-400" size={32} />
            </div>
            <p className="text-slate-500">Keine Anträge gefunden</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredUrlaube.map((u) => {
              const artStyle = getUrlaubsartStyle(u.urlaubsart)
              const statusStyle = getStatusStyle(u.status)
              const ArtIcon = artStyle.icon
              const StatusIcon = statusStyle.icon

              return (
                <div key={u.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 ${artStyle.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <ArtIcon size={24} className={artStyle.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">
                            {getMitarbeiterName(u.mitarbeiter_id)}
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${artStyle.bg} ${artStyle.text}`}>
                            {artStyle.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            {statusStyle.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {new Date(u.startdatum).toLocaleDateString('de-DE')} - {new Date(u.enddatum).toLocaleDateString('de-DE')}
                          <span className="font-medium"> ({u.gesamttage} Tage)</span>
                        </p>
                        {u.notizen && (
                          <p className="text-sm text-slate-400 mt-1">{u.notizen}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      {u.status === 'ausstehend' && (
                        <>
                          <button
                            onClick={() => updateStatus(u.id, 'genehmigt')}
                            className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                          >
                            <CheckCircle size={16} />
                            <span className="hidden sm:inline">Genehmigen</span>
                          </button>
                          <button
                            onClick={() => updateStatus(u.id, 'abgelehnt')}
                            className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                          >
                            <XCircle size={16} />
                            <span className="hidden sm:inline">Ablehnen</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="border-b border-slate-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Neuer Urlaubsantrag</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Mitarbeiter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mitarbeiter *
                </label>
                <select
                  required
                  value={formData.mitarbeiter_id}
                  onChange={(e) => setFormData({...formData, mitarbeiter_id: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Bitte auswählen...</option>
                  {aktiveMitarbeiter.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.vorname} {m.nachname}
                    </option>
                  ))}
                </select>
              </div>

              {/* Urlaubsart */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Art der Abwesenheit *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'jahresurlaub', label: 'Jahresurlaub', icon: Sun, color: 'blue' },
                    { value: 'krankheit', label: 'Krankheit', icon: Thermometer, color: 'red' },
                    { value: 'sonderurlaub', label: 'Sonderurlaub', icon: Calendar, color: 'purple' },
                    { value: 'unbezahlt', label: 'Unbezahlt', icon: UserX, color: 'orange' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({...formData, urlaubsart: option.value as any})}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                        formData.urlaubsart === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50`
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <option.icon size={18} className={
                        formData.urlaubsart === option.value ? `text-${option.color}-600` : 'text-slate-400'
                      } />
                      <span className={`text-sm font-medium ${
                        formData.urlaubsart === option.value ? 'text-slate-900' : 'text-slate-600'
                      }`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tarihler */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Von *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startdatum}
                    onChange={(e) => setFormData({...formData, startdatum: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bis *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.enddatum}
                    min={formData.startdatum}
                    onChange={(e) => setFormData({...formData, enddatum: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Gün hesaplama */}
              {formData.startdatum && formData.enddatum && (
                <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                  <Calendar className="text-blue-600" size={20} />
                  <span className="text-blue-800 font-medium">
                    {calculateDays(formData.startdatum, formData.enddatum)} Tage
                  </span>
                </div>
              )}

              {/* Notizen */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notizen
                </label>
                <textarea
                  value={formData.notizen}
                  onChange={(e) => setFormData({...formData, notizen: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="z.B. Grund für Sonderurlaub..."
                />
              </div>

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
                  {saving ? 'Speichern...' : 'Antrag erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
