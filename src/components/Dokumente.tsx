'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mitarbeiter, Dokument } from '@/types/database'
import {
  Plus,
  X,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  Eye,
  Trash2,
  CreditCard,
  Car,
  User,
  FileCheck,
  Camera
} from 'lucide-react'

interface DokumenteProps {
  mitarbeiter: Mitarbeiter[]
  onUpdate: () => void
}

export default function Dokumente({ mitarbeiter, onUpdate }: DokumenteProps) {
  const [dokumente, setDokumente] = useState<(Dokument & { datei_inhalt?: string, datei_typ?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState<string | null>(null)
  const [filter, setFilter] = useState<'alle' | 'warnung' | 'abgelaufen'>('alle')
  const [formData, setFormData] = useState({
    mitarbeiter_id: '',
    dokumenttyp: 'fuehrerschein' as Dokument['dokumenttyp'],
    dokumentname: '',
    ablaufdatum: '',
    notizen: '',
    datei: null as File | null,
    dateiPreview: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDokumente()
  }, [])

  async function fetchDokumente() {
    setLoading(true)
    const { data, error } = await supabase
      .from('dokumente')
      .select('*')
      .order('ablaufdatum', { ascending: true })

    if (error) {
      console.error('Fehler:', error)
    } else {
      setDokumente(data || [])
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    let dateiInhalt = null
    let dateiTyp = null

    if (formData.datei) {
      const reader = new FileReader()
      dateiInhalt = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(formData.datei!)
      })
      dateiTyp = formData.datei.type
    }

    const { error } = await supabase
      .from('dokumente')
      .insert([{
        mitarbeiter_id: formData.mitarbeiter_id,
        dokumenttyp: formData.dokumenttyp,
        dokumentname: formData.dokumentname || getDokumentTypLabel(formData.dokumenttyp),
        ablaufdatum: formData.ablaufdatum || null,
        notizen: formData.notizen || null,
        datei_inhalt: dateiInhalt,
        datei_typ: dateiTyp
      }])

    if (error) {
      alert('Fehler beim Speichern: ' + error.message)
    } else {
      setShowModal(false)
      setFormData({
        mitarbeiter_id: '',
        dokumenttyp: 'fuehrerschein',
        dokumentname: '',
        ablaufdatum: '',
        notizen: '',
        datei: null,
        dateiPreview: ''
      })
      fetchDokumente()
      onUpdate()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Möchten Sie dieses Dokument wirklich löschen?')) return

    const { error } = await supabase
      .from('dokumente')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Fehler beim Löschen: ' + error.message)
    } else {
      fetchDokumente()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Datei ist zu groß. Maximal 5 MB erlaubt.')
        return
      }
      setFormData({ ...formData, datei: file })

      // Preview oluştur
      const reader = new FileReader()
      reader.onload = () => {
        setFormData(prev => ({ ...prev, dateiPreview: reader.result as string }))
      }
      reader.readAsDataURL(file)
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

  function getDokumentTypIcon(typ: string) {
    const icons: Record<string, any> = {
      fuehrerschein: Car,
      reisepass: FileText,
      src: CreditCard,
      personalausweis: User,
      gesundheitszeugnis: FileCheck,
      sonstiges: FileText
    }
    return icons[typ] || FileText
  }

  function getExpiryStatus(ablaufdatum: string | null) {
    if (!ablaufdatum) return { status: 'keine', color: 'slate', label: 'Kein Ablaufdatum' }

    const today = new Date()
    const expiry = new Date(ablaufdatum)
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { status: 'abgelaufen', color: 'red', label: 'Abgelaufen', icon: AlertTriangle }
    } else if (diffDays <= 30) {
      return { status: 'warnung', color: 'orange', label: `Läuft in ${diffDays} Tagen ab`, icon: Clock }
    } else if (diffDays <= 90) {
      return { status: 'bald', color: 'yellow', label: `Läuft in ${diffDays} Tagen ab`, icon: Clock }
    } else {
      return { status: 'ok', color: 'green', label: 'Gültig', icon: CheckCircle }
    }
  }

  function getMitarbeiterName(id: string) {
    const m = mitarbeiter.find(x => x.id === id)
    return m ? `${m.vorname} ${m.nachname}` : 'Unbekannt'
  }

  // Filter uygula
  const filteredDokumente = dokumente.filter(d => {
    if (filter === 'alle') return true
    const status = getExpiryStatus(d.ablaufdatum)
    if (filter === 'warnung') return status.status === 'warnung' || status.status === 'bald'
    if (filter === 'abgelaufen') return status.status === 'abgelaufen'
    return true
  })

  // İstatistikler
  const stats = {
    total: dokumente.length,
    abgelaufen: dokumente.filter(d => getExpiryStatus(d.ablaufdatum).status === 'abgelaufen').length,
    warnung: dokumente.filter(d => ['warnung', 'bald'].includes(getExpiryStatus(d.ablaufdatum).status)).length,
    ok: dokumente.filter(d => getExpiryStatus(d.ablaufdatum).status === 'ok').length
  }

  const aktiveMitarbeiter = mitarbeiter.filter(m => m.aktiv)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
              Dokumentenverwaltung
            </h2>
            <p className="text-slate-500 mt-1">
              Führerscheine, Pässe und wichtige Dokumente
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
          >
            <Plus size={20} />
            <span>Neues Dokument</span>
          </button>
        </div>
      </div>

      {/* Uyarı Banner - Süresi dolan belgeler varsa */}
      {stats.abgelaufen > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div>
            <p className="font-semibold text-red-800">Achtung: {stats.abgelaufen} abgelaufene Dokumente!</p>
            <p className="text-red-600 text-sm">Bitte erneuern Sie die abgelaufenen Dokumente so schnell wie möglich.</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div
          onClick={() => setFilter('alle')}
          className={`bg-white rounded-2xl p-4 lg:p-6 shadow-sm border-2 cursor-pointer transition-all ${
            filter === 'alle' ? 'border-blue-500' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Gesamt</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setFilter('abgelaufen')}
          className={`bg-white rounded-2xl p-4 lg:p-6 shadow-sm border-2 cursor-pointer transition-all ${
            filter === 'abgelaufen' ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Abgelaufen</p>
              <p className="text-2xl font-bold text-red-600">{stats.abgelaufen}</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setFilter('warnung')}
          className={`bg-white rounded-2xl p-4 lg:p-6 shadow-sm border-2 cursor-pointer transition-all ${
            filter === 'warnung' ? 'border-orange-500' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Bald ablaufend</p>
              <p className="text-2xl font-bold text-orange-600">{stats.warnung}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border-2 border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Gültig</p>
              <p className="text-2xl font-bold text-green-600">{stats.ok}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dokumente Liste */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">
            {filter === 'alle' && 'Alle Dokumente'}
            {filter === 'warnung' && 'Bald ablaufende Dokumente'}
            {filter === 'abgelaufen' && 'Abgelaufene Dokumente'}
            {' '}({filteredDokumente.length})
          </h3>
        </div>

        {filteredDokumente.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-slate-400" size={32} />
            </div>
            <p className="text-slate-500">Keine Dokumente gefunden</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDokumente.map((dok) => {
              const Icon = getDokumentTypIcon(dok.dokumenttyp)
              const expiryStatus = getExpiryStatus(dok.ablaufdatum)
              const StatusIcon = expiryStatus.icon || CheckCircle

              return (
                <div key={dok.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Dokument Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      expiryStatus.status === 'abgelaufen' ? 'bg-red-100' :
                      expiryStatus.status === 'warnung' ? 'bg-orange-100' :
                      expiryStatus.status === 'bald' ? 'bg-yellow-100' :
                      'bg-slate-100'
                    }`}>
                      <Icon size={24} className={
                        expiryStatus.status === 'abgelaufen' ? 'text-red-600' :
                        expiryStatus.status === 'warnung' ? 'text-orange-600' :
                        expiryStatus.status === 'bald' ? 'text-yellow-600' :
                        'text-slate-600'
                      } />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900">
                          {dok.dokumentname || getDokumentTypLabel(dok.dokumenttyp)}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          expiryStatus.status === 'abgelaufen' ? 'bg-red-100 text-red-700' :
                          expiryStatus.status === 'warnung' ? 'bg-orange-100 text-orange-700' :
                          expiryStatus.status === 'bald' ? 'bg-yellow-100 text-yellow-700' :
                          expiryStatus.status === 'ok' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {expiryStatus.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {getMitarbeiterName(dok.mitarbeiter_id)}
                        {dok.ablaufdatum && (
                          <> • Gültig bis: {new Date(dok.ablaufdatum).toLocaleDateString('de-DE')}</>
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {dok.datei_inhalt && (
                        <button
                          onClick={() => setShowPreview(dok.datei_inhalt!)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Vorschau"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(dok.id)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Löschen"
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

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-900">Neues Dokument hochladen</h3>
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
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                >
                  <option value="">Bitte auswählen...</option>
                  {aktiveMitarbeiter.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.vorname} {m.nachname}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dokumenttyp */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dokumenttyp *
                </label>
                <select
                  required
                  value={formData.dokumenttyp}
                  onChange={(e) => setFormData({...formData, dokumenttyp: e.target.value as any})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                >
                  <option value="fuehrerschein">Führerschein</option>
                  <option value="reisepass">Reisepass</option>
                  <option value="personalausweis">Personalausweis</option>
                  <option value="src">SRC-Karte</option>
                  <option value="gesundheitszeugnis">Gesundheitszeugnis</option>
                  <option value="sonstiges">Sonstiges</option>
                </select>
              </div>

              {/* Dokumentname */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dokumentname
                </label>
                <input
                  type="text"
                  value={formData.dokumentname}
                  onChange={(e) => setFormData({...formData, dokumentname: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                  placeholder="z.B. Führerschein Klasse CE"
                />
              </div>

              {/* Ablaufdatum */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ablaufdatum
                </label>
                <input
                  type="date"
                  value={formData.ablaufdatum}
                  onChange={(e) => setFormData({...formData, ablaufdatum: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                />
              </div>

              {/* Datei Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dokument-Scan (max. 5 MB)
                </label>

                {formData.dateiPreview ? (
                  <div className="border-2 border-slate-200 rounded-xl p-6 text-center">
                    <div className="space-y-3">
                      {formData.datei?.type.startsWith('image/') ? (
                        <img
                          src={formData.dateiPreview}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
                          <FileText className="text-blue-600" size={32} />
                        </div>
                      )}
                      <p className="text-sm text-slate-600">{formData.datei?.name}</p>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, datei: null, dateiPreview: ''})}
                        className="text-red-600 text-sm hover:underline"
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Kamera */}
                    <label className="cursor-pointer border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Camera className="text-blue-600" size={24} />
                      </div>
                      <p className="text-slate-700 font-medium text-sm">Kamera</p>
                      <p className="text-slate-400 text-xs mt-1">Foto aufnehmen</p>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {/* Datei auswählen */}
                    <label className="cursor-pointer border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Upload className="text-slate-600" size={24} />
                      </div>
                      <p className="text-slate-700 font-medium text-sm">Datei</p>
                      <p className="text-slate-400 text-xs mt-1">Aus Galerie</p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Notizen */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notizen
                </label>
                <textarea
                  value={formData.notizen}
                  onChange={(e) => setFormData({...formData, notizen: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400 resize-none"
                  placeholder="Zusätzliche Informationen..."
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
                  {saving ? 'Hochladen...' : 'Dokument speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setShowPreview(null)}
          />
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto">
            <button
              onClick={() => setShowPreview(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-slate-100 transition-colors z-10"
            >
              <X size={20} />
            </button>
            {showPreview.startsWith('data:image') ? (
              <img src={showPreview} alt="Dokument" className="rounded-lg" />
            ) : (
              <iframe
                src={showPreview}
                className="w-full h-[80vh] rounded-lg bg-white"
                title="Dokument Vorschau"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
