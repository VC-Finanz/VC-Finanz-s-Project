import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STATUS = [
  { id: 'erstkontakt', label: 'Erstkontakt', color: '#3b82f6' },
  { id: 'konzept', label: 'Konzept', color: '#c9a227' },
  { id: 'telefonliste', label: 'Telefonliste/BN Bezüge', color: '#8b5cf6' },
  { id: 'abschluss', label: 'Abschluss', color: '#10b981' },
]

const TAGS = ['VIP', 'Privat', 'Gewerbe', 'BU-Interesse', 'Altersvorsorge', 'Bestandskunde', 'Empfehlung']

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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <aside style={{ width: 280, background: NAVY, padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 48, padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 8, height: 32, background: NAVY, border: '2px solid ' + GOLD, marginRight: 4 }}></div>
              <div style={{ width: 16, height: 16, borderBottom: '3px solid ' + GOLD, borderRight: '3px solid ' + GOLD, transform: 'rotate(45deg)', marginTop: -12 }}></div>
            </div>
            <div>
              <div style={{ color: GOLD, fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>V&C</div>
              <div style={{ color: GOLD, fontSize: 14, fontWeight: 600, letterSpacing: 3 }}>FINANZ</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1 }}>
          <button onClick={() => setView('dashboard')} style={{ width: '100%', padding: '14px 20px', textAlign: 'left', border: 'none', borderRadius: 8, marginBottom: 8, cursor: 'pointer', background: view === 'dashboard' ? 'rgba(201,162,39,0.15)' : 'transparent', color: view === 'dashboard' ? GOLD : 'rgba(255,255,255,0.7)', fontWeight: 500, fontSize: 15, display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}>
            <span style={{ fontSize: 18 }}>📊</span> Dashboard
          </button>
          <button onClick={() => setView('customers')} style={{ width: '100%', padding: '14px 20px', textAlign: 'left', border: 'none', borderRadius: 8, cursor: 'pointer', background: view === 'customers' || view === 'detail' ? 'rgba(201,162,39,0.15)' : 'transparent', color: view === 'customers' || view === 'detail' ? GOLD : 'rgba(255,255,255,0.7)', fontWeight: 500, fontSize: 15, display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}>
            <span style={{ fontSize: 18 }}>👥</span> Kunden
          </button>
        </nav>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, marginTop: 20 }}>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{user.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 12 }}>{user.username}</div>
          <button onClick={() => setUser(null)} style={{ color: GOLD, background: 'transparent', border: '1px solid ' + GOLD, padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s' }}>Abmelden</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {view === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 28, color: NAVY, fontWeight: 700 }}>Dashboard</h1>
                <p style={{ color: '#64748b', margin: '8px 0 0', fontSize: 15 }}>Willkommen zurück, {user.name}</p>
              </div>
              <button onClick={() => { setForm({}); setShowForm(true) }} style={{ padding: '14px 28px', background: GOLD, color: NAVY, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, boxShadow: '0 4px 14px rgba(201,162,39,0.35)', transition: 'all 0.2s' }}>+ Neuer Kunde</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
              {STATUS.map(s => (
                <div key={s.id} style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid ' + s.color }}>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                  <div style={{ fontSize: 42, fontWeight: 700, color: NAVY, marginTop: 8 }}>{stats[s.id] || 0}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #eef2f6', fontWeight: 600, color: NAVY, fontSize: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>📅</span> Nächste Termine
                </div>
                {upcoming.length === 0 ? <p style={{ padding: 24, color: '#94a3b8', textAlign: 'center' }}>Keine anstehenden Termine</p> : upcoming.map((a, i) => (
                  <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid #f8f9fa', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => { setSelected(customers.find(c => c.id === a.cid)); setView('detail') }}>
                    <div style={{ fontWeight: 600, color: NAVY }}>{a.title}</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{a.customer} • {a.date} {a.time && 'um ' + a.time}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #eef2f6', fontWeight: 600, color: NAVY, fontSize: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>👥</span> Neueste Kunden
                </div>
                {customers.slice(0, 5).map(c => (
                  <div key={c.id} style={{ padding: '16px 24px', borderBottom: '1px solid #f8f9fa', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }} onClick={() => { setSelected(c); setView('detail') }}>
                    <div>
                      <div style={{ fontWeight: 600, color: NAVY }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{c.company || c.email}</div>
                    </div>
                    <span style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, color: 'white', fontWeight: 500, background: STATUS.find(s => s.id === c.status)?.color }}>{STATUS.find(s => s.id === c.status)?.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'customers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h1 style={{ margin: 0, fontSize: 28, color: NAVY, fontWeight: 700 }}>Kunden</h1>
              <button onClick={() => { setForm({}); setShowForm(true) }} style={{ padding: '14px 28px', background: GOLD, color: NAVY, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, boxShadow: '0 4px 14px rgba(201,162,39,0.35)' }}>+ Neuer Kunde</button>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <input placeholder="🔍 Kunden suchen..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: '14px 20px', borderRadius: 8, border: '2px solid #eef2f6', fontSize: 14, transition: 'border 0.2s', outline: 'none' }} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = '#eef2f6'} />
              <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '14px 20px', borderRadius: 8, border: '2px solid #eef2f6', fontSize: 14, background: 'white', cursor: 'pointer' }}>
                <option value="all">Alle Status</option>
                {STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(c => (
                <div key={c.id} onClick={() => { setSelected(c); setView('detail') }} style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.2s', borderLeft: '4px solid ' + STATUS.find(s => s.id === c.status)?.color }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 17, color: NAVY }}>{c.name}</div>
                      {c.company && <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>🏢 {c.company}</div>}
                      <div style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>
                        {c.email && <span>📧 {c.email}</span>}
                        {c.phone && <span style={{ marginLeft: c.email ? 16 : 0 }}>📞 {c.phone}</span>}
                      </div>
                    </div>
                    <span style={{ padding: '8px 16px', borderRadius: 6, fontSize: 12, color: 'white', fontWeight: 600, height: 'fit-content', background: STATUS.find(s => s.id === c.status)?.color }}>{STATUS.find(s => s.id === c.status)?.label}</span>
                  </div>
                  {c.tags?.length > 0 && <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>{c.tags.map(t => <span key={t} style={{ padding: '6px 12px', background: '#f8f9fa', borderRadius: 6, fontSize: 12, color: '#64748b', fontWeight: 500 }}>{t}</span>)}</div>}
                </div>
              ))}
              {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: 60, background: 'white', borderRadius: 12 }}>Keine Kunden gefunden</p>}
            </div>
          </div>
        )}

        {view === 'detail' && selected && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <button onClick={() => { setSelected(null); setView('customers') }} style={{ padding: '10px 14px', background: 'white', border: '2px solid #eef2f6', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>←</button>
                <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, ' + NAVY + ', ' + GOLD + ')', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 26, fontWeight: 700 }}>{selected.name?.[0]}</div>
                <div>
                  <h1 style={{ margin: 0, fontSize: 26, color: NAVY, fontWeight: 700 }}>{selected.name}</h1>
                  {selected.company && <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 15 }}>🏢 {selected.company}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setForm(selected); setShowForm(true) }} style={{ padding: '12px 20px', background: 'white', border: '2px solid #eef2f6', borderRadius: 8, cursor: 'pointer', fontWeight: 500, color: NAVY }}>✏️ Bearbeiten</button>
                <button onClick={() => del(selected.id)} style={{ padding: '12px 20px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>🗑️ Löschen</button>
              </div>
            </div>

            <div style={{ background: 'white', padding: 24, borderRadius: 12, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16, fontWeight: 600 }}>STATUS-PIPELINE</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {STATUS.map((s, i) => (
                  <button key={s.id} onClick={() => updateStatus(selected.id, s.id)} style={{ flex: 1, padding: 14, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: STATUS.findIndex(x => x.id === selected.status) >= i ? 'white' : '#94a3b8', background: STATUS.findIndex(x => x.id === selected.status) >= i ? s.color : '#f1f5f9', transition: 'all 0.2s' }}>{s.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 20px', color: NAVY, fontSize: 16, fontWeight: 600 }}>📋 Kontaktdaten</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ margin: 0, color: '#475569', display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 28 }}>📧</span> {selected.email || '—'}</p>
                  <p style={{ margin: 0, color: '#475569', display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 28 }}>📞</span> {selected.phone || '—'}</p>
                  <p style={{ margin: 0, color: '#475569', display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 28 }}>📍</span> {selected.address || '—'}</p>
                </div>
                {selected.tags?.length > 0 && <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>{selected.tags.map(t => <span key={t} style={{ padding: '6px 14px', background: 'rgba(30,58,95,0.08)', color: NAVY, borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{t}</span>)}</div>}
              </div>
              <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 20px', color: NAVY, fontSize: 16, fontWeight: 600 }}>📝 Notizen</h3>
                <p style={{ color: '#475569', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selected.notes || 'Keine Notizen vorhanden'}</p>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 12, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: NAVY, fontSize: 16, fontWeight: 600 }}>📅 Termine</h3>
                <button onClick={() => setShowApt(true)} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>+ Hinzufügen</button>
              </div>
              {showApt && (
                <div style={{ padding: 20, background: '#f8f9fa', borderBottom: '1px solid #eef2f6', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <input type="date" value={aptForm.date} onChange={e => setAptForm(p => ({ ...p, date: e.target.value }))} style={{ padding: 10, borderRadius: 6, border: '2px solid #eef2f6' }} />
                  <input type="time" value={aptForm.time} onChange={e => setAptForm(p => ({ ...p, time: e.target.value }))} style={{ padding: 10, borderRadius: 6, border: '2px solid #eef2f6' }} />
                  <input placeholder="Beschreibung" value={aptForm.title} onChange={e => setAptForm(p => ({ ...p, title: e.target.value }))} style={{ flex: 1, padding: 10, borderRadius: 6, border: '2px solid #eef2f6' }} />
                  <button onClick={addApt} disabled={!aptForm.title || !aptForm.date} style={{ padding: '10px 20px', background: GOLD, color: NAVY, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, opacity: aptForm.title && aptForm.date ? 1 : 0.5 }}>Speichern</button>
                </div>
              )}
              {(selected.appointments || []).length === 0 ? <p style={{ padding: 24, color: '#94a3b8', textAlign: 'center' }}>Keine Termine</p> : (selected.appointments || []).map((a, i) => (
                <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid #f8f9fa' }}>
                  <div style={{ fontWeight: 600, color: NAVY }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>📅 {a.date} {a.time && '• 🕐 ' + a.time + ' Uhr'}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: NAVY, fontSize: 16, fontWeight: 600 }}>💬 Kontakt-Historie</h3>
                <button onClick={() => setShowContact(true)} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>+ Hinzufügen</button>
              </div>
              {showContact && (
                <div style={{ padding: 20, background: '#f8f9fa', borderBottom: '1px solid #eef2f6', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <select value={contactForm.type} onChange={e => setContactForm(p => ({ ...p, type: e.target.value }))} style={{ padding: 10, borderRadius: 6, border: '2px solid #eef2f6' }}>
                    <option>Telefon</option><option>E-Mail</option><option>Persönlich</option><option>Video-Call</option>
                  </select>
                  <input placeholder="Was wurde besprochen?" value={contactForm.note} onChange={e => setContactForm(p => ({ ...p, note: e.target.value }))} style={{ flex: 1, padding: 10, borderRadius: 6, border: '2px solid #eef2f6' }} />
                  <button onClick={addContact} disabled={!contactForm.note} style={{ padding: '10px 20px', background: GOLD, color: NAVY, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, opacity: contactForm.note ? 1 : 0.5 }}>Speichern</button>
                </div>
              )}
              {(selected.contacts || []).length === 0 ? <p style={{ padding: 24, color: '#94a3b8', textAlign: 'center' }}>Keine Kontakte erfasst</p> : (selected.contacts || []).map((c, i) => (
                <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid #f8f9fa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: NAVY, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {c.type === 'Telefon' && '📞'}{c.type === 'E-Mail' && '📧'}{c.type === 'Persönlich' && '🤝'}{c.type === 'Video-Call' && '💻'} {c.type}
                    </span>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{c.date}</span>
                  </div>
                  <p style={{ margin: '8px 0 0', color: '#475569' }}>{c.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,58,95,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 24px', color: NAVY, fontSize: 22, fontWeight: 700 }}>{form.id ? 'Kunde bearbeiten' : 'Neuer Kunde'}</h3>
            <input placeholder="Name *" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: 14, borderRadius: 8, border: '2px solid #eef2f6', marginBottom: 16, fontSize: 15 }} />
            <input placeholder="Firma" value={form.company || ''} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} style={{ width: '100%', padding: 14, borderRadius: 8, border: '2px solid #eef2f6', marginBottom: 16, fontSize: 15 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <input placeholder="E-Mail" value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={{ padding: 14, borderRadius: 8, border: '2px solid #eef2f6', fontSize: 15 }} />
              <input placeholder="Telefon" value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={{ padding: 14, borderRadius: 8, border: '2px solid #eef2f6', fontSize: 15 }} />
            </div>
            <input placeholder="Adresse" value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} style={{ width: '100%', padding: 14, borderRadius: 8, border: '2px solid #eef2f6', marginBottom: 16, fontSize: 15 }} />
            {form.id && (
              <select value={form.status || 'erstkontakt'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ width: '100%', padding: 14, borderRadius: 8, border: '2px solid #eef2f6', marginBottom: 16, fontSize: 15, background: 'white' }}>
                {STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            )}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 10, fontWeight: 600 }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {TAGS.map(t => (
                  <button key={t} type="button" onClick={() => setForm(p => ({ ...p, tags: (p.tags || []).includes(t) ? p.tags.filter(x => x !== t) : [...(p.tags || []), t] }))} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', background: (form.tags || []).includes(t) ? GOLD : '#f1f5f9', color: (form.tags || []).includes(t) ? NAVY : '#64748b', fontWeight: 500, transition: 'all 0.2s' }}>{t}</button>
                ))}
              </div>
            </div>
            <textarea placeholder="Notizen" value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ width: '100%', padding: 14, borderRadius: 8, border: '2px solid #eef2f6', marginBottom: 24, minHeight: 100, fontSize: 15, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={save} disabled={!form.name} style={{ flex: 1, padding: 16, background: GOLD, color: NAVY, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 15, opacity: form.name ? 1 : 0.5 }}>Speichern</button>
              <button onClick={() => setShowForm(false)} style={{ padding: '16px 28px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 15, color: '#64748b' }}>Abbrechen</button>
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, ' + NAVY + ' 0%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', padding: 48, borderRadius: 24, width: '100%', maxWidth: 420, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 10, height: 40, background: 'transparent', border: '3px solid ' + GOLD, marginRight: 4 }}></div>
              <div style={{ width: 20, height: 20, borderBottom: '4px solid ' + GOLD, borderRight: '4px solid ' + GOLD, transform: 'rotate(45deg)', marginTop: -16 }}></div>
            </div>
            <div>
              <div style={{ color: GOLD, fontSize: 32, fontWeight: 700, letterSpacing: 2 }}>V&C</div>
              <div style={{ color: GOLD, fontSize: 18, fontWeight: 600, letterSpacing: 4 }}>FINANZ</div>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 14 }}>Kundenmanagement</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input placeholder="Benutzername" value={u} onChange={e => setU(e.target.value)} style={{ width: '100%', padding: 16, borderRadius: 10, border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 15 }} />
          <input type="password" placeholder="Passwort" value={p} onChange={e => setP(e.target.value)} onKeyPress={e => e.key === 'Enter' && submit()} style={{ width: '100%', padding: 16, borderRadius: 10, border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 15 }} />
          {err && <p style={{ color: '#f87171', fontSize: 14, margin: 0, padding: '12px 16px', background: 'rgba(248,113,113,0.1)', borderRadius: 8 }}>{err}</p>}
          <button onClick={submit} disabled={loading} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg, ' + GOLD + ', #d4af37)', color: NAVY, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 15, marginTop: 8, boxShadow: '0 8px 24px rgba(201,162,39,0.3)' }}>{loading ? 'Laden...' : 'Anmelden'}</button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', marginTop: 32 }}>Demo: admin / admin123</p>
      </div>
    </div>
  )
}
