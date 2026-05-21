// Beranda — welcome page for UMKM owners (non-technical)
const LandingPage = ({ setPage }) => {
  const steps = [
    {
      n: 1, icon: '📤',
      title: 'Unggah Riwayat Transaksi',
      desc: 'Cukup 2 file sederhana: catatan uang masuk dan uang keluar. Belum siap? Pakai data contoh.',
    },
    {
      n: 2, icon: '🎯',
      title: 'Pilih Pengaturan Singkat',
      desc: 'Tentukan mau lihat berapa lama ke depan (1, 3, atau 6 bulan) dan cara menampilkan hasil.',
    },
    {
      n: 3, icon: '📋',
      title: 'Terima Laporan & Saran',
      desc: 'Sistem memberi tahu apakah usaha Anda aman atau berisiko, lengkap dengan tindakan yang bisa Anda lakukan.',
    },
  ];

  const benefits = [
    {
      icon: '🔮',
      title: 'Lihat Risiko Sebelum Terjadi',
      desc: 'Sistem belajar dari ribuan pola usaha kecil sehingga bisa memperkirakan masalah arus kas berminggu-minggu sebelum terjadi.',
    },
    {
      icon: '🌐',
      title: 'Sudah Pertimbangkan Ekonomi Nasional',
      desc: 'Inflasi, suku bunga BI, dan nilai tukar rupiah otomatis dimasukkan — Anda tidak perlu mengerti angka-angka itu.',
    },
    {
      icon: '🤝',
      title: 'Bahasa yang Mudah Dipahami',
      desc: 'Tidak ada istilah teknis. Hasilnya jelas: aman atau berisiko, naik atau turun, beserta saran yang bisa langsung dijalankan.',
    },
  ];

  return (
    <div className="content">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)',
        color: 'white', borderRadius: 'var(--r-lg)',
        padding: '40px 44px', marginBottom: 22, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -60, top: -60,
          width: 240, height: 240,
          background: 'radial-gradient(circle, rgba(52,152,219,0.35) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}/>
        <div style={{maxWidth: 720, position: 'relative'}}>
          <div style={{
            fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase',
            opacity: 0.65, fontWeight: 600, marginBottom: 10,
          }}>Selamat Datang</div>
          <h1 style={{
            fontSize: 32, fontWeight: 700, margin: '0 0 12px',
            letterSpacing: '-0.02em', lineHeight: 1.15,
          }}>
            Cek Kesehatan Arus Kas<br/>Usaha Anda
          </h1>
          <p style={{margin: 0, fontSize: 15, opacity: 0.85, lineHeight: 1.55, maxWidth: 600}}>
            Aplikasi ini membantu pemilik UMKM melihat apakah usaha mereka akan menghadapi
            masalah arus kas dalam beberapa minggu ke depan — sehingga bisa bertindak lebih awal.
          </p>
          <div style={{marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap'}}>
            <button
              className="btn btn-accent"
              style={{padding: '12px 22px', fontSize: 14}}
              onClick={() => setPage('input')}
            >
              🚀 Mulai Prediksi
            </button>
            <button
              className="btn btn-ghost"
              style={{padding: '12px 22px', fontSize: 14, background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.25)'}}
              onClick={() => setPage('riset')}
            >
              ℹ️ Tentang Sistem
            </button>
          </div>
        </div>
      </div>

      {/* Bagaimana cara kerjanya */}
      <h2 style={{
        fontSize: 18, fontWeight: 700, color: 'var(--ink)',
        margin: '8px 0 16px', letterSpacing: '-0.01em',
      }}>Bagaimana cara kerjanya?</h2>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28}}>
        {steps.map((s, i) => (
          <div key={s.n} style={{
            background: 'white', border: '1px solid var(--line)',
            borderRadius: 'var(--r-lg)', padding: '20px 22px', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 16, right: 18,
              fontSize: 40, fontWeight: 800,
              color: 'var(--line-2)', lineHeight: 1, letterSpacing: '-0.04em',
            }}>{s.n}</div>
            <div style={{fontSize: 28, marginBottom: 10}}>{s.icon}</div>
            <div style={{fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 6, letterSpacing: '-0.01em'}}>
              {s.title}
            </div>
            <div style={{fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55}}>
              {s.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Kenapa pakai sistem ini */}
      <h2 style={{
        fontSize: 18, fontWeight: 700, color: 'var(--ink)',
        margin: '8px 0 16px', letterSpacing: '-0.01em',
      }}>Apa yang membuat sistem ini berbeda?</h2>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28}}>
        {benefits.map((b, i) => (
          <div key={i} style={{
            background: 'white', border: '1px solid var(--line)',
            borderRadius: 'var(--r-lg)', padding: '18px 20px',
          }}>
            <div style={{fontSize: 22, marginBottom: 8}}>{b.icon}</div>
            <div style={{fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 6}}>
              {b.title}
            </div>
            <div style={{fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.55}}>
              {b.desc}
            </div>
          </div>
        ))}
      </div>

      {/* CTA bottom */}
      <div style={{
        background: 'var(--safe-bg)', border: '1px solid rgba(39,174,96,0.25)',
        borderRadius: 'var(--r-lg)', padding: '24px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 4}}>
            Siap mencoba?
          </div>
          <div style={{fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: 540}}>
            Tidak butuh akun, tidak butuh data sensitif. Anda bisa mulai dengan data contoh untuk melihat
            bagaimana laporannya nanti.
          </div>
        </div>
        <button className="btn btn-primary" style={{padding: '12px 22px', fontSize: 14}} onClick={() => setPage('input')}>
          Mulai Prediksi Sekarang →
        </button>
      </div>

      <div className="disclaimer">
        <strong>⚠️ Catatan:</strong> Sistem ini adalah prototipe Tugas Akhir STI ITB 2025. Hasil prediksi
        bersifat indikatif dan tidak dapat digunakan sebagai dasar tunggal keputusan bisnis.
      </div>
    </div>
  );
};

window.LandingPage = LandingPage;
