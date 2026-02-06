import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STATUS = [
  { id: 'erstkontakt', label: 'Erstkontakt', color: 'bg-blue-500' },
  { id: 'konzept', label: 'Konzept', color: 'bg-amber-500' },
  { id: 'telefonliste', label: 'Telefonliste/BN', color: 'bg-purple-500' },
  { id: 'abschluss', label: 'Abschluss', color: 'bg-green-500' },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [customers, setCustomers] = useState([])
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({})
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { if(user) loadData() }, [user])

  const loadData = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    setCustomers(data || [])
  }

  const login = async (u, p) => {
    const { data } = await supabase.from('users').select('*').eq('username', u).eq('password_hash', p).single()
    if(data) setUser(data)
    return !!data
  }

  const save = async () => {
    if(form.id) {
      await supabase.from('customers').update(form).eq('id', form.id)
    } else {
      await supabase.from('customers').insert({ ...form, status: 'erstkontakt' })
    }
    setShowForm(false)
    setForm({})
    loadData()
  }

  const del = async (id) => {
    if(confirm('Löschen?')) {
      await supabase.from('customers').delete().eq('id', id)
      setSelected(null)
      loadData()
    }
  }

  const updateStatus = async (id, status) => {
    await supabase.from('customers').update({ status }).eq('id', id)
    loadData()
    if(selected?.id === id) setSelected(p => ({...p, status}))
  }

  if(!user) return <Login onLogin={login} />

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Mini CRM</h1>
        <div className="flex gap-4 items-center">
          <span className="text-gray-600">{user.name}</span>
          <button onClick={() => setUser(null)} className="text-red-500">Logout</button>
        </div>
      </nav>

      <div className="p-4 max-w-4xl mx-auto">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-bold">{selected ? selected.name : 'Kunden'}</h2>
          {!selected && <button onClick={() => { setForm({}); setShowForm(true) }} className="bg-blue-500 text-white px-4 py-2 rounded">+ Neu</button>}
          {selected && <button onClick={() => setSelected(null)} className="bg-gray-300 px-4 py-2 rounded">Zurück</button>}
        </div>

        {!selected && (
          <div className="grid gap-4">
            {customers.map(c => (
              <div key={c.id} onClick={() => setSelected(c)} className="bg-white p-4 rounded shadow cursor-pointer hover:shadow-md">
                <div className="flex justify-between">
                  <div>
                    <div className="font-bold">{c.name}</div>
                    <div className="text-gray-500 text-sm">{c.email} {c.phone && `• ${c.phone}`}</div>
                  </div>
                  <span className={`${STATUS.find(s=>s.id===c.status)?.color} text-white text-xs px-2 py-1 rounded`}>
                    {STATUS.find(s=>s.id===c.status)?.label}
                  </span>
                </div>
              </div>
            ))}
            {customers.length === 0 && <p className="text-gray-400 text-center py-8">Keine Kunden</p>}
          </div>
        )}

        {selected && (
          <div className="bg-white p-6 rounded shadow">
            <div className="flex gap-2 mb-6">
              {STATUS.map((s,i) => (
                <button key={s.id} onClick={() => updateStatus(selected.id, s.id)} 
                  className={`flex-1 py-2 rounded text-sm ${STATUS.findIndex(x=>x.id===selected.status) >= i ? s.color + ' text-white' : 'bg-gray-200'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <p><strong>Email:</strong> {selected.email}</p>
            <p><strong>Telefon:</strong> {selected.phone}</p>
            <p><strong>Adresse:</strong> {selected.address}</p>
            <p><strong>Firma:</strong> {selected.company}</p>
            <p className="mt-4"><strong>Notizen:</strong> {selected.notes}</p>
            <div className="flex gap-2 mt-6">
              <button onClick={() => { setForm(selected); setShowForm(true) }} className="bg-blue-500 text-white px-4 py-2 rounded">Bearbeiten</button>
              <button onClick={() => del(selected.id)} className="bg-red-500 text-white px-4 py-2 rounded">Löschen</button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{form.id ? 'Bearbeiten' : 'Neuer Kunde'}</h3>
            <input placeholder="Name *" value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="w-full p-2 border rounded mb-2" />
            <input placeholder="Email" value={form.email||''} onChange={e=>setForm(p=>({...p,email:e.target.value}))} className="w-full p-2 border rounded mb-2" />
            <input placeholder="Telefon" value={form.phone||''} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} className="w-full p-2 border rounded mb-2" />
            <input placeholder="Firma" value={form.company||''} onChange={e=>setForm(p=>({...p,company:e.target.value}))} className="w-full p-2 border rounded mb-2" />
            <input placeholder="Adresse" value={form.address||''} onChange={e=>setForm(p=>({...p,address:e.target.value}))} className="w-full p-2 border rounded mb-2" />
            <textarea placeholder="Notizen" value={form.notes||''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} className="w-full p-2 border rounded mb-4" />
            <div className="flex gap-2">
              <button onClick={save} disabled={!form.name} className="flex-1 bg-blue-500 text-white py-2 rounded disabled:opacity-50">Speichern</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded">Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Login({ onLogin }) {
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')

  const submit = async () => {
    const ok = await onLogin(u, p)
    if(!ok) setErr('Falsche Daten')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur p-8 rounded-xl w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white text-center mb-6">Mini CRM</h1>
        <input placeholder="Benutzer" value={u} onChange={e=>setU(e.target.value)} className="w-full p-3 rounded mb-3 bg-white/20 text-white placeholder-gray-300" />
        <input type="password" placeholder="Passwort" value={p} onChange={e=>setP(e.target.value)} onKeyPress={e=>e.key==='Enter'&&submit()} className="w-full p-3 rounded mb-3 bg-white/20 text-white placeholder-gray-300" />
        {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
        <button onClick={submit} className="w-full py-3 bg-blue-500 text-white rounded font-bold">Login</button>
        <p className="text-gray-400 text-xs mt-4 text-center">Demo: admin / admin123</p>
      </div>
    </div>
  )
}
