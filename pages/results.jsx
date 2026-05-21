// Halaman Hasil Prediksi — laporan untuk pemilik UMKM (bahasa awam)
const ResultsPage = ({ setPage, predictionDone, prediction, submittedUMKM, umkmList, peerList, thresholds, q25q75, setSelectedUMKM }) => {
  const gaugeRef = React.useRef(null);
  const peerBarRef = React.useRef(null);
  const clrMiniRef = React.useRef(null);

  if (!predictionDone || !submittedUMKM) {
    return (
      <div className="content">
        <div className="page-header">
          <h1 className="page-title">📊 Laporan Saya</h1>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>Belum ada laporan</h3>
            <p>Mulai prediksi baru untuk melihat hasil di sini.</p>
            <button className="btn btn-primary" onClick={() => setPage('input')}>← Mulai Prediksi Baru</button>
          </div>
        </div>
      </div>
    );
  }

  const horizon = prediction.horizon;
  const tau = prediction.tau;
  const qs = q25q75[horizon];
  const u = submittedUMKM;
  const isHR = u.prob >= tau;

  // Friendly labels
  const horizonLabel = horizon === 4 ? '1 bulan' : horizon === 12 ? '3 bulan' : '6 bulan';
  const cashHealthLabel = u.clrLast < qs.q25 ? 'Tipis' : u.clrLast > qs.q75 ? 'Sehat' : 'Sedang';
  const cashHealthColor = u.clrLast < qs.q25 ? 'var(--hr)' : u.clrLast > qs.q75 ? 'var(--safe)' : 'var(--warn)';
  const trendLabel = u.tren === 'up' ? 'Menaik' : u.tren === 'down' ? 'Menurun' : 'Stabil';
  const trendIcon = u.tren === 'up' ? '📈' : u.tren === 'down' ? '📉' : '➡️';
  const trendColor = u.tren === 'up' ? 'var(--safe)' : u.tren === 'down' ? 'var(--hr)' : 'var(--ink-3)';

  // Peer ranking
  const peerWithSelf = [...peerList.map(p => ({ ...p, _self: false })), { ...u, _self: true }];
  const sorted = [...peerWithSelf].sort((a, b) => b.prob - a.prob);
  const rank = sorted.findIndex(x => x._self) + 1;
  const peerHR = peerList.filter(p => p.prob >= tau).length;
  const peerSafe = peerList.length - peerHR;

  // ===== Gauge (friendly) =====
  React.useEffect(() => {
    if (!gaugeRef.current) return;
    Plotly.react(gaugeRef.current, [{
      type: 'indicator',
      mode: 'gauge+number',
      value: u.prob * 100,
      number: { suffix: '%', valueformat: '.0f', font: { size: 36, family: 'Inter', color: '#2C3E50' } },
      gauge: {
        axis: {
          range: [0, 100], tickwidth: 0, tickcolor: 'transparent',
          tickvals: [0, 50, 100], ticktext: ['Aman', '', 'Berisiko'],
          tickfont: { size: 10, family: 'Inter', color: '#5D6D7E' },
        },
        bar: { color: isHR ? '#E74C3C' : '#27AE60', thickness: 0.3 },
        bgcolor: 'white', borderwidth: 1, bordercolor: '#ECF0F1',
        steps: [
          { range: [0, 30], color: 'rgba(39, 174, 96, 0.15)' },
          { range: [30, 60], color: 'rgba(243, 156, 18, 0.18)' },
          { range: [60, 100], color: 'rgba(231, 76, 60, 0.18)' },
        ],
      },
    }], {
      height: 200,
      margin: { l: 30, r: 30, t: 30, b: 10 },
      font: { family: 'Inter' },
      paper_bgcolor: 'rgba(0,0,0,0)',
    }, { displayModeBar: false, responsive: true });
  }, [u, tau, isHR]);

  // ===== Mini timeline (kesehatan kas mingguan) =====
  React.useEffect(() => {
    if (!clrMiniRef.current) return;
    const weeks = u.clrSeries.map((_, i) => i + 1);
    Plotly.react(clrMiniRef.current, [
      // Batas waspada
      { type: 'scatter', x: [weeks[0], weeks[weeks.length - 1]], y: [qs.q25, qs.q25],
        mode: 'lines', line: { color: '#E74C3C', width: 1, dash: 'dash' },
        name: 'Batas waspada', hoverinfo: 'skip' },
      // Batas aman
      { type: 'scatter', x: [weeks[0], weeks[weeks.length - 1]], y: [qs.q75, qs.q75],
        mode: 'lines', line: { color: '#27AE60', width: 1, dash: 'dash' },
        name: 'Batas aman', hoverinfo: 'skip' },
      // Aktual
      { type: 'scatter', x: weeks, y: u.clrSeries, mode: 'lines+markers',
        name: 'Kesehatan kas Anda', line: { color: '#2C3E50', width: 2 },
        marker: { size: 5, color: '#2C3E50' },
        hovertemplate: 'Minggu ke-%{x}<br>Rasio kas: <b>%{y:.2f}</b><extra></extra>' },
    ], {
      template: 'plotly_white',
      xaxis: { title: { text: 'Minggu ke-', font: { size: 10, color: '#5D6D7E' } }, gridcolor: '#ECF0F1', tickfont: { size: 10 } },
      yaxis: { title: { text: 'Rasio uang masuk ÷ keluar', font: { size: 10, color: '#5D6D7E' } }, gridcolor: '#ECF0F1', tickfont: { size: 10 } },
      margin: { l: 50, r: 16, t: 10, b: 40 },
      height: 200, showlegend: false,
      font: { family: 'Inter' },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
    }, { displayModeBar: false, responsive: true });
  }, [u, qs]);

  // ===== Distribusi skor risiko (anonim, tanpa nama usaha lain) =====
  React.useEffect(() => {
    if (!peerBarRef.current) return;
    // Bucket peer scores into 10 bins (0-10%, 10-20%, ..., 90-100%)
    const bins = Array(10).fill(0);
    peerList.forEach(p => {
      const b = Math.min(9, Math.floor(p.prob * 10));
      bins[b]++;
    });
    const binLabels = bins.map((_, i) => `${i * 10}–${(i + 1) * 10}%`);
    const userBin = Math.min(9, Math.floor(u.prob * 10));

    Plotly.react(peerBarRef.current, [
      // Histogram of all peers (anonymous)
      {
        type: 'bar',
        x: binLabels,
        y: bins,
        marker: {
          color: binLabels.map((_, i) => i < 3 ? '#27AE60' : i < 6 ? '#F39C12' : '#E74C3C'),
          opacity: binLabels.map((_, i) => i === userBin ? 1 : 0.35),
          line: {
            color: binLabels.map((_, i) => i === userBin ? '#1F6FA8' : 'transparent'),
            width: binLabels.map((_, i) => i === userBin ? 3 : 0),
          },
        },
        text: bins.map(c => c > 0 ? `${c} usaha` : ''),
        textposition: 'inside',
        textfont: { size: 11, color: 'white', family: 'Inter' },
        hovertemplate: 'Skor %{x}<br>%{y} usaha<extra></extra>',
        showlegend: false,
      },
    ], {
      template: 'plotly_white',
      xaxis: {
        title: { text: 'Skor risiko (semakin ke kanan, semakin berisiko)', font: { size: 11, color: '#5D6D7E' } },
        gridcolor: '#ECF0F1', tickfont: { size: 11, family: 'Inter' },
      },
      yaxis: {
        title: { text: 'Jumlah usaha', font: { size: 11, color: '#5D6D7E' } },
        gridcolor: '#ECF0F1', tickfont: { size: 10 },
      },
      shapes: [{
        type: 'line', xref: 'x', yref: 'paper',
        x0: userBin, x1: userBin, y0: 0, y1: 0.85,
        line: { color: '#1F6FA8', width: 3, dash: 'solid' },
      }],
      annotations: [{
        x: userBin, y: 0.95, xref: 'x', yref: 'paper',
        text: `<b>↓ Anda di sini</b><br>${(u.prob * 100).toFixed(0)}%`,
        showarrow: false,
        font: { color: '#1F6FA8', size: 12, family: 'Inter' },
        bgcolor: 'white', bordercolor: '#1F6FA8', borderwidth: 1.5, borderpad: 6,
      }],
      margin: { l: 60, r: 30, t: 50, b: 50 },
      height: 320,
      font: { family: 'Inter' },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      bargap: 0.15,
    }, { displayModeBar: false, responsive: true });
  }, [peerList, u, tau]);

  const downloadReport = () => {
    const lines = [
      'keterangan,nilai',
      `nama_usaha,"${u.nama}"`,
      `kode_usaha,${u.id}`,
      `jenis_usaha,${u.sektor}`,
      `rentang_prediksi,${horizonLabel}`,
      `status,${isHR ? 'BERISIKO' : 'AMAN'}`,
      `skor_risiko_persen,${(u.prob * 100).toFixed(0)}`,
      `kesehatan_kas,${cashHealthLabel}`,
      `tren_4_minggu,${trendLabel}`,
      `total_uang_masuk,${u.totalInflow}`,
      `total_uang_keluar,${u.totalOutflow}`,
      `riwayat_minggu,${u.weeks}`,
      `rentang_data,"${u.dateRange}"`,
      `peringkat_vs_lainnya,"${rank} dari ${sorted.length}"`,
      `tanggal_laporan,${u.submittedAt}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_${u.id}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="content">
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap: 'wrap', gap: 10}}>
        <div>
          <div className="page-eyebrow">Laporan Prediksi · {horizonLabel} ke depan</div>
          <h1 className="page-title">{u.nama}</h1>
          <p className="page-sub">
            {u.sektor} · {u.weeks} minggu riwayat ({u.dateRange})
          </p>
        </div>
        <div style={{display: 'flex', gap: 8}}>
          <button className="btn btn-ghost" onClick={() => setPage('input')}>← Prediksi Usaha Lain</button>
          <button className="btn btn-accent" onClick={downloadReport}>📥 Unduh Laporan</button>
        </div>
      </div>

      {/* Hero verdict */}
      <div className={`verdict-hero ${isHR ? 'verdict-hr' : 'verdict-safe'}`}>
        <div className="verdict-left">
          <div className="verdict-badge">
            <span className="dotmark"></span>
            {isHR ? 'BERISIKO' : 'AMAN'}
          </div>
          <h2 className="verdict-headline">
            {isHR
              ? <>Usaha Anda <strong>berpotensi mengalami kesulitan arus kas</strong> dalam {horizonLabel} ke depan.</>
              : <>Usaha Anda <strong>diperkirakan aman</strong> dalam {horizonLabel} ke depan.</>}
          </h2>
          <p className="verdict-sub">
            {isHR
              ? 'Pola arus kas Anda mirip dengan usaha-usaha yang pernah mengalami masalah likuiditas. Sebaiknya ambil tindakan pencegahan sejak sekarang.'
              : 'Pola arus kas Anda menunjukkan kondisi yang sehat. Pertahankan kebiasaan baik ini dan pantau secara berkala.'}
          </p>
          <div className="verdict-stats">
            <div className="vstat">
              <div className="vstat-label">Kesehatan Kas</div>
              <div className="vstat-value" style={{color: cashHealthColor}}>{cashHealthLabel}</div>
              <div className="vstat-hint">Berdasarkan rasio terakhir</div>
            </div>
            <div className="vstat">
              <div className="vstat-label">Tren 4 Minggu</div>
              <div className="vstat-value" style={{color: trendColor}}>
                <span style={{fontSize: 16, marginRight: 4}}>{trendIcon}</span>
                {trendLabel}
              </div>
              <div className="vstat-hint">
                {u.tren === 'up' ? 'Arah membaik' : u.tren === 'down' ? 'Perlu perhatian' : 'Tidak banyak berubah'}
              </div>
            </div>
            <div className="vstat">
              <div className="vstat-label">Posisi vs Usaha Lain</div>
              <div className="vstat-value mono">{rank} / {sorted.length}</div>
              <div className="vstat-hint">Paling berisiko ke-{rank}</div>
            </div>
            <div className="vstat">
              <div className="vstat-label">Uang Masuk vs Keluar</div>
              <div className="vstat-value mono" style={{fontSize: 19}}>
                {(u.totalInflow / u.totalOutflow).toFixed(2)}×
              </div>
              <div className="vstat-hint">Selama {u.weeks} minggu</div>
            </div>
          </div>
        </div>
        <div className="verdict-right">
          <div className="vstat-label" style={{textAlign: 'center'}}>Skor Risiko</div>
          <div ref={gaugeRef}></div>
          <div style={{textAlign: 'center', fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.5}}>
            Semakin tinggi angkanya,<br/>semakin perlu diwaspadai.
          </div>
        </div>
      </div>

      {/* Trend + Action grid */}
      <div className="grid-2" style={{margin: '18px 0'}}>
        <div className="card">
          <div className="card-title">📈 Kesehatan Kas Anda Tiap Minggu</div>
          <div className="card-sub">
            Garis tebal = catatan Anda. <span style={{color: 'var(--hr)'}}>Garis merah</span> = batas waspada,
            <span style={{color: 'var(--safe)'}}> garis hijau</span> = batas aman.
          </div>
          <div ref={clrMiniRef}></div>
        </div>
        <div className="card">
          <div className="card-title">🎯 Yang Sebaiknya Anda Lakukan</div>
          <div className="card-sub">Saran berdasarkan kondisi usaha Anda saat ini.</div>
          <div style={{marginTop: 10}}>
            {isHR ? (
              <ul style={{margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.8}}>
                <li><strong>Tagih piutang Anda</strong> — hubungi pelanggan yang belum bayar untuk mempercepat uang masuk.</li>
                <li><strong>Kurangi pengeluaran tidak mendesak</strong> dalam {horizonLabel} ke depan.</li>
                <li><strong>Negosiasi dengan pemasok</strong> — minta tempo pembayaran lebih panjang bila memungkinkan.</li>
                <li>Buka <strong>Analisis Mendalam</strong> untuk memahami penyebab utama prediksi ini.</li>
              </ul>
            ) : (
              <ul style={{margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.8}}>
                <li><strong>Pertahankan kebiasaan baik</strong> — jaga pemasukan agar tetap stabil seperti sekarang.</li>
                <li>Gunakan kondisi sehat ini untuk <strong>menambah stok</strong> atau berinvestasi pada usaha.</li>
                <li><strong>Periksa kembali setiap bulan</strong> agar perubahan kecil bisa segera terdeteksi.</li>
                <li>Buka <strong>Analisis Mendalam</strong> untuk melihat detail kondisi usaha Anda.</li>
              </ul>
            )}
            <button
              className="btn btn-primary"
              style={{marginTop: 16}}
              onClick={() => { setSelectedUMKM(u.id); setPage('detail'); }}
            >
              🔍 Lihat Analisis Mendalam →
            </button>
          </div>
        </div>
      </div>

      {/* Distribusi anonim — privasi: tidak ada nama atau detail usaha lain */}
      <div className="card flush" style={{marginBottom: 18}}>
        <div style={{padding: '18px 20px 6px'}}>
          <div className="card-title">📊 Sebaran Skor Risiko Semua Usaha</div>
          <div className="card-sub">
            Untuk menjaga privasi, kami hanya menampilkan <strong>jumlah usaha</strong> per rentang skor —
            tanpa nama, tanpa identitas. Garis biru menunjukkan posisi Anda dalam sebaran ini.
          </div>
        </div>
        <div style={{padding: '0 12px 12px'}}>
          <div ref={peerBarRef}></div>
        </div>
        <div style={{
          padding: '12px 20px 18px', borderTop: '1px dashed var(--line)',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
        }}>
          <PeerStat
            label="Total usaha pembanding"
            value={peerList.length}
            hint="Riwayat anonim"
          />
          <PeerStat
            label="Yang termasuk berisiko"
            value={`${peerHR} dari ${peerList.length}`}
            hint={`${Math.round(peerHR / peerList.length * 100)}% dari total`}
            tone="hr"
          />
          <PeerStat
            label="Skor Anda lebih tinggi dari"
            value={`${Math.round((peerList.filter(p => p.prob < u.prob).length / peerList.length) * 100)}%`}
            hint="usaha lain dalam sebaran"
            tone={u.prob >= tau ? 'hr' : 'safe'}
          />
        </div>
      </div>

      <div className="disclaimer">
        <strong>⚠️ Catatan:</strong> Laporan ini bersifat indikatif dan dimaksudkan untuk membantu pengambilan
        keputusan, bukan menggantikannya. Konsultasikan dengan penasihat keuangan untuk keputusan besar.
      </div>
    </div>
  );
};

const PeerStat = ({ label, value, hint, tone }) => (
  <div style={{
    background: tone === 'hr' ? 'var(--hr-bg)' : tone === 'safe' ? 'var(--safe-bg)' : 'var(--canvas)',
    border: `1px solid ${tone === 'hr' ? 'rgba(231,76,60,0.25)' : tone === 'safe' ? 'rgba(39,174,96,0.25)' : 'var(--line)'}`,
    borderRadius: 'var(--r-md)', padding: '12px 14px',
  }}>
    <div style={{
      fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em',
      textTransform: 'uppercase', color: 'var(--ink-4)',
    }}>{label}</div>
    <div style={{
      fontSize: 22, fontWeight: 700, marginTop: 4,
      color: tone === 'hr' ? 'var(--hr)' : tone === 'safe' ? 'var(--safe)' : 'var(--ink)',
      fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
    }}>{value}</div>
    <div style={{fontSize: 11, color: 'var(--ink-3)', marginTop: 2}}>{hint}</div>
  </div>
);

window.ResultsPage = ResultsPage;
