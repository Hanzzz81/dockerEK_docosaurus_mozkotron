import React, { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(ms) {
  if (!ms || ms <= 0) return '0 min';
  const sec = Math.round(ms / 1000);
  if (sec < 60) return sec + ' s';
  const min = Math.round(sec / 60);
  if (min < 60) return min + ' min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h + ' h' + (m > 0 ? ' ' + m + ' min' : '');
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'Z');
  const now = new Date();
  const diff = now - d;
  if (diff < 3600000) return Math.round(diff / 60000) + ' min zpět';
  if (diff < 86400000) return Math.round(diff / 3600000) + ' h zpět';
  if (diff < 172800000) return 'včera';
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Dobrý večer';
  if (h < 12) return 'Dobré ráno';
  if (h < 18) return 'Dobré odpoledne';
  return 'Dobrý večer';
}

// ---------------------------------------------------------------------------
// SVG ikony (pro widgety — sidebar ikony řeší Docusaurus)
// ---------------------------------------------------------------------------
function SvgDoc({ color = '#8b8070', size = 14 }) {
  return (
    <svg width={size} height={size + 2} viewBox="0 0 14 16" fill="none" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
      <path d="M2 1C1.45 1 1 1.45 1 2V14C1 14.55 1.45 15 2 15H12C12.55 15 13 14.55 13 14V5L9 1H2Z" fill={color} opacity="0.15" stroke={color} strokeWidth="0.8"/>
      <path d="M9 1V5H13" stroke={color} strokeWidth="0.8" fill={color} opacity="0.25"/>
      <line x1="3.5" y1="8" x2="10.5" y2="8" stroke={color} strokeWidth="0.6" opacity="0.4"/>
      <line x1="3.5" y1="10" x2="10.5" y2="10" stroke={color} strokeWidth="0.6" opacity="0.4"/>
      <line x1="3.5" y1="12" x2="8" y2="12" stroke={color} strokeWidth="0.6" opacity="0.4"/>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
function StatCard({ value, label }) {
  return (
    <div style={{
      background: '#faf8f2', border: '1px solid #d8d0be',
      borderRadius: 10, padding: '0.8rem', textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1710' }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: '#8b8070', marginTop: '0.15rem' }}>{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Widget wrapper
// ---------------------------------------------------------------------------
function Widget({ icon, title, badge, full, children }) {
  return (
    <div style={{
      background: '#f5f1e8', border: '1px solid #d8d0be', borderRadius: 12,
      padding: '1.2rem 1.5rem',
      gridColumn: full ? '1 / -1' : undefined,
    }}>
      <div style={{
        fontSize: '0.95rem', fontWeight: 600, color: '#92400e',
        marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        {title}
        {badge > 0 && (
          <span style={{
            background: '#fef3cd', color: '#92400e', fontSize: '0.7rem',
            fontWeight: 700, padding: '1px 8px', borderRadius: 10, marginLeft: 'auto',
          }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reading Stats Widget
// ---------------------------------------------------------------------------
function ReadingStatsWidget({ data }) {
  if (!data || !data.enabled) return null;
  const s = data;
  return (
    <Widget icon="📊" title={s.title}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '0.8rem', marginBottom: '1rem',
      }}>
        <StatCard value={s.pagesRead} label="Přečteno stránek" />
        <StatCard value={s.totalAvailable} label="Celkem přiřazeno" />
        <StatCard value={formatTime(s.totalActiveTimeMs)} label="Celkový čas" />
        <StatCard value={s.confirmsDone} label="Potvrzení" />
      </div>
      {/* Progress bar */}
      <div style={{
        width: '100%', height: 10, background: '#d8d0be',
        borderRadius: 5, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 5, width: s.progressPct + '%',
          background: 'linear-gradient(90deg, #d97706, #4ade80)',
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: '0.78rem', color: '#8b8070', marginTop: '0.3rem',
      }}>
        <span>{s.progressPct}% přečteno</span>
        {s.lastActivity && <span>Poslední aktivita: {formatDate(s.lastActivity)}</span>}
      </div>
      {/* Recent pages */}
      {s.recentPages && s.recentPages.length > 0 && (
        <>
          <div style={{
            marginTop: '1rem', color: '#92400e', fontSize: '0.82rem',
            fontWeight: 600, marginBottom: '0.5rem',
          }}>Naposledy navštívené</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {s.recentPages.map((rp, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.45rem 0', borderBottom: i < s.recentPages.length - 1 ? '1px solid #e8e2d4' : 'none',
                fontSize: '0.82rem',
              }}>
                <SvgDoc color="#8b8070" />
                <span style={{ flex: 1 }}><a href={rp.url} style={{ color: '#2d2a24', textDecoration: 'none' }}>{rp.title}</a></span>
                <span style={{ fontSize: '0.72rem', color: '#8b8070', whiteSpace: 'nowrap' }}>{formatDate(rp.lastVisit)}</span>
                <span style={{ fontSize: '0.72rem', color: '#8b8070', width: 60, textAlign: 'right' }}>{formatTime(rp.totalTimeMs)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Widget>
  );
}

// ---------------------------------------------------------------------------
// Unread Pages Widget
// ---------------------------------------------------------------------------
function UnreadPagesWidget({ data }) {
  if (!data || !data.enabled) return null;
  const u = data;
  return (
    <Widget icon="📋" title={u.title} badge={u.totalUnread}>
      {u.pages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#8b8070', fontSize: '0.85rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.4 }}>✅</div>
          Všechny přiřazené stránky máš přečtené!
        </div>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {u.pages.map((pg, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.5rem 0.3rem',
                borderBottom: i < u.pages.length - 1 ? '1px solid #e8e2d4' : 'none',
                fontSize: '0.82rem',
              }}>
                <SvgDoc color={pg.accessType === 'required' ? '#4ade80' : '#60a5fa'} />
                <span style={{ flex: 1 }}>
                  <a href={pg.url} style={{ color: '#2d2a24', textDecoration: 'none' }}>{pg.title}</a>
                  {pg.folder && <span style={{ fontSize: '0.72rem', color: '#8b8070', marginLeft: '0.3rem' }}>/ {pg.folder}</span>}
                </span>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 600, padding: '1px 7px', borderRadius: 10,
                  background: pg.accessType === 'required' ? '#d1fae5' : '#dbeafe',
                  color: pg.accessType === 'required' ? '#059669' : '#2563eb',
                }}>{pg.accessType === 'required' ? 'povinné' : 'informační'}</span>
              </li>
            ))}
          </ul>
          {u.totalUnread > u.pages.length && (
            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.78rem', color: '#8b8070' }}>
              a dalších {u.totalUnread - u.pages.length} stránek...
            </div>
          )}
        </>
      )}
    </Widget>
  );
}

// ---------------------------------------------------------------------------
// Quick Links Widget
// ---------------------------------------------------------------------------
function QuickLinksWidget({ data }) {
  if (!data || !data.enabled) return null;
  const ql = data;
  return (
    <Widget icon="🔗" title={ql.title} full>
      {ql.links.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '0.8rem', color: '#8b8070', fontSize: '0.85rem' }}>
          Zatím nejsou nastaveny žádné rychlé odkazy. Správce je může přidat v administraci.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {ql.links.map((link, i) => (
            <a key={i} href={link.url} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: '#faf8f2', border: '1px solid #d8d0be', borderRadius: 8,
              padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#2d2a24',
              textDecoration: 'none', transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: '1rem' }}>{link.icon || '📄'}</span>
              {link.label}
            </a>
          ))}
        </div>
      )}
    </Widget>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Component
// ---------------------------------------------------------------------------
export default function HomeDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/home')
      .then(res => {
        if (!res.ok) throw new Error('API error ' + res.status);
        return res.json();
      })
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#8b8070' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.4 }}>⚠️</div>
        Nepodařilo se načíst data.<br /><small>{error}</small>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#8b8070', fontSize: '0.85rem' }}>
        Načítám přehled...
      </div>
    );
  }

  const user = data.user;
  const w = data.widgets;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', color: '#1a1710', marginBottom: '0.2rem', border: 'none', paddingBottom: 0 }}>
        {getGreeting()}, {user.firstName}!
      </h1>
      <p style={{ color: '#8b8070', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Tvůj osobní přehled v Mozkotron
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1.2rem',
      }}>
        <ReadingStatsWidget data={w.readingStats} />
        <UnreadPagesWidget data={w.unreadPages} />
        <QuickLinksWidget data={w.quickLinks} />
      </div>
    </div>
  );
}
