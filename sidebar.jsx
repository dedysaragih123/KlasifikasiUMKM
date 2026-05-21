// Sidebar — friendly menu for UMKM owners
const Sidebar = ({ currentPage, setPage }) => {
  const navItems = [
    { id: 'landing', icon: '🏠', label: 'Beranda',           hint: 'Halaman utama' },
    { id: 'input',   icon: '📝', label: 'Prediksi Baru',     hint: 'Mulai analisis usaha' },
    { id: 'hasil',   icon: '📊', label: 'Laporan Saya',      hint: 'Lihat hasil prediksi' },
    { id: 'detail',  icon: '🔍', label: 'Analisis Mendalam', hint: 'Telusuri detail' },
    { id: 'riset',   icon: 'ℹ️',  label: 'Tentang Sistem',    hint: 'Akurasi & cara kerja' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">💧</div>
        <div className="brand-text">
          <div className="brand-name">Cek Kesehatan Kas</div>
          <div className="brand-sub">untuk UMKM Indonesia</div>
        </div>
      </div>

      <div className="sidebar-section-label">Menu</div>
      {navItems.map(item => (
        <div
          key={item.id}
          className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
          onClick={() => setPage(item.id)}
          style={{flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '10px 12px'}}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 10, width: '100%'}}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
          {currentPage !== item.id && (
            <div style={{fontSize: 10.5, color: 'var(--ink-4)', marginLeft: 28, marginTop: 1}}>
              {item.hint}
            </div>
          )}
        </div>
      ))}

      <div className="sidebar-divider"></div>

      <div style={{
        background: 'var(--safe-bg)', border: '1px solid rgba(39,174,96,0.25)',
        borderRadius: 'var(--r-md)', padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{width: 8, height: 8, borderRadius: '50%', background: 'var(--safe)', flexShrink: 0}}></span>
        <div>
          <div style={{fontSize: 12, fontWeight: 700, color: 'var(--safe)'}}>Sistem siap digunakan</div>
          <div style={{fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1}}>
            Sudah disetel optimal untuk Anda
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        Prototipe Tugas Akhir 2025<br/>
        <strong>Dedy Hofmanindo Saragih</strong><br/>
        <span style={{opacity: 0.7}}>STI ITB · NIM 18222085</span>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
