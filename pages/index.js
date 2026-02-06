import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const STATUS_PIPELINE = [
  { id: 'erstkontakt', label: 'Erstkontakt', color: 'bg-blue-500' },
  { id: 'konzept', label: 'Konzept', color: 'bg-amber-500' },
  { id: 'telefonliste', label: 'Telefonliste/BN Bezüge', color: 'bg-purple-500' },
  { id: 'abschluss', label: 'Abschluss', color: 'bg-green-500' },
]

const AVAILABLE_TAGS = ['VIP', 'Privat', 'Gewerbe', 'BU-Interesse', 'Altersvorsorge', 'Bestandskunde', 'Empfehlung']

export default function CRM() {
  const [user, setUser] = useState(null)
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('dashboard')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(null)
  const [editData, setEditData] = useState({})

  const loadCustomers = async () => {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*, appointments(*), contacts(*)').order('created_at', { ascending: false })
    setCustomers(data || [])
    setLoading(false)
  }

  useEffect(() => { if (user) loadCustomers() }, [user])

  const handleLogin = async (username, password) => {
    const { data } = await supabase.from('users').select('*').eq('username', username).eq('password_hash', password).single()
    if (data) { setUser(data); return true }
    return false
  }

  const saveCustomer = async (formData) => {
    if (formData.id) {
      await supabase.from('customers').update({ name: formData.name, company: formData.company, email: formData.email, phone: formData.phone, address: formData.address, status: formData.status, notes: formData.notes, tags: formData.tags }).eq('id', formData.id)
    } else {
      await supabase.from('customers').insert({ name: formData.name, company: formData.company || '', email: formData.email || '', phone: formData.phone || '', address: formData.address || '', status: formData.status || 'erstkontakt', notes: formData.notes || '', tags: formData.tags || [] })
    }
    await loadCustomers()
    setShowModal(null)
    setEditData({})
  }

  const deleteCustomer = async (id) => {
    if (confirm('Löschen?')) {
      await supabase.from('customers').delete().eq('id', id)
      await loadCustomers()
      setSelectedCustomer(null)
      setView('customers')
    }
  }

  const updateStatus = async (id, status) => {
    await supabase.from('customers').update({ status }).eq('id', id)
    await loadCustomers()
    if (selectedCustomer?.id === id) setSelectedCustomer(p => ({ ...p, status }))
  }

  const addContact = async (customerId, contact) => {
    await supabase.from('contacts').insert({ customer_id: customerId, type: contact.type, note: contact.note, date: new Date().toISOString().split('T')[0] })
    await loadCustomers()
  }

  const addAppointment = async (customerId, apt) => {
    await supabase.from('appointments').insert({ customer_id: customerId, title: apt.title, date: apt.date, time: apt.time, reminder: apt.reminder })
    await loadCustomers()
  }

  const filteredCustomers = customers.filter(c => {
    const match = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.email?.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm)
    return match && (filterStatus === 'all' || c.status === filterStatus)
  })

  const getStats = () => {
    const stats = {}
    STATUS_PIPELINE.forEach(s => { stats[s.id] = customers.filter(c => c.status === s.id).length })
    return stats
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <>
      <Head><title>Mini CRM</title></Head>
      <div className="min-h-screen bg-slate-50">
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r p-4 hidden md:flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold">C</div>
            <span className="font-bold text-slate-800">Mini CRM</span>
          </div>
          <nav className="flex-1 space-y-1">
            <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${view === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}>Dashboard</button>
            <button onClick={() => setView('customers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${view === 'customers' || view === 'detail' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}>Kunden</button>
          </nav>
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-medium">{user.name}</span>
              <button onClick={() => setUser(null)} className="text-slate-400 text-sm">Logout</button>
            </div>
          </div>
        </aside>

        <main className="md:ml-64 p-4 md:p-8">
          {view === 'dashboard' && <Dashboard customers={customers} stats={getStats()} onNewCustomer={() => { setEditData({}); setShowModal('customer') }} onSelectCustomer={(c) => { setSelectedCustomer(c); setView('detail') }} user={user} />}
          {view === 'customers' && <CustomerList customers={filteredCustomers} searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterStatus={filterStatus} setFilterStatus={setFilterStatus} onNewCustomer={() => { setEditData({}); setShowModal('customer') }} onSelectCustomer={(c) => { setSelectedCustomer(c); setView('detail') }} />}
          {view === 'detail' && selectedCustomer && <CustomerDetail customer={selectedCustomer} onBack={() => { setSelectedCustomer(null); setView('customers') }} onEdit={() => { setEditData(selectedCustomer); setShowModal('customer') }} onDelete={() => deleteCustomer(selectedCustomer.id)} onUpdateStatus={(s) => updateStatus(selectedCustomer.id, s)} onAddContact={(c) => addContact(selectedCustomer.id, c)} onAddAppointment={(a) => addAppointment(selectedCustomer.id, a)} />}
        </main>

        {showModal === 'customer' && <CustomerModal data={editData} onSave={saveCustomer} onClose={() => { setShowModal(null); setEditData({}) }} />}
      </div>
    </>
  )
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    const success = await onLogin(username, password)
    if (!success) setError('Ungültige Anmeldedaten')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl mb-4 text-white text-2xl font-bold">C</div>
          <h1 className="text-2xl font-bold text-white">Mini CRM</h1>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="Benutzername" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400" />
          <input type="password" placeholder="Passwort" value={password} onChange={e => setPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSubmit()} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400" />
          {error && <div className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>}
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold rounded-xl">{loading ? 'Laden...' : 'Anmelden'}</button>
        </div>
        <div className="mt-6 p-4 bg-white/5 rounded-xl text-xs text-slate-300">
          <p className="text-slate-400 mb-2">Demo-Zugänge:</p>
          <p>admin / admin123</p>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ customers, stats, onNewCustomer, onSelectCustomer, user }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800">Dashboard</h1><p className="text-slate-500">Willkommen, {user.name}</p></div>
        <button onClick={onNewCustomer} className="px-4 py-2 bg-blue-500 text-white font-medium rounded-xl">+ Neuer Kunde</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATUS_PIPELINE.map(s => (
          <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm border"><div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${s.color}`}></div><span className="text-sm text-slate-500">{s.label}</span></div><div className="text-3xl font-bold mt-2">{stats[s.id] || 0}</div></div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b font-semibold">Neueste Kunden</div>
        <div className="divide-y">{customers.slice(0, 5).map(c => (
          <div key={c.id} className="p-4 hover:bg-slate-50 cursor-pointer" onClick={() => onSelectCustomer(c)}>
            <div className="flex justify-between"><span className="font-medium">{c.name}</span><span className={`px-2 py-1 text-xs rounded-full text-white ${STATUS_PIPELINE.find(s => s.id === c.status)?.color}`}>{STATUS_PIPELINE.find(s => s.id === c.status)?.label}</span></div>
          </div>
        ))}</div>
      </div>
    </div>
  )
}

function CustomerList({ customers, searchTerm, setSearchTerm, filterStatus, setFilterStatus, onNewCustomer, onSelectCustomer }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Kunden</h1>
        <button onClick={onNewCustomer} className="px-4 py-2 bg-blue-500 text-white rounded-xl">+ Neuer Kunde</button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <input type="text" placeholder="Suchen..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 min-w-[200px] px-4 py-2 border rounded-xl" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 border rounded-xl">
          <option value="all">Alle</option>
          {STATUS_PIPELINE.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <div className="grid gap-4">{customers.map(c => (
        <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm border cursor-pointer hover:shadow-md" onClick={() => onSelectCustomer(c)}>
          <div className="flex justify-between items-start">
            <div><div className="font-semibold">{c.name}</div>{c.company && <div className="text-sm text-slate-500">{c.company}</div>}<div className="text-sm text-slate-500 mt-1">{c.email} {c.phone && `• ${c.phone}`}</div></div>
            <span className={`px-3 py-1 text-xs rounded-full text-white ${STATUS_PIPELINE.find(s => s.id === c.status)?.color}`}>{STATUS_PIPELINE.find(s => s.id === c.status)?.label}</span>
          </div>
        </div>
      ))}</div>
    </div>
  )
}

function CustomerDetail({ customer, onBack, onEdit, onDelete, onUpdateStatus, onAddContact, onAddAppointment }) {
  const [newContact, setNewContact] = useState({ type: 'Telefon', note: '' })
  const [newApt, setNewApt] = useState({ title: '', date: '', time: '', reminder: true })
  const [showContactForm, setShowContactForm] = useState(false)
  const [showAptForm, setShowAptForm] = useState(false)
  const currentIdx = STATUS_PIPELINE.findIndex(s => s.id === customer.status)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg">←</button>
          <div><h1 className="text-2xl font-bold">{customer.name}</h1>{customer.company && <p className="text-slate-500">{customer.company}</p>}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="px-3 py-2 bg-slate-100 rounded-lg">Bearbeiten</button>
          <button onClick={onDelete} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg">Löschen</button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <h3 className="text-sm font-medium text-slate-500 mb-3">Status</h3>
        <div className="flex gap-2 flex-wrap">{STATUS_PIPELINE.map((s, idx) => (
          <button key={s.id} onClick={() => onUpdateStatus(s.id)} className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-sm font-medium ${idx <= currentIdx ? `${s.color} text-white` : 'bg-slate-100 text-slate-400'}`}>{s.label}</button>
        ))}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-semibold mb-4">Kontaktdaten</h3>
          <div className="space-y-2 text-slate-600">
            {customer.email && <p>📧 {customer.email}</p>}
            {customer.phone && <p>📞 {customer.phone}</p>}
            {customer.address && <p>📍 {customer.address}</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-semibold mb-4">Notizen</h3>
          <p className="text-slate-600">{customer.notes || 'Keine Notizen'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex justify-between"><h3 className="font-semibold">Termine</h3><button onClick={() => setShowAptForm(!showAptForm)} className="text-sm text-blue-500">+ Hinzufügen</button></div>
        {showAptForm && <div className="p-4 bg-slate-50 border-b flex gap-2 flex-wrap">
          <input type="date" value={newApt.date} onChange={e => setNewApt(p => ({...p, date: e.target.value}))} className="px-3 py-2 border rounded-lg" />
          <input type="time" value={newApt.time} onChange={e => setNewApt(p => ({...p, time: e.target.value}))} className="px-3 py-2 border rounded-lg" />
          <input type="text" placeholder="Beschreibung" value={newApt.title} onChange={e => setNewApt(p => ({...p, title: e.target.value}))} className="flex-1 min-w-[150px] px-3 py-2 border rounded-lg" />
          <button onClick={() => { if(newApt.date && newApt.title) { onAddAppointment(newApt); setNewApt({title:'',date:'',time:'',reminder:true}); setShowAptForm(false) }}} className="px-4 py-2 bg-blue-500 text-white rounded-lg">OK</button>
        </div>}
        <div className="divide-y">{(customer.appointments || []).length === 0 ? <p className="p-4 text-slate-400">Keine Termine</p> : (customer.appointments || []).map((a,i) => <div key={i} className="p-4"><div className="font-medium">{a.title}</div><div className="text-sm text-slate-500">{a.date} {a.time}</div></div>)}</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex justify-between"><h3 className="font-semibold">Kontakt-Historie</h3><button onClick={() => setShowContactForm(!showContactForm)} className="text-sm text-blue-500">+ Hinzufügen</button></div>
