// Analisis Mendalam — detail usaha untuk pemilik UMKM (bahasa awam, tanpa feature importance)
const DetailPage = ({ setPage, predictionDone, prediction, umkmList, selectedUMKM, setSelectedUMKM, q25q75 }) => {
  const tsRef = React.useRef(null);
  const gaugeRef = React.useRef(null);

  if (!predictionDone) {
    return (
      <div className="content">
        <div className="page-header">
          <h1 className="page-title">🔍 Analisis Mendalam</h1>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>Belum ada laporan untuk dianalisis</h3>
            <p>Jalankan prediksi terlebih dahulu untuk melihat analisis mendalam usaha Anda.</p>
            <button className="btn btn-primary" onClick={() => setPage('input')}>← Mulai Prediksi</button>
          </div>
        </div>
      </div>
    );
  }

  const horizon = prediction.horizon;
  const tau = prediction.tau;
  const qs = q25q75[horizon];
  const umkm = umkmList.find(u => u.id === selectedUMKM) || umkmList[0];
  const isHR = umkm.prob >= tau;
  const horizonLabel = horizon === 4 ? '1 bulan' : horizon === 12 ? '3 bulan' : '6 bulan';

  // Friendly labels for last reading
  const cashHealthLabel = umkm.clrLast < qs.q25 ? 'Tipis' : umkm.clrLast > qs.q75 ? 'Sehat' : 'Sedang';
  const cashHealthColor = umkm.clrLast < qs.q25 ? 'var(--hr)' : umkm.clrLast > qs.q75 ? 'var(--safe)' : 'var(--warn)';
  const trendLabel = umkm.tren === 'up' ? 'Menaik' : umkm.tren === 'down' ? 'Menurun' : 'Stabil';
  const trendIcon = umkm.tren === 'up' ? '📈' : umkm.tren === 'down' ? '📉' : '➡️';
  const trendColor = umkm.tren === 'up' ? 'var(--safe)' : umkm.tren === 'down' ? 'var(--hr)' : 'var(--ink-3)';

  // Plain-language "factors" — what nudged the prediction
  const recent = umkm.clrSeries.slice(-4);
  const mean4 = recent.reduce((a, b) => a + b, 0) / recent.length;
  const factors = [];
  // Cash health
  if (umkm.clrLast < qs.q25) {
    factors.push({
      icon: '🔴', tone: 'hr',
      title: 'Rasio arus kas terakhir di bawah batas waspada',
      detail: `Minggu terakhir, untuk setiap Rp 1 yang keluar hanya Rp ${umkm.clrLast.toFixed(2)} yang masuk. Idealnya di atas Rp ${qs.q75.toFixed(2)}.`,
    });
  } else if (umkm.clrLast > qs.q75) {
    factors.push({
      icon: '🟢', tone: 'safe',
      title: 'Rasio arus kas terakhir sehat',
      detail: `Minggu terakhir, untuk setiap Rp 1 yang keluar ada Rp ${umkm.clrLast.toFixed(2)} yang masuk — di atas batas aman.`,
    });
  } else {
    factors.push({
      icon: '🟡', tone: 'warn',
      title: 'Rasio arus kas berada di zona sedang',
      detail: `Tidak terlalu tipis, tetapi juga belum benar-benar sehat (Rp ${umkm.clrLast.toFixed(2)} masuk per Rp 1 keluar). Pantau terus.`,
    });
  }
  // Trend
  if (umkm.tren === 'down') {
    factors.push({
      icon: '📉', tone: 'hr',
      title: 'Tren menurun dalam 4 minggu terakhir',
      detail: 'Rasio arus kas Anda terus berkurang sedikit demi sedikit. Pola seperti ini berisiko menjadi defisit bila tidak ditangani.',
    });
  } else if (umkm.tren === 'up') {
    factors.push({
      icon: '📈', tone: 'safe',
      title: 'Tren membaik dalam 4 minggu terakhir',
      detail: 'Rasio arus kas Anda terus naik — pertanda usaha sedang menguat.',
    });
  } else {
    factors.push({
      icon: '➡️', tone: 'neutral',
      title: 'Pergerakan stabil dalam 4 minggu terakhir',
      detail: 'Tidak ada perubahan besar pada rasio arus kas Anda. Sistem melihat ini sebagai kondisi yang tidak banyak bergejolak.',
    });
  }
  // 4-week average vs caution band
  if (mean4 < qs.q25 * 1.2) {
    factors.push({
      icon: '⚠️', tone: 'warn',
      title: 'Rata-rata 4 minggu dekat dengan zona waspada',
      detail: `Rata-rata rasio Anda selama bulan terakhir (Rp ${mean4.toFixed(2)}) mendekati batas yang sebaiknya tidak dilewati.`,
    });
  }
  // Macro context — always mention
  factors.push({
    icon: '🌐', tone: 'neutral',
    title: 'Kondisi ekonomi nasional sudah diperhitungkan',
    detail: 'Sistem juga melihat inflasi, suku bunga BI, dan nilai tukar rupiah saat ini — semua itu otomatis ikut menentukan prediksi.',
  });

  // ===== Time-series chart =====
  React.useEffect(() => {
    if (!tsRef.current) return;
    const weeks = umkm.clrSeries.map((_, i) => i + 1);
    const predWeek = weeks[weeks.length - 1] + horizon;

    Plotly.react(tsRef.current, [
      // Background bands (HR, Moderate, Safe)
      { type: 'scatter', x: [weeks[0], predWeek], y: [qs.q25, qs.q25], mode: 'lines',
        line: { color: 'rgba(0,0,0,0)' }, fill: 'tozeroy', fillcolor: 'rgba(231, 76, 60, 0.08)',
        showlegend: false, hoverinfo: 'skip' },
      { type: 'scatter', x: [weeks[0], predWeek], y: [qs.q75, qs.q75], mode: 'lines',
        line: { color: 'rgba(0,0,0,0)' }, fill: 'tonexty', fillcolor: 'rgba(243, 156, 18, 0.07)',
        showlegend: false, hoverinfo: 'skip' },
      { type: 'scatter', x: [weeks[0], predWeek], y: [3.5, 3.5], mode: 'lines',
        line: { color: 'rgba(0,0,0,0)' }, fill: 'tonexty', fillcolor: 'rgba(39, 174, 96, 0.07)',
        showlegend: false, hoverinfo: 'skip' },
      // Threshold lines
      { type: 'scatter', x: [weeks[0], predWeek], y: [qs.q25, qs.q25], mode: 'lines',
        name: 'Batas waspada',
        line: { color: '#E74C3C', width: 1.5, dash: 'dash' }, hoverinfo: 'skip' },
      { type: 'scatter', x: [weeks[0], predWeek], y: [qs.q75, qs.q75], mode: 'lines',
        name: 'Batas aman',
        line: { color: '#27AE60', width: 1.5, dash: 'dash' }, hoverinfo: 'skip' },
      // Actual line
      { type: 'scatter', x: weeks, y: umkm.clrSeries, mode: 'lines+markers',
        name: 'Catatan Anda',
        line: { color: '#2C3E50', width: 2.5 },
        marker: { size: 6, color: '#2C3E50' },
        hovertemplate: 'Minggu ke-%{x}<br>Rasio kas: <b>%{y:.2f}</b><extra></extra>',
      },
      // Prediction marker
      { type: 'scatter', x: [predWeek], y: [umkm.clrSeries[umkm.clrSeries.length - 1]], mode: 'markers',
        name: `Prediksi ${horizonLabel}`,
        marker: { size: 16, color: isHR ? '#E74C3C' : '#27AE60', symbol: 'diamond',
                  line: { color: 'white', width: 2 } },
        hovertemplate: `Prediksi ${horizonLabel}: <b>${isHR ? 'BERISIKO' : 'AMAN'}</b><br>Skor: ${(umkm.prob*100).toFixed(0)}%<extra></extra>`,
      },
    ], {
      template: 'plotly_white',
      xaxis: { title: { text: 'Minggu ke-', font: { size: 11, color: '#5D6D7E' } }, gridcolor: '#ECF0F1' },
      yaxis: { title: { text: 'Rasio uang masuk ÷ keluar', font: { size: 11, color: '#5D6D7E' } },
               gridcolor: '#ECF0F1', range: [0, 3.5] },
      legend: { orientation: 'h', y: 1.12, font: { family: 'Inter', size: 11 } },
      margin: { l: 60, r: 30, t: 30, b: 40 },
      height: 340,
      font: { family: 'Inter' },
      shapes: [{
        type: 'rect', x0: weeks[weeks.length - 1], x1: predWeek, y0: 0, y1: 3.5,
        line: { width: 0 }, fillcolor: 'rgba(52, 152, 219, 0.04)', layer: 'below',
      }],
      annotations: [{
        x: predWeek, y: umkm.clrSeries[umkm.clrSeries.length - 1] + 0.4, xref: 'x', yref: 'y',
        text: `<b>${horizonLabel} ke depan</b><br>${isHR ? 'Berisiko' : 'Aman'} · ${(umkm.prob*100).toFixed(0)}%`,
        showarrow: true, arrowhead: 0, ax: -10, ay: -30,
        font: { color: isHR ? '#E74C3C' : '#27AE60', size: 11, family: 'Inter' },
        bgcolor: 'white', bordercolor: isHR ? '#E74C3C' : '#27AE60', borderwidth: 1, borderpad: 4,
      }],
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
    }, { displayModeBar: false, responsive: true });
  }, [umkm, horizon, tau, isHR, qs, horizonLabel]);

  // ===== Gauge =====
  React.useEffect(() => {
    if (!gaugeRef.current) return;
    Plotly.react(gaugeRef.current, [{
      type: 'indicator', mode: 'gauge+number',
      value: umkm.prob * 100,
      number: { suffix: '%', valueformat: '.0f', font: { size: 24, family: 'Inter', color: '#2C3E50' } },
      gauge: {
        axis: { range: [0, 100], tickwidth: 0, tickvals: [0, 50, 100],
                ticktext: ['Aman', '', 'Berisiko'], tickfont: { size: 9 } },
        bar: { color: isHR ? '#E74C3C' : '#27AE60', thickness: 0.28 },
        bgcolor: 'white', borderwidth: 1, bordercolor: '#ECF0F1',
        steps: [
          { range: [0, 30], color: 'rgba(39, 174, 96, 0.15)' },
          { range: [30, 60], color: 'rgba(243, 156, 18, 0.18)' },
          { range: [60, 100], color: 'rgba(231, 76, 60, 0.18)' },
        ],
      },
    }], {
      height: 140, margin: { l: 18, r: 18, t: 10, b: 5 },
      font: { family: 'Inter' }, paper_bgcolor: 'rgba(0,0,0,0)',
    }, { displayModeBar: false, responsive: true });
  }, [umkm, isHR]);

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-eyebrow">Analisis Mendalam · {horizonLabel} ke depan</div>
        <h1 className="page-title">{umkm.nama}</h1>
        <p className="page-sub">Telusuri faktor-faktor yang mempengaruhi prediksi usaha Anda.</p>
      </div>

      <div style={{display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap'}}>
        <label className="field-label" style={{margin: 0, minWidth: 100}}>Pilih usaha:</label>
        <select className="select" value={umkm.id} onChange={(e) => setSelectedUMKM(e.target.value)} style={{maxWidth: 420}}>
          {umkmList.map(u => (
            <option key={u.id} value={u.id}>
              {u.nama} — {u.prob >= tau ? `Berisiko (${(u.prob*100).toFixed(0)}%)` : `Aman (${(u.prob*100).toFixed(0)}%)`}
            </option>
          ))}
        </select>
        <button className="btn btn-ghost" onClick={() => setPage('hasil')}>← Kembali ke Laporan</button>
      </div>

      {/* Profile header */}
      <div className="detail-header" style={{marginBottom: 18}}>
        <div>
          <div className="detail-label">Usaha</div>
          <div className="detail-id-name">
            <div className="detail-value-lg" style={{fontSize: 18, lineHeight: 1.25}}>{umkm.nama}</div>
            <span className="small">{umkm.sektor}</span>
            <span className="mono" style={{fontSize: 11, color: 'var(--ink-4)', marginTop: 2}}>
              Kode: {umkm.id}
            </span>
          </div>
        </div>
        <div>
          <div className="detail-label">Status Prediksi</div>
          <div style={{marginTop: 8}}>
            <span className={`badge ${isHR ? 'badge-risk' : 'badge-safe'}`} style={{fontSize: 13, padding: '5px 14px'}}>
              <span className="dotmark"></span>
              {isHR ? 'BERISIKO' : 'AMAN'}
            </span>
          </div>
          <div style={{fontSize: 11.5, color: 'var(--ink-3)', marginTop: 8}}>
            Untuk {horizonLabel} ke depan
          </div>
        </div>
        <div>
          <div className="detail-label">Skor Risiko</div>
          <div ref={gaugeRef}></div>
        </div>
        <div>
          <div className="detail-label">Kondisi Terakhir</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8}}>
            <div className="kv">
              <span className="k">Kesehatan kas</span>
              <span className="v" style={{color: cashHealthColor}}>{cashHealthLabel}</span>
            </div>
            <div className="kv">
              <span className="k">Tren 4 minggu</span>
              <span className="v" style={{color: trendColor}}>{trendIcon} {trendLabel}</span>
            </div>
            <div className="kv">
              <span className="k">Riwayat data</span>
              <span className="v mono">{umkm.weeks} mgg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time series */}
      <div className="card" style={{marginBottom: 18}}>
        <div className="card-title">📈 Perjalanan Kesehatan Kas Anda</div>
        <div className="card-sub">
          Grafik perminggu dari riwayat ke prediksi. <strong>Hijau muda</strong> = zona aman,
          <strong> kuning</strong> = sedang, <strong>merah muda</strong> = waspada.
          Belah ketupat di kanan adalah prediksi untuk {horizonLabel} ke depan.
        </div>
        <div ref={tsRef}></div>
      </div>

      {/* Faktor yang mempengaruhi prediksi */}
      <div className="card" style={{marginBottom: 18}}>
        <div className="card-title">🧭 Faktor yang Mempengaruhi Prediksi</div>
        <div className="card-sub">
          Ini hal-hal yang membuat sistem sampai pada kesimpulan tersebut. Disusun dari yang paling berpengaruh.
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14}}>
          {factors.map((f, i) => (
            <FactorRow key={i} f={f} />
          ))}
        </div>
      </div>

      {/* Interpretasi narasi */}
      <div className="card" style={{marginBottom: 18}}>
        <div className="card-title">📝 Ringkasan dalam Bahasa Sehari-hari</div>
        {isHR ? (
          <div className="alert alert-error" style={{marginTop: 12}}>
            <span className="alert-icon">⚠️</span>
            <div>
              <div className="alert-title">Sistem melihat tanda-tanda risiko</div>
              Berdasarkan pola transaksi <strong>{umkm.nama}</strong> selama {umkm.weeks} minggu terakhir,
              sistem memperkirakan ada kemungkinan <strong>{(umkm.prob*100).toFixed(0)}%</strong> usaha Anda
              akan mengalami kesulitan arus kas dalam <strong>{horizonLabel} ke depan</strong>.
              Pola seperti ini pernah ditemui pada usaha-usaha yang kemudian benar-benar kesulitan.
              Lihat saran tindakan di halaman <strong>Laporan Saya</strong>.
            </div>
          </div>
        ) : (
          <div className="alert alert-success" style={{marginTop: 12}}>
            <span className="alert-icon">✅</span>
            <div>
              <div className="alert-title">Sistem tidak melihat tanda risiko</div>
              Berdasarkan pola transaksi <strong>{umkm.nama}</strong> selama {umkm.weeks} minggu terakhir,
              sistem hanya melihat <strong>{(umkm.prob*100).toFixed(0)}%</strong> kemungkinan masalah dalam
              <strong> {horizonLabel} ke depan</strong>. Rasio arus kas Anda{' '}
              {umkm.clrLast > qs.q75 ? 'berada di zona aman' : 'cukup memadai'} dan trennya{' '}
              {umkm.tren === 'up' ? 'membaik' : umkm.tren === 'flat' ? 'stabil' : 'sedikit menurun tetapi belum mengkhawatirkan'}.
            </div>
          </div>
        )}

        <div style={{marginTop: 14, padding: 14, background: 'var(--canvas)', borderRadius: 8, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.65}}>
          <strong style={{color: 'var(--ink-2)'}}>Cara membaca:</strong> Prediksi ini adalah perkiraan berdasarkan
          pola data Anda dibandingkan ribuan usaha lain. Bukan jaminan, tapi sinyal untuk membantu Anda
          mengambil keputusan lebih cepat. Tetap gunakan akal sehat dan konsultasi dengan orang yang
          memahami keuangan usaha Anda untuk keputusan besar.
        </div>
      </div>

      <div className="disclaimer">
        <strong>⚠️ Catatan:</strong> Analisis ini bersifat indikatif. Sistem tidak menggantikan
        keputusan manusia — gunakan sebagai pendukung, bukan satu-satunya sumber.
      </div>
    </div>
  );
};

// Plain-language factor row
const FactorRow = ({ f }) => {
  const toneColor = { hr: 'var(--hr)', safe: 'var(--safe)', warn: 'var(--warn)', neutral: 'var(--ink-3)' }[f.tone];
  const toneBg   = { hr: 'var(--hr-bg)', safe: 'var(--safe-bg)', warn: 'var(--warn-bg)', neutral: 'var(--canvas)' }[f.tone];
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'flex-start',
      padding: '14px 16px',
      background: toneBg,
      border: `1px solid ${f.tone === 'neutral' ? 'var(--line)' : toneColor + '40'}`,
      borderRadius: 'var(--r-md)',
    }}>
      <div style={{fontSize: 22, lineHeight: 1, flexShrink: 0}}>{f.icon}</div>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4}}>
          {f.title}
        </div>
        <div style={{fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6}}>
          {f.detail}
        </div>
      </div>
    </div>
  );
};

window.DetailPage = DetailPage;
