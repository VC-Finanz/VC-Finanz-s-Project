import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STATUS = [
  { id: 'erstkontakt', label: 'Erstkontakt', color: '#3b82f6' },
  { id: 'konzept', label: 'Konzept', color: '#c9a227' },
  { id: 'telefonliste', label: 'Telefonliste/BN Bezüge', color: '#8b5cf6' },
  { id: 'abschluss', label: 'Abschluss', color: '#10b981' },
]

const TAGS = ['BU-Interesse', 'Förderung', 'bAV-Interesse', 'KFZ', 'Private Altersvorsorge']

const NAVY = '#1e3a5f'
const GOLD = '#c9a227'

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
    if (selected) {
      const updated = data?.find(c => c.id === selected.id)
      if (updated) setSelected(updated)
    }
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
  const upcoming = customers.flatMap(c => (c.appointments || []).map(a => ({ ...a, customer: c.name, cid: c.id }))).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5)

  if (!user) return <Login onLogin={login} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      
      <aside style={{ width: 200, background: NAVY, padding: '20px 12px', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', left: 0, top: 0 }}>
        <div style={{ marginBottom: 32, padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'scale(0.8)' }}>
              <div style={{ width: 6, height: 26, background: 'transparent', border: '2px solid ' + GOLD }}></div>
              <div style={{ width: 12, height: 12, borderBottom: '2px solid ' + GOLD, borderRight: '2px solid ' + GOLD, transform: 'rotate(45deg)', marginTop: -8 }}></div>
            </div>
            <div>
              <div style={{ color: GOLD, fontSize: 18, fontWeight: 700, letterSpacing: 0.5 }}>V&C</div>
              <div style={{ color: GOLD, fontSize: 10, fontWeight: 600, letterSpacing: 2.5, marginTop: -2 }}>FINANZ</div>
            </div>
          </div>
        </div>
        
        <nav style={{ flex: 1 }}>
          <button onClick={() => setView('dashboard')} style={{ width: '100%', padding: '11px 14px', textAlign: 'left', border: 'none', borderRadius: 6, marginBottom: 4, cursor: 'pointer', background: view === 'dashboard' ? 'rgba(201,162,39,0.12)' : 'transparent', color: view === 'dashboard' ? GOLD : 'rgba(255,255,255,0.6)', fontWeight: 500, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
            <span style={{ fontSize: 14 }}>📊</span> Dashboard
          </button>
          <button onClick={() => { setView('customers'); setSelected(null) }} style={{ width: '100%', padding: '11px 14px', textAlign: 'left', border: 'none', borderRadius: 6, cursor: 'pointer', background: view === 'customers' || view === 'detail' ? 'rgba(201,162,39,0.12)' : 'transparent', color: view === 'customers' || view === 'detail' ? GOLD : 'rgba(255,255,255,0.6)', fontWeight: 500, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
            <span style={{ fontSize: 14 }}>👥</span> Kunden
          </button>
        </nav>
        
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 500, marginBottom: 2, padding: '0 8px' }}>{user.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 10, padding: '0 8px' }}>{user.username}</div>
          <button onClick={() => setUser(null)} style={{ color: 'rgba(255,255,255,0.5)', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 500, marginLeft: 8, transition: 'all 0.15s' }}>Abmelden</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '24px 32px', marginLeft: 200, minHeight: '100vh' }}>
        
        {view === 'dashboard' && (
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, color: NAVY, fontWeight: 700 }}>Dashboard</h1>
                <p style={{ color: '#7a8599', margin: '6px 0 0', fontSize: 13 }}>Willkommen zurück, {user.name}</p>
              </div>
              <button onClick={() => { setForm({}); setShowForm(true) }} style={{ padding: '10px 22px', background: GOLD, color: NAVY, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, boxShadow: '0 2px 8px rgba(201,162,39,0.25)', transition: 'all 0.15s' }}>+ Neuer Kunde</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
              {STATUS.map(s => (
                <div key={s.id} style={{ background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderTop: '3px solid ' + s.color }}>
                  <div style={{ fontSize: 11, color: '#7a8599', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: NAVY, marginTop: 6 }}>{stats[s.id] || 0}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef1f5', fontWeight: 600, color: NAVY, fontSize: 14 }}>📅 Nächste Termine</div>
                {upcoming.length === 0 ? <p style={{ padding: 20, color: '#a0aab8', textAlign: 'center', fontSize: 13 }}>Keine anstehenden Termine</p> : upcoming.map((a, i) => (
                  <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid #f8f9fb', cursor: 'pointer', transition: 'background 0.15s' }} onClick={() => { setSelected(customers.find(c => c.id === a.cid)); setView('detail') }}>
                    <div style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: '#7a8599', marginTop: 3 }}>{a.customer} · {a.date} {a.time && '· ' + a.time}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef1f5', fontWeight: 600, color: NAVY, fontSize: 14 }}>👥 Neueste Kunden</div>
                {customers.slice(0, 5).map(c => (
                  <div key={c.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f8f9fb', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => { setSelected(c); setView('detail') }}>
                    <div>
                      <div style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#7a8599' }}>{c.company || c.email}</div>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 4, fontSize: 10, color: 'white', fontWeight: 600, background: STATUS.find(s => s.id === c.status)?.color }}>{STATUS.find(s => s.id === c.status)?.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'customers' && (
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: 24, color: NAVY, fontWeight: 700 }}>Kunden</h1>
              <button onClick={() => { setForm({}); setShowForm(true) }} style={{ padding: '10px 22px', background: GOLD, color: NAVY, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, boxShadow: '0 2px 8px rgba(201,162,39,0.25)' }}>+ Neuer Kunde</button>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: '11px 16px', borderRadius: 6, border: '1px solid #e2e7ed', fontSize: 13, outline: 'none', transition: 'border 0.15s' }} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = '#e2e7ed'} />
              <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '11px 16px', borderRadius: 6, border: '1px solid #e2e7ed', fontSize: 13, background: 'white', cursor: 'pointer' }}>
                <option value="all">Alle Status</option>
                {STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(c => (
                <div key={c.id} onClick={() => { setSelected(c); setView('detail') }} style={{ background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'all 0.15s', borderLeft: '3px solid ' + STATUS.find(s => s.id === c.status)?.color }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: NAVY }}>{c.name}</div>
                      {c.company && <div style={{ fontSize: 13, color: '#7a8599', marginTop: 3 }}>{c.company}</div>}
                      <div style={{ fontSize: 12, color: '#a0aab8', marginTop: 6 }}>
                        {c.email && <span>{c.email}</span>}
                        {c.phone && <span style={{ marginLeft: c.email ? 12 : 0 }}>{c.phone}</span>}
                      </div>
                    </div>
                    <span style={{ padding: '5px 12px', borderRadius: 4, fontSize: 11, color: 'white', fontWeight: 600, height: 'fit-content', background: STATUS.find(s => s.id === c.status)?.color }}>{STATUS.find(s => s.id === c.status)?.label}</span>
                  </div>
                  {c.tags?.length > 0 && <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>{c.tags.map(t => <span key={t} style={{ padding: '4px 10px', background: '#f5f7fa', borderRadius: 4, fontSize: 11, color: '#5a6779', fontWeight: 500 }}>{t}</span>)}</div>}
                </div>
              ))}
              {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#a0aab8', padding: 48, background: 'white', borderRadius: 10, fontSize: 13 }}>Keine Kunden gefunden</p>}
            </div>
          </div>
        )}

        {view === 'detail' && selected && (
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <button onClick={() => { setSelected(null); setView('customers') }} style={{ padding: '8px 14px', background: 'white', border: '1px solid #e2e7ed', borderRadius: 5, cursor: 'pointer', fontSize: 12, color: '#5a6779', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>←</span> Zurück zur Übersicht
              </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, ' + NAVY + ', ' + GOLD + ')', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 700 }}>{selected.name?.[0]}</div>
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, color: NAVY, fontWeight: 700 }}>{selected.name}</h1>
                  {selected.company && <p style={{ margin: '3px 0 0', color: '#7a8599', fontSize: 13 }}>{selected.company}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setForm(selected); setShowForm(true) }} style={{ padding: '9px 16px', background: 'white', border: '1px solid #e2e7ed', borderRadius: 5, cursor: 'pointer', fontWeight: 500, color: NAVY, fontSize: 12 }}>Bearbeiten</button>
                <button onClick={() => del(selected.id)} style={{ padding: '9px 16px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 500, fontSize: 12 }}>Löschen</button>
              </div>
            </div>

            <div style={{ background: 'white', padding: 20, borderRadius: 10, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 11, color: '#7a8599', marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status-Pipeline</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {STATUS.map((s, i) => (
                  <button key={s.id} onClick={() => updateStatus(selected.id, s.id)} style={{ flex: 1, padding: 12, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12, color: STATUS.findIndex(x => x.id === selected.status) >= i ? 'white' : '#a0aab8', background: STATUS.findIndex(x => x.id === selected.status) >= i ? s.color : '#f0f2f5', transition: 'all 0.15s' }}>{s.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 16px', color: NAVY, fontSize: 14, fontWeight: 600 }}>Kontaktdaten</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ margin: 0, color: '#5a6779', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ color: '#a0aab8' }}>📧</span> {selected.email || '—'}</p>
                  <p style={{ margin: 0, color: '#5a6779', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ color: '#a0aab8' }}>📞</span> {selected.phone || '—'}</p>
                  <p style={{ margin: 0, color: '#5a6779', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ color: '#a0aab8' }}>📍</span> {selected.address || '—'}</p>
                </div>
                {selected.tags?.length > 0 && <div style={{ display: 'flex', gap: 6, marginTop: 18, flexWrap: 'wrap' }}>{selected.tags.map(t => <span key={t} style={{ padding: '5px 12px', background: 'rgba(30,58,95,0.06)', color: NAVY, borderRadius: 4, fontSize: 11, fontWeight: 500 }}>{t}</span>)}</div>}
              </div>
              <div style={{ background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 16px', color: NAVY, fontSize: 14, fontWeight: 600 }}>Notizen</h3>
                <p style={{ color: '#5a6779', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: 13, margin: 0 }}>{selected.notes || 'Keine Notizen vorhanden'}</p>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 10, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef1f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: NAVY, fontSize: 14, fontWeight: 600 }}>Termine</h3>
                <button onClick={() => setShowApt(true)} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>+ Hinzufügen</button>
              </div>
              {showApt && (
                <div style={{ padding: 16, background: '#f8f9fb', borderBottom: '1px solid #eef1f5', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input type="date" value={aptForm.date} onChange={e => setAptForm(p => ({ ...p, date: e.target.value }))} style={{ padding: '8px 12px', borderRadius: 5, border: '1px solid #e2e7ed', fontSize: 12 }} />
                  <input type="time" value={aptForm.time} onChange={e => setAptForm(p => ({ ...p, time: e.target.value }))} style={{ padding: '8px 12px', borderRadius: 5, border: '1px solid #e2e7ed', fontSize: 12 }} />
                  <input placeholder="Beschreibung" value={aptForm.title} onChange={e => setAptForm(p => ({ ...p, title: e.target.value }))} style={{ flex: 1, padding: '8px 12px', borderRadius: 5, border: '1px solid #e2e7ed', fontSize: 12 }} />
                  <button on
