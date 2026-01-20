'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mitarbeiter } from '@/types/database'
import Zahlungen from '@/components/Zahlungen'
import Dokumente from '@/components/Dokumente'
import UrlaubComponent from '@/components/Urlaub'
import Dashboard from '@/components/Dashboard'
import Login from '@/components/Login'
import MitarbeiterDetail from '@/components/MitarbeiterDetail'
import {
  Users,
  CreditCard,
  FileText,
  Calendar,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Menu,
  X,
  ChevronRight,
  Euro,
  LayoutDashboard
} from 'lucide-react'

export default function Home() {
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    vorname: '',
    nachname: '',
    geburtsdatum: '',
    telefon: '',
    email: '',
    adresse: '',
    position: 'Fahrer',
    grundgehalt: '',
    gehalt_jan: '',
    gehalt_feb: '',
    gehalt_mar: '',
    gehalt_apr: '',
    gehalt_mai: '',
    gehalt_jun: '',
    gehalt_jul: '',
    gehalt_aug: '',
    gehalt_sep: '',
    gehalt_okt: '',
    gehalt_nov: '',
    gehalt_dez: '',
    notizen: ''
  })
  const [saving, setSaving] = useState(false)
  const [editingMitarbeiter, setEditingMitarbeiter] = useState<Mitarbeiter | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMitarbeiter, setSelectedMitarbeiter] = useState<Mitarbeiter | null>(null)
  const [editFormData, setEditFormData] = useState({
    vorname: '',
    nachname: '',
    geburtsdatum: '',
    telefon: '',
    email: '',
    adresse: '',
    position: 'Fahrer',
    grundgehalt: '',
    gehalt_jan: '',
    gehalt_feb: '',
    gehalt_mar: '',
    gehalt_apr: '',
    gehalt_mai: '',
    gehalt_jun: '',
    gehalt_jul: '',
    gehalt_aug: '',
    gehalt_sep: '',
    gehalt_okt: '',
    gehalt_nov: '',
    gehalt_dez: '',
    notizen: '',
    aktiv: true
  })

  useEffect(() => {
    // Auth durumunu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
      if (session) {
        fetchMitarbeiter()
      }
    })

    // Auth değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchMitarbeiter()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchMitarbeiter() {
    const { data, error } = await supabase
      .from('mitarbeiter')
      .select('*')
      .order('nachname', { ascending: true })

    if (error) {
      console.error('Fehler:', error)
    } else {
      setMitarbeiter(data || [])
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const grundgehalt = parseFloat(formData.grundgehalt) || 0
    const monatlicheGehaelter = {
      jan: formData.gehalt_jan ? parseFloat(formData.gehalt_jan) : grundgehalt,
      feb: formData.gehalt_feb ? parseFloat(formData.gehalt_feb) : grundgehalt,
      mar: formData.gehalt_mar ? parseFloat(formData.gehalt_mar) : grundgehalt,
      apr: formData.gehalt_apr ? parseFloat(formData.gehalt_apr) : grundgehalt,
      mai: formData.gehalt_mai ? parseFloat(formData.gehalt_mai) : grundgehalt,
      jun: formData.gehalt_jun ? parseFloat(formData.gehalt_jun) : grundgehalt,
      jul: formData.gehalt_jul ? parseFloat(formData.gehalt_jul) : grundgehalt,
      aug: formData.gehalt_aug ? parseFloat(formData.gehalt_aug) : grundgehalt,
      sep: formData.gehalt_sep ? parseFloat(formData.gehalt_sep) : grundgehalt,
      okt: formData.gehalt_okt ? parseFloat(formData.gehalt_okt) : grundgehalt,
      nov: formData.gehalt_nov ? parseFloat(formData.gehalt_nov) : grundgehalt,
      dez: formData.gehalt_dez ? parseFloat(formData.gehalt_dez) : grundgehalt,
    }

    const { error } = await supabase
      .from('mitarbeiter')
      .insert([{
        vorname: formData.vorname,
        nachname: formData.nachname,
        geburtsdatum: formData.geburtsdatum || null,
        telefon: formData.telefon || null,
        email: formData.email || null,
        adresse: formData.adresse || null,
        position: formData.position,
        grundgehalt: grundgehalt,
        monatliches_gehalt: monatlicheGehaelter,
        notizen: formData.notizen || null
      }])

    if (error) {
      alert('Fehler beim Speichern: ' + error.message)
    } else {
      setShowModal(false)
      setFormData({
        vorname: '',
        nachname: '',
        geburtsdatum: '',
        telefon: '',
        email: '',
        adresse: '',
        position: 'Fahrer',
        grundgehalt: '',
        gehalt_jan: '',
        gehalt_feb: '',
        gehalt_mar: '',
        gehalt_apr: '',
        gehalt_mai: '',
        gehalt_jun: '',
        gehalt_jul: '',
        gehalt_aug: '',
        gehalt_sep: '',
        gehalt_okt: '',
        gehalt_nov: '',
        gehalt_dez: '',
        notizen: ''
      })
      fetchMitarbeiter()
    }
    setSaving(false)
  }

  function openEditModal(m: Mitarbeiter) {
    setEditingMitarbeiter(m)
    const mg = m.monatliches_gehalt as any
    setEditFormData({
      vorname: m.vorname,
      nachname: m.nachname,
      geburtsdatum: m.geburtsdatum || '',
      telefon: m.telefon || '',
      email: m.email || '',
      adresse: m.adresse || '',
      position: m.position,
      grundgehalt: m.grundgehalt.toString(),
      gehalt_jan: mg?.jan?.toString() || '',
      gehalt_feb: mg?.feb?.toString() || '',
      gehalt_mar: mg?.mar?.toString() || '',
      gehalt_apr: mg?.apr?.toString() || '',
      gehalt_mai: mg?.mai?.toString() || '',
      gehalt_jun: mg?.jun?.toString() || '',
      gehalt_jul: mg?.jul?.toString() || '',
      gehalt_aug: mg?.aug?.toString() || '',
      gehalt_sep: mg?.sep?.toString() || '',
      gehalt_okt: mg?.okt?.toString() || '',
      gehalt_nov: mg?.nov?.toString() || '',
      gehalt_dez: mg?.dez?.toString() || '',
      notizen: m.notizen || '',
      aktiv: m.aktiv
    })
    setShowEditModal(true)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingMitarbeiter) return
    setSaving(true)

    const grundgehalt = parseFloat(editFormData.grundgehalt) || 0
    const monatlicheGehaelter = {
      jan: editFormData.gehalt_jan ? parseFloat(editFormData.gehalt_jan) : grundgehalt,
      feb: editFormData.gehalt_feb ? parseFloat(editFormData.gehalt_feb) : grundgehalt,
      mar: editFormData.gehalt_mar ? parseFloat(editFormData.gehalt_mar) : grundgehalt,
      apr: editFormData.gehalt_apr ? parseFloat(editFormData.gehalt_apr) : grundgehalt,
      mai: editFormData.gehalt_mai ? parseFloat(editFormData.gehalt_mai) : grundgehalt,
      jun: editFormData.gehalt_jun ? parseFloat(editFormData.gehalt_jun) : grundgehalt,
      jul: editFormData.gehalt_jul ? parseFloat(editFormData.gehalt_jul) : grundgehalt,
      aug: editFormData.gehalt_aug ? parseFloat(editFormData.gehalt_aug) : grundgehalt,
      sep: editFormData.gehalt_sep ? parseFloat(editFormData.gehalt_sep) : grundgehalt,
      okt: editFormData.gehalt_okt ? parseFloat(editFormData.gehalt_okt) : grundgehalt,
      nov: editFormData.gehalt_nov ? parseFloat(editFormData.gehalt_nov) : grundgehalt,
      dez: editFormData.gehalt_dez ? parseFloat(editFormData.gehalt_dez) : grundgehalt,
    }

    const { error } = await supabase
      .from('mitarbeiter')
      .update({
        vorname: editFormData.vorname,
        nachname: editFormData.nachname,
        geburtsdatum: editFormData.geburtsdatum || null,
        telefon: editFormData.telefon || null,
        email: editFormData.email || null,
        adresse: editFormData.adresse || null,
        position: editFormData.position,
        grundgehalt: grundgehalt,
        monatliches_gehalt: monatlicheGehaelter,
        notizen: editFormData.notizen || null,
        aktiv: editFormData.aktiv
      })
      .eq('id', editingMitarbeiter.id)

    if (error) {
      alert('Fehler beim Speichern: ' + error.message)
    } else {
      setShowEditModal(false)
      setEditingMitarbeiter(null)
      fetchMitarbeiter()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Möchten Sie diesen Mitarbeiter wirklich löschen? Alle zugehörigen Daten (Zahlungen, Dokumente, Urlaub) werden ebenfalls gelöscht.')) return

    const { error } = await supabase
      .from('mitarbeiter')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Fehler beim Löschen: ' + error.message)
    } else {
      fetchMitarbeiter()
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setSession(null)
  }

  const filteredMitarbeiter = mitarbeiter.filter(m =>
    `${m.vorname} ${m.nachname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.position.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
    { id: 'mitarbeiter', label: 'Mitarbeiter', icon: Users, count: mitarbeiter.length },
    { id: 'zahlungen', label: 'Zahlungen', icon: CreditCard, count: 0 },
    { id: 'dokumente', label: 'Dokumente', icon: FileText, count: 0 },
    { id: 'urlaub', label: 'Urlaub', icon: Calendar, count: 0 },
  ]

  // Auth yüklenirken
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-lg">Laden...</p>
        </div>
      </div>
    )
  }

  // Giriş yapılmamışsa
  if (!session) {
    return <Login onLogin={() => supabase.auth.getSession().then(({ data: { session } }) => setSession(session))} />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-lg">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile Header */}
      <header className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Users size={20} />
          </div>
          <span className="font-bold text-lg">Personalverwaltung</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-72 bg-slate-900 min-h-screen p-6 fixed left-0 top-0">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Personal</h1>
              <p className="text-slate-400 text-sm">Verwaltungssystem</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 group ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.count !== null && (
                  <span className={`text-sm px-2 py-1 rounded-lg ${
                    activeTab === item.id
                      ? 'bg-white/20'
                      : 'bg-slate-800 group-hover:bg-slate-700'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 mb-3">
              <p className="text-slate-300 text-sm mb-1">Angemeldet als</p>
              <p className="text-white font-semibold text-sm truncate">{session?.user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-slate-800 text-white hover:bg-red-600 rounded-xl transition-colors font-medium"
            >
              Abmelden
            </button>
          </div>
        </aside>

        {/* Sidebar - Mobile Overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 p-6 shadow-2xl">
              <nav className="space-y-2 mt-16">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.count !== null && (
                      <span className="text-sm px-2 py-1 rounded-lg bg-slate-800">
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 p-4 lg:p-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <Dashboard mitarbeiter={mitarbeiter} onNavigate={setActiveTab} />
          )}

          {/* Zahlungen Tab */}
          {activeTab === 'zahlungen' && (
            <Zahlungen mitarbeiter={mitarbeiter} onUpdate={fetchMitarbeiter} />
          )}

          {/* Urlaub Tab */}
          {activeTab === 'urlaub' && (
            <UrlaubComponent mitarbeiter={mitarbeiter} onUpdate={fetchMitarbeiter} />
          )}

          {/* Dokumente Tab */}
          {activeTab === 'dokumente' && (
            <Dokumente mitarbeiter={mitarbeiter} onUpdate={fetchMitarbeiter} />
          )}

          {/* Mitarbeiter Tab */}
          {activeTab === 'mitarbeiter' && (
          <>
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
                  Mitarbeiterliste
                </h2>
                <p className="text-slate-500 mt-1">
                  Verwalten Sie alle Mitarbeiterdaten
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105">
                <Plus size={20} />
                <span>Neuer Mitarbeiter</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="mt-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Mitarbeiter suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Gesamt</p>
                  <p className="text-2xl font-bold text-slate-900">{mitarbeiter.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Aktiv</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {mitarbeiter.filter(m => m.aktiv).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Euro className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Gehaltskosten</p>
                  <p className="text-xl lg:text-2xl font-bold text-slate-900">
                    {mitarbeiter.reduce((sum, m) => sum + m.grundgehalt, 0).toLocaleString('de-DE')}€
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Calendar className="text-orange-600" size={24} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Im Urlaub</p>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Cards - Mobile */}
          <div className="lg:hidden space-y-4">
            {filteredMitarbeiter.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 cursor-pointer" onClick={() => setSelectedMitarbeiter(m)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {m.vorname[0]}{m.nachname[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{m.vorname} {m.nachname}</h3>
                      <p className="text-slate-500 text-sm">{m.position}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    m.aktiv
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {m.aktiv ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {m.telefon && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={16} />
                      <span className="text-sm">{m.telefon}</span>
                    </div>
                  )}
                  {m.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={16} />
                      <span className="text-sm">{m.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <Euro size={16} />
                    <span className="text-sm font-medium">
                      {m.grundgehalt.toLocaleString('de-DE')} € / Monat
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(m); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                  >
                    <Edit size={16} />
                    <span>Bearbeiten</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                    className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Employee Table - Desktop */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left p-5 font-semibold text-slate-600">Mitarbeiter</th>
                  <th className="text-left p-5 font-semibold text-slate-600">Position</th>
                  <th className="text-left p-5 font-semibold text-slate-600">Kontakt</th>
                  <th className="text-left p-5 font-semibold text-slate-600">Gehalt</th>
                  <th className="text-left p-5 font-semibold text-slate-600">Status</th>
                  <th className="text-right p-5 font-semibold text-slate-600">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredMitarbeiter.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedMitarbeiter(m)}>
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold">
                          {m.vorname[0]}{m.nachname[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{m.vorname} {m.nachname}</p>
                          <p className="text-slate-500 text-sm">
                            Seit {new Date(m.eintrittsdatum).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                        {m.position}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="space-y-1">
                        {m.telefon && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone size={14} />
                            <span className="text-sm">{m.telefon}</span>
                          </div>
                        )}
                        {m.email && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail size={14} />
                            <span className="text-sm">{m.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="text-slate-900 font-semibold">
                        {m.grundgehalt.toLocaleString('de-DE')} €
                      </span>
                      <span className="text-slate-500 text-sm"> / Monat</span>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        m.aktiv
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {m.aktiv ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(m); }}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredMitarbeiter.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-slate-400" size={32} />
                </div>
                <p className="text-slate-500 text-lg">Keine Mitarbeiter gefunden</p>
              </div>
            )}
          </div>
          </>
          )}
        </main>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingMitarbeiter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-900">Mitarbeiter bearbeiten</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">Mitarbeiter Status</p>
                  <p className="text-sm text-slate-500">Inaktive Mitarbeiter werden ausgeblendet</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditFormData({...editFormData, aktiv: !editFormData.aktiv})}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    editFormData.aktiv ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    editFormData.aktiv ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Persönliche Daten */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Persönliche Daten
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Vorname *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.vorname}
                      onChange={(e) => setEditFormData({...editFormData, vorname: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nachname *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.nachname}
                      onChange={(e) => setEditFormData({...editFormData, nachname: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Geburtsdatum</label>
                    <input
                      type="date"
                      value={editFormData.geburtsdatum}
                      onChange={(e) => setEditFormData({...editFormData, geburtsdatum: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Telefon</label>
                    <input
                      type="tel"
                      value={editFormData.telefon}
                      onChange={(e) => setEditFormData({...editFormData, telefon: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">E-Mail</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Adresse</label>
                    <input
                      type="text"
                      value={editFormData.adresse}
                      onChange={(e) => setEditFormData({...editFormData, adresse: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Arbeitsdaten */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Arbeitsdaten
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
                    <select
                      value={editFormData.position}
                      onChange={(e) => setEditFormData({...editFormData, position: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                    >
                      <option value="Fahrer">Fahrer</option>
                      <option value="Lagerarbeiter">Lagerarbeiter</option>
                      <option value="Disponent">Disponent</option>
                      <option value="Verwaltung">Verwaltung</option>
                      <option value="Geschäftsführer">Geschäftsführer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Grundgehalt (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.grundgehalt}
                      onChange={(e) => setEditFormData({...editFormData, grundgehalt: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Monatliche Gehälter */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Monatliche Gehälter (€) - Leer = Grundgehalt
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Jan</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.gehalt_jan}
                      onChange={(e) => setEditFormData({...editFormData, gehalt_jan: e.target.value})}
                      placeholder={editFormData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Feb</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.gehalt_feb}
                      onChange={(e) => setEditFormData({...editFormData, gehalt_feb: e.target.value})}
                      placeholder={editFormData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Mär</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.gehalt_mar}
                      onChange={(e) => setEditFormData({...editFormData, gehalt_mar: e.target.value})}
                      placeholder={editFormData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Apr</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.gehalt_apr}
                      onChange={(e) => setEditFormData({...editFormData, gehalt_apr: e.target.value})}
                      placeholder={editFormData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Mai</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.gehalt_mai}
                      onChange={(e) => setEditFormData({...editFormData, gehalt_mai: e.target.value})}
                      placeholder={editFormData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Jun</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.gehalt_jun}
                      onChange={(e) => setEditFormData({...editFormData, gehalt_jun: e.target.value})}
                      placeholder={editFormData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Jul</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.gehalt_jul}
                      onChange={(e) => setEditFormData({...editFormData, gehalt_jul: e.target.value})}
                      placeholder={editFormData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Aug</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.gehalt_aug}
                      onChange={(e) => setEditFormData({...editFormData, gehalt_aug: e.target.value})}
                      placeholder={editFormData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Sep</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.gehalt_sep}
                      onChange={(e) => setEditFormData({...editFormData, gehalt_sep: e.target.value})}
                      placeholder={editFormData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Okt</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.gehalt_okt}
                      onChange={(e) => setEditFormData({...editFormData, gehalt_okt: e.target.value})}
                      placeholder={editFormData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nov</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.gehalt_nov}
                      onChange={(e) => setEditFormData({...editFormData, gehalt_nov: e.target.value})}
                      placeholder={editFormData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Dez</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.gehalt_dez}
                      onChange={(e) => setEditFormData({...editFormData, gehalt_dez: e.target.value})}
                      placeholder={editFormData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Notizen */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notizen</label>
                <textarea
                  value={editFormData.notizen}
                  onChange={(e) => setEditFormData({...editFormData, notizen: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
                >
                  {saving ? 'Speichern...' : 'Änderungen speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-900">Neuer Mitarbeiter</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Persönliche Daten */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Persönliche Daten
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Vorname *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vorname}
                      onChange={(e) => setFormData({...formData, vorname: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
                      placeholder="Max"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nachname *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nachname}
                      onChange={(e) => setFormData({...formData, nachname: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
                      placeholder="Mustermann"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Geburtsdatum
                    </label>
                    <input
                      type="date"
                      value={formData.geburtsdatum}
                      onChange={(e) => setFormData({...formData, geburtsdatum: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.telefon}
                      onChange={(e) => setFormData({...formData, telefon: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
                      placeholder="+49 123 456 7890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
                      placeholder="max@beispiel.de"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={formData.adresse}
                      onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
                      placeholder="Musterstraße 1, 12345 Berlin"
                    />
                  </div>
                </div>
              </div>

              {/* Arbeitsdaten */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Arbeitsdaten
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Position
                    </label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                    >
                      <option value="Fahrer">Fahrer</option>
                      <option value="Lagerarbeiter">Lagerarbeiter</option>
                      <option value="Disponent">Disponent</option>
                      <option value="Verwaltung">Verwaltung</option>
                      <option value="Geschäftsführer">Geschäftsführer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Grundgehalt (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.grundgehalt}
                      onChange={(e) => setFormData({...formData, grundgehalt: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
                      placeholder="3500.00"
                    />
                  </div>
                </div>
              </div>

              {/* Monatliche Gehälter */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Monatliche Gehälter (€) - Leer = Grundgehalt
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Jan</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gehalt_jan}
                      onChange={(e) => setFormData({...formData, gehalt_jan: e.target.value})}
                      placeholder={formData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Feb</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gehalt_feb}
                      onChange={(e) => setFormData({...formData, gehalt_feb: e.target.value})}
                      placeholder={formData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Mär</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gehalt_mar}
                      onChange={(e) => setFormData({...formData, gehalt_mar: e.target.value})}
                      placeholder={formData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Apr</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gehalt_apr}
                      onChange={(e) => setFormData({...formData, gehalt_apr: e.target.value})}
                      placeholder={formData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Mai</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gehalt_mai}
                      onChange={(e) => setFormData({...formData, gehalt_mai: e.target.value})}
                      placeholder={formData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Jun</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gehalt_jun}
                      onChange={(e) => setFormData({...formData, gehalt_jun: e.target.value})}
                      placeholder={formData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Jul</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gehalt_jul}
                      onChange={(e) => setFormData({...formData, gehalt_jul: e.target.value})}
                      placeholder={formData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Aug</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gehalt_aug}
                      onChange={(e) => setFormData({...formData, gehalt_aug: e.target.value})}
                      placeholder={formData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Sep</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gehalt_sep}
                      onChange={(e) => setFormData({...formData, gehalt_sep: e.target.value})}
                      placeholder={formData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Okt</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gehalt_okt}
                      onChange={(e) => setFormData({...formData, gehalt_okt: e.target.value})}
                      placeholder={formData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nov</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gehalt_nov}
                      onChange={(e) => setFormData({...formData, gehalt_nov: e.target.value})}
                      placeholder={formData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Dez</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gehalt_dez}
                      onChange={(e) => setFormData({...formData, gehalt_dez: e.target.value})}
                      placeholder={formData.grundgehalt || '0'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-300 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Notizen */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notizen
                </label>
                <textarea
                  value={formData.notizen}
                  onChange={(e) => setFormData({...formData, notizen: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400 resize-none"
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Speichern...' : 'Mitarbeiter anlegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mitarbeiter Detail Modal */}
      {selectedMitarbeiter && (
        <MitarbeiterDetail
          mitarbeiter={selectedMitarbeiter}
          onClose={() => setSelectedMitarbeiter(null)}
        />
      )}
    </div>
  )
}
