import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STATUS = [
  { id: 'erstkontakt', label: 'Erstkontakt', color: 'bg-blue-500' },
  { id: 'konzept', label: 'Konzept', color: 'bg-amber-500' },
  { id: 'telefonliste', label: 'Telefonliste/BN Bezüge', color: 'bg-purple-500' },
  { id: 'abschluss', label: 'Abschluss', color: 'bg-green-500' },
]

const TAGS = ['VIP', 'Privat', 'Gewerbe', 'BU-Interesse', 'Altersvorsorge', 'Bestandskunde', 'Empfehlung']

export default function CRM() {
  const [user, setUser] = useState(null)
  const [customers, setCustomers] = useState([])
  const [view, setView] = useState('dashboard')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [contactForm, setContactForm] = useState({ type: 'Telefon', note: '' })
  const [showContact, setShowContact] = useState(false)
  const [aptForm, setAptForm] = useState({ title: '', date: '', time: '' })
  const [showApt, setShowApt] = useState(false)

  useEffect(() => { if (user) loadData() }, [user])

  const loadData = async () => {
    const { data } = await supabase.from('customers').select('*, contacts(*), appointments(*)').order('created_at', { ascending: false })
    setCustomers(data || [])
  }

  const login = async (u, p) => {
    const { data } = await supabase.from('users').select('*').eq('username', u).eq('password_hash', p).single()
    if (data) setUser(data)
    return !!data
  }

  const save = async () => {
    if (form.id) {
      await supabase.from('customers').update({
        name: form.name, company: form.company, email: form.email, phone: form.phone,
        address: form.address, status: form.status, notes: form.notes, tags: form.tags
      }).eq('id', form.id)
    } else {
      await supabase.from('customers').insert({
        name: form.name, company: form.company || '', email: form.email || '', phone: form.phone || '',
        address: form.address || '', status: 'erstkontakt', notes: form.notes || '', tags: form.tags || []
      })
    }
    setShowForm(false)
    setForm({})
    loadData()
  }

  const del = async (id) => {
    if (confirm('Kunden wirklich löschen?')) {
      await supabase.from('customers').delete().eq('id', id)
      setSelected(null)
      setView('customers')
      loadData()
    }
  }

  const updateStatus = async (id, status) => {
    await supabase.from('customers').update({ status }).eq('id', id)
    loadData()
    if (selected?.id === id) setSelected(p => ({ ...p, status }))
  }

  const addContact = async () => {
    await supabase.from('contacts').insert({
      customer_id: selected.id, type: contactForm.type, note: contactForm.note,
      date: new Date().toISOString().split('T')[0]
    })
    setShowContact(false)
    setContactForm({ type: 'Telefon', note: '' })
    loadData()
  }

  const addApt = async () => {
    await supabase.from('appointments').insert({
      customer_id: selected.id, title: aptForm.title, date: aptForm.date, time: aptForm.time
    })
    setShowApt(false)
    setAptForm({ title: '', date: '', time: '' })
    loadData()
  }

  const filtered = customers.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const stats = STATUS.reduce((a, s) => ({ ...a, [s.id]: customers.filter(c => c.status === s.id).length }), {})

  const upcoming = customers.flatMap(c => (c.appointments || []).map(a => ({ ...a, customer: c.name, cid: c.id })))
    .sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5)

  if (!user) return <Login onLogin={login} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      <aside style={{ width: 250, background: 'white', borderRight: '1px solid #e2e8f0', padding: 20, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #3b82f6, #10b981)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>C</div>
          <span style={{ fontWeight: 'bold', fontSize: 18 }}>Mini CRM</span>
        </div>
        <button onClick={() => setView('dashboard')} style={{ width: '100%', padding: '12px 16px', textAlign: 'left', border: 'none', borderRadius: 12, marginBottom: 8, cursor: 'pointer', background: view === 'dashboard' ? '#eff6ff' : 'transparent', color: view === 'dashboard' ? '#3b82f6' : '#475569', fontWeight: 500 }}>📊 Dashboard</button>
        <button onClick={() => setView('customers')} style={{ width: '100%', padding: '12px 16px', textAlign: 'left', border: 'none', borderRadius: 12, cursor: 'pointer', background: view === 'customers' || view === 'detail' ? '#eff6ff' : 'transparent', color: view === 'customers' || view === 'detail' ? '#3b82f6' : '#475569', fontWeight: 500 }}>👥 Kunden</button>
        <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 14, color: '#64748b' }}>{user.name}</div>
          <button onClick={() => setUser(null)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginTop: 8 }}>Logout</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 32 }}>
        {view === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div><h1 style={{ margin: 0, fontSize: 28 }}>Dashboard</h1><p style={{ color: '#64748b', margin: '4px 0 0' }}>Willkommen, {user.name}</p></div>
              <button onClick={() => { setForm({}); setShowForm(true) }} style={{ padding: '12px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 500 }}>+ Neuer Kunde</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              {STATUS.map(s => (
                <div key={s.id} style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color === 'bg-blue-500' ? '#3b82f6' : s.color === 'bg-amber-500' ? '#f59e0b' : s.color === 'bg-purple-500' ? '#8b5cf6' : '#10b981' }}></div>
                    <span style={{ fontSize: 14, color: '#64748b' }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 'bold', marginTop: 8 }}>{stats[s.id] || 0}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>📅 Nächste Termine</div>
                {upcoming.length === 0 ? <p style={{ padding: 16, color: '#94a3b8' }}>Keine Termine</p> : upcoming.map((a, i) => (
                  <div key={i} style={{ padding: 16, borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => { setSelected(customers.find(c => c.id === a.cid)); setView('detail') }}>
                    <div style={{ fontWeight: 500 }}>{a.title}</div>
                    <div style={{ fontSize: 14, color: '#64748b' }}>{a.customer} • {a.date} {a.time}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>👥 Neueste Kunden</div>
                {customers.slice(0, 5).map(c => (
                  <div key={c.id} style={{ padding: 16, borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }} onClick={() => { setSelected(c); setView('detail') }}>
                    <div><div style={{ fontWeight: 500 }}>{c.name}</div><div style={{ fontSize: 14, color: '#64748b' }}>{c.company || c.email}</div></div>
                    <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, color: 'white', background: c.status === 'erstkontakt' ? '#3b82f6' : c.status === 'konzept' ? '#f59e0b' : c.status === 'telefonliste' ? '#8b5cf6' : '#10b981' }}>{STATUS.find(s => s.id === c.status)?.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'customers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: 28 }}>Kunden</h1>
              <button onClick={() => { setForm({}); setShowForm(true) }} style={{ padding: '12px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 500 }}>+ Neuer Kunde</button>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <option value="all">Alle Status</option>
                {STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(c => (
                <div key={c.id} onClick={() => { setSelected(c); setView('detail') }} style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{c.name}</div>
                      {c.company && <div style={{ fontSize: 14, color: '#64748b' }}>🏢 {c.company}</div>}
                      <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{c.email} {c.phone && '• ' + c.phone}</div>
                    </div>
                    <span style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, color: 'white', height: 'fit-content', background: c.status === 'erstkontakt' ? '#3b82f6' : c.status === 'konzept' ? '#f59e0b' : c.status === 'telefonliste' ? '#8b5cf6' : '#10b981' }}>{STATUS.find(s => s.id === c.status)?.label}</span>
                  </div>
                  {c.tags?.length > 0 && <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>{c.tags.map(t => <span key={t} style={{ padding: '4px 10px', background: '#f1f5f9', borderRadius: 20, fontSize: 12 }}>{t}</span>)}</div>}
                </div>
              ))}
              {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Keine Kunden gefunden</p>}
            </div>
          </div>
        )}

        {view === 'detail' && selected && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button onClick={() => { setSelected(null); setView('customers') }} style={{ padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer' }}>←</button>
                <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #3b82f6, #10b981)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 'bold' }}>{selected.name?.[0]}</div>
                <div><h1 style={{ margin: 0, fontSize: 24 }}>{selected.name}</h1>{selected.company && <p style={{ margin: 0, color: '#64748b' }}>🏢 {selected.company}</p>}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setForm(selected); setShowForm(true) }} style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer' }}>✏️ Bearbeiten</button>
                <button onClick={() => del(selected.id)} style={{ padding: '10px 16px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer' }}>🗑️ Löschen</button>
              </div>
            </div>

            <div style={{ background: 'white', padding: 20, borderRadius: 16, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>Status-Pipeline</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {STATUS.map((s, i) => (
                  <button key={s.id} onClick={() => updateStatus(selected.id, s.id)} style={{ flex: 1, padding: 12, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, color: STATUS.findIndex(x => x.id === selected.status) >= i ? 'white' : '#94a3b8', background: STATUS.findIndex(x => x.id === selected.status) >= i ? (s.color === 'bg-blue-500' ? '#3b82f6' : s.color === 'bg-amber-500' ? '#f59e0b' : s.color === 'bg-purple-500' ? '#8b5cf6' : '#10b981') : '#f1f5f9' }}>{s.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px' }}>Kontaktdaten</h3>
                <p style={{ margin: '8px 0', color: '#475569' }}>📧 {selected.email || '-'}</p>
                <p style={{ margin: '8px 0', color: '#475569' }}>📞 {selected.phone || '-'}</p>
                <p style={{ margin: '8px 0', color: '#475569' }}>📍 {selected.address || '-'}</p>
                {selected.tags?.length > 0 && <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>{selected.tags.map(t => <span key={t} style={{ padding: '4px 10px', background: '#eff6ff', color: '#3b82f6', borderRadius: 20, fontSize: 12 }}>{t}</span>)}</div>}
              </div>
              <div style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px' }}>📝 Notizen</h3>
                <p style={{ color: '#475569', whiteSpace: 'pre-wrap' }}>{selected.notes || 'Keine Notizen'}</p>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 16, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>📅 Termine</h3>
                <button onClick={() => setShowApt(true)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}>+ Hinzufügen</button>
              </div>
              {showApt && (
                <div style={{ padding: 16, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input type="date" value={aptForm.date} onChange={e => setAptForm(p => ({ ...p, date: e.target.value }))} style={{ padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <input type="time" value={aptForm.time} onChange={e => setAptForm(p => ({ ...p, time: e.target.value }))} style={{ padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <input placeholder="Beschreibung" value={aptForm.title} onChange={e => setAptForm(p => ({ ...p, title: e.target.value }))} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <button onClick={addApt} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>OK</button>
                </div>
              )}
              {(selected.appointments || []).length === 0 ? <p style={{ padding: 16, color: '#94a3b8' }}>Keine Termine</p> : (selected.appointments || []).map((a, i) => (
                <div key={i} style={{ padding: 16, borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 500 }}>{a.title}</div>
                  <div style={{ fontSize: 14, color: '#64748b' }}>{a.date} {a.time && 'um ' + a.time + ' Uhr'}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>💬 Kontakt-Historie</h3>
                <button onClick={() => setShowContact(true)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}>+ Hinzufügen</button>
              </div>
              {showContact && (
                <div style={{ padding: 16, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select value={contactForm.type} onChange={e => setContactForm(p => ({ ...p, type: e.target.value }))} style={{ padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <option>Telefon</option><option>E-Mail</option><option>Persönlich</option><option>Video-Call</option>
                  </select>
                  <input placeholder="Was wurde besprochen?" value={contactForm.note} onChange={e => setContactForm(p => ({ ...p, note: e.target.value }))} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <button onClick={addContact} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>OK</button>
                </div>
              )}
              {(selected.contacts || []).length === 0 ? <p style={{ padding: 16, color: '#94a3b8' }}>Keine Kontakte</p> : (selected.contacts || []).map((c, i) => (
                <div key={i} style={{ padding: 16, borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500 }}>{c.type}</span>
                    <span style={{ fontSize: 14, color: '#94a3b8' }}>{c.date}</span>
                  </div>
                  <p style={{ margin: '8px 0 0', color: '#475569' }}>{c.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 20px' }}>{form.id ? 'Kunde bearbeiten' : 'Neuer Kunde'}</h3>
            <input placeholder="Name *" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }} />
            <input placeholder="Firma" value={form.company || ''} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input placeholder="Email" value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={{ padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <input placeholder="Telefon" value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={{ padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            </div>
            <input placeholder="Adresse" value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }} />
            {form.id && (
              <select value={form.status || 'erstkontakt'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                {STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            )}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {TAGS.map(t => (
                  <button key={t} type="button" onClick={() => setForm(p => ({ ...p, tags: (p.tags || []).includes(t) ? p.tags.filter(x => x !== t) : [...(p.tags || []), t] }))} style={{ padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', background: (form.tags || []).includes(t) ? '#3b82f6' : '#f1f5f9', color: (form.tags || []).includes(t) ? 'white' : '#475569' }}>{t}</button>
                ))}
              </div>
            </div>
            <textarea placeholder="Notizen" value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16, minHeight: 80 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={save} disabled={!form.name} style={{ flex: 1, padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: form.name ? 1 : 0.5 }}>Speichern</button>
              <button onClick={() => setShowForm(false)} style={{ padding: '12px 24px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Abbrechen</button>
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
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    const ok = await onLogin(u, p)
    if (!ok) setErr('Ungültige Anmeldedaten')
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: 40, borderRadius: 24, width: '100%', maxWidth: 400, border: '1px solid rgba(255,255,255,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #3b82f6, #10b981)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'white', fontSize: 28, fontWeight: 'bold' }}>C</div>
          <h1 style={{ color: 'white', margin: 0 }}>Mini CRM</h1>
          <p style={{ color: '#94a3b8', margin: '8px 0 0' }}>Kundenmanagement</p>
        </div>
        <input placeholder="Benutzername" value={u} onChange={e => setU(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', marginBottom: 12 }} />
        <input type="password" placeholder="Passwort" value={p} onChange={e => setP(e.target.value)} onKeyPress={e => e.key === 'Enter' && submit()} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', marginBottom: 12 }} />
        {err && <p style={{ color: '#f87171', fontSize: 14, margin: '0 0 12px' }}>{err}</p>}
        <button onClick={submit} disabled={loading} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #3b82f6, #10b981)', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}>{loading ? 'Laden...' : 'Anmelden'}</button>
        <p style={{ color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 24 }}>Demo: admin / admin123</p>
      </div>
    </div>
  )
}
