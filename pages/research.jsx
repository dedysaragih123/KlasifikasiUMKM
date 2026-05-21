// Tentang Sistem — friendly info + collapsible technical detail for thesis evaluation
const ResearchPage = ({ trackA, trackB, bestTrackAPerH, bestTrackBPerH, macroAblation, macroCorr }) => {
  const [showTech, setShowTech] = React.useState(false);

  const accuracyCards = [
    {
      horizon: 4, label: '1 bulan ke depan',
      accuracy: 73, vibe: 'Paling akurat', tone: 'safe',
      note: 'Pilihan terbaik untuk pemantauan rutin.',
    },
    {
      horizon: 12, label: '3 bulan ke depan',
      accuracy: 72, vibe: 'Cukup akurat', tone: 'safe',
      note: 'Cocok untuk perencanaan kuartalan.',
    },
    {
      horizon: 24, label: '6 bulan ke depan',
      accuracy: 67, vibe: 'Indikatif', tone: 'warn',
      note: 'Berguna sebagai arah, bukan kepastian.',
    },
  ];

  const trustItems = [
    {
      icon: '🧠',
      title: 'Dilatih dari ribuan pola usaha nyata',
      desc: 'Sistem belajar dari catatan transaksi UMKM selama lebih dari 2 tahun (Januari 2023 sampai Februari 2025), kemudian diuji ulang pada data yang belum pernah dilihat sebelumnya.',
    },
    {
      icon: '🌐',
      title: 'Sudah memperhitungkan ekonomi nasional',
      desc: 'Inflasi, suku bunga Bank Indonesia, dan nilai tukar rupiah selalu otomatis ikut dalam perhitungan — Anda tidak perlu mengerti angka-angka itu.',
    },
    {
      icon: '🔒',
      title: 'Data Anda tidak pernah dibagikan',
      desc: 'File yang Anda unggah hanya diproses di komputer Anda sendiri. Sistem tidak menyimpan atau mengirim data Anda ke pihak mana pun.',
    },
    {
      icon: '⚖️',
      title: 'Pengaturan terbaik sudah disetel otomatis',
      desc: 'Tingkat kepekaan peringatan sudah dipilih berdasarkan ribuan percobaan — menyeimbangkan antara ketepatan, cakupan, dan jumlah peringatan keliru.',
    },
  ];

  const limitations = [
    'Bukan keputusan keuangan resmi — hasilnya indikatif, bukan vonis.',
    'Bergantung pada kualitas data Anda — semakin rapi catatan, semakin tajam prediksi.',
    'Tidak memprediksi kejadian luar biasa seperti bencana, perubahan regulasi mendadak, atau hal personal pemilik usaha.',
    'Performa di luar periode pelatihan (Januari 2023 – Februari 2025) belum dapat dipastikan.',
  ];

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-eyebrow">Tentang Sistem</div>
        <h1 className="page-title">Bagaimana Sistem Ini Bekerja & Sebaik Apa</h1>
        <p className="page-sub">
          Penjelasan singkat agar Anda bisa percaya sekaligus tahu batasannya.
        </p>
      </div>

      {/* Akurasi cards */}
      <h2 style={{
        fontSize: 16, fontWeight: 700, color: 'var(--ink)',
        margin: '8px 0 14px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          width: 22, height: 22, background: 'var(--primary)', color: 'white',
          borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
        }}>1</span>
        Seberapa Akurat Sistem Ini?
      </h2>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 12}}>
        {accuracyCards.map(c => (
          <div key={c.horizon} style={{
            background: 'white', border: '1px solid var(--line)',
            borderRadius: 'var(--r-lg)', padding: '20px 22px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
              background: c.tone === 'safe' ? 'var(--safe)' : 'var(--warn)',
            }}/>
            <div style={{fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '0.04em', textTransform: 'uppercase'}}>
              Prediksi {c.label}
            </div>
            <div style={{
              fontSize: 42, fontWeight: 700, color: 'var(--ink)',
              letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 6,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {c.accuracy}<span style={{fontSize: 20, color: 'var(--ink-3)'}}>%</span>
            </div>
            <div style={{
              fontSize: 12, fontWeight: 600, marginTop: 4,
              color: c.tone === 'safe' ? 'var(--safe)' : 'var(--warn)',
            }}>{c.vibe}</div>
            <div style={{fontSize: 12, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5}}>
              {c.note}
            </div>
          </div>
        ))}
      </div>

      <div className="alert alert-info" style={{marginBottom: 28}}>
        <span className="alert-icon">💡</span>
        <div>
          <div className="alert-title">Apa artinya angka ini?</div>
          Jika dikatakan akurasi <strong>73%</strong>, artinya dari 100 usaha yang diprediksi sistem,
          kurang lebih 73 sesuai dengan kenyataannya. Tidak ada sistem yang 100% — gunakan prediksi
          sebagai pendukung, bukan satu-satunya alat.
        </div>
      </div>

      {/* Why trust it */}
      <h2 style={{
        fontSize: 16, fontWeight: 700, color: 'var(--ink)',
        margin: '8px 0 14px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          width: 22, height: 22, background: 'var(--primary)', color: 'white',
          borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
        }}>2</span>
        Mengapa Bisa Dipercaya?
      </h2>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28}}>
        {trustItems.map((t, i) => (
          <div key={i} style={{
            background: 'white', border: '1px solid var(--line)',
            borderRadius: 'var(--r-lg)', padding: '18px 20px',
          }}>
            <div style={{fontSize: 24, marginBottom: 8}}>{t.icon}</div>
            <div style={{fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 6}}>
              {t.title}
            </div>
            <div style={{fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.6}}>
              {t.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Limitations */}
      <h2 style={{
        fontSize: 16, fontWeight: 700, color: 'var(--ink)',
        margin: '8px 0 14px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          width: 22, height: 22, background: 'var(--primary)', color: 'white',
          borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
        }}>3</span>
        Yang Sistem <em>Tidak</em> Bisa Lakukan
      </h2>

      <div className="card" style={{marginBottom: 28}}>
        <div className="card-sub" style={{marginBottom: 14}}>
          Penting agar Anda tidak kecewa atau salah memakai.
        </div>
        <ul style={{margin: 0, paddingLeft: 22, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.85}}>
          {limitations.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </div>

      {/* Collapsible technical detail */}
      <div style={{
        background: 'white', border: '1px dashed var(--line-2)',
        borderRadius: 'var(--r-lg)', overflow: 'hidden',
      }}>
        <div
          onClick={() => setShowTech(!showTech)}
          style={{
            padding: '14px 18px', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: showTech ? 'var(--canvas)' : 'transparent',
            transition: 'background .15s',
          }}
        >
          <div>
            <div style={{fontSize: 14, fontWeight: 700, color: 'var(--ink)'}}>
              🔬 Detail Teknis untuk Peneliti & Pembimbing
            </div>
            <div style={{fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2}}>
              Benchmark antar-model, ablasi makroekonomi, korelasi Pearson. Tidak perlu dibuka untuk penggunaan biasa.
            </div>
          </div>
          <span style={{fontSize: 12, color: 'var(--ink-3)', fontWeight: 600}}>
            {showTech ? '▼ Sembunyikan' : '▶ Tampilkan'}
          </span>
        </div>
        {showTech && (
          <div style={{padding: '4px 18px 20px', borderTop: '1px solid var(--line)'}}>
            <TechDetail
              trackA={trackA} trackB={trackB}
              bestTrackAPerH={bestTrackAPerH} bestTrackBPerH={bestTrackBPerH}
              macroAblation={macroAblation} macroCorr={macroCorr}
            />
          </div>
        )}
      </div>

      <div className="disclaimer">
        <strong>⚠️ Catatan:</strong> Prototipe Tugas Akhir STI ITB 2025. Sistem ini adalah bukti konsep
        akademik dan tidak dimaksudkan untuk pengambilan keputusan keuangan resmi.
      </div>
    </div>
  );
};

// ============================================================
// Technical detail (collapsed by default) — original benchmark content
// ============================================================
const TechDetail = ({ trackA, trackB, bestTrackAPerH, bestTrackBPerH, macroAblation, macroCorr }) => {
  const [tab, setTab] = React.useState('compare');
  const [horizon, setHorizon] = React.useState(4);
  return (
    <div style={{paddingTop: 14}}>
      <div className="tabs">
        <div className={`tab ${tab === 'compare' ? 'active' : ''}`} onClick={() => setTab('compare')}>1. Perbandingan Antar-Model</div>
        <div className={`tab ${tab === 'track' ? 'active' : ''}`} onClick={() => setTab('track')}>2. Track A vs Track B</div>
        <div className={`tab ${tab === 'macro' ? 'active' : ''}`} onClick={() => setTab('macro')}>3. Studi Ablasi Makro</div>
      </div>
      {tab === 'compare' && <CompareTab trackA={trackA} trackB={trackB} bestTrackAPerH={bestTrackAPerH} bestTrackBPerH={bestTrackBPerH} horizon={horizon} setHorizon={setHorizon} />}
      {tab === 'track' && <TrackTab trackA={trackA} trackB={trackB} horizon={horizon} setHorizon={setHorizon} />}
      {tab === 'macro' && <MacroTab macroAblation={macroAblation} macroCorr={macroCorr} />}
    </div>
  );
};

// ───── Tab 1: Compare models ─────
const CompareTab = ({ trackA, trackB, bestTrackAPerH, bestTrackBPerH, horizon, setHorizon }) => {
  const chartARef = React.useRef(null);
  const chartBRef = React.useRef(null);

  const modelsA = ['Extra Trees', 'XGBoost', 'LightGBM', 'Stacking'];
  const modelsB = ['Extra Trees', 'XGBoost', 'LightGBM', 'SoftVoting'];
  const metrics = ['MacroF1', 'F1_HR', 'Prec_HR', 'Rec_HR', 'AUC'];
  const metricLabels = { MacroF1: 'Macro F1', F1_HR: 'F1-HR', Prec_HR: 'Prec-HR', Rec_HR: 'Rec-HR', AUC: 'AUC' };

  const drawGrouped = (ref, data, models, bestModel) => {
    const traces = models.map((m) => ({
      type: 'bar', name: m,
      x: metrics.map(k => metricLabels[k]),
      y: metrics.map(k => data[horizon][m][k]),
      marker: {
        color: m === bestModel ? '#2C3E50' : ['#BDC3C7', '#85929E', '#5D6D7E', '#34495E'][models.indexOf(m)],
        line: m === bestModel ? { color: '#F1C40F', width: 2.5 } : { width: 0 },
      },
      text: metrics.map(k => data[horizon][m][k].toFixed(3)),
      textposition: 'outside',
      textfont: { size: 9, color: '#5D6D7E', family: 'JetBrains Mono' },
    }));

    Plotly.react(ref.current, traces, {
      template: 'plotly_white', barmode: 'group',
      yaxis: { range: [0, 1.0], gridcolor: '#ECF0F1', tickformat: '.2f' },
      xaxis: { tickfont: { size: 11, family: 'Inter' } },
      legend: { orientation: 'h', y: -0.18, font: { family: 'Inter', size: 11 } },
      margin: { l: 50, r: 30, t: 30, b: 60 },
      height: 320, font: { family: 'Inter' },
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
    }, { displayModeBar: false, responsive: true });
  };

  React.useEffect(() => {
    drawGrouped(chartARef, trackA, modelsA, bestTrackAPerH[horizon]);
    drawGrouped(chartBRef, trackB, modelsB, bestTrackBPerH[horizon]);
  }, [horizon]);

  return (
    <div>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16}}>
        <span style={{fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600}}>Horizon:</span>
        {[4, 12, 24].map(h => (
          <div key={h} className={`chip ${horizon === h ? 'active' : ''}`} onClick={() => setHorizon(h)}>H = {h} minggu</div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Track A — Klasifikasi 3-Kelas</div>
          <div className="card-sub">Terbaik H={horizon}: <strong>{bestTrackAPerH[horizon]}</strong></div>
          <div ref={chartARef}></div>
          <div className="table-wrap" style={{marginTop: 14}}>
            <table className="data">
              <thead>
                <tr><th>Model</th>{metrics.map(m => <th key={m} style={{textAlign:'right'}}>{metricLabels[m]}</th>)}</tr>
              </thead>
              <tbody>
                {modelsA.map(m => (
                  <tr key={m} style={m === bestTrackAPerH[horizon] ? { background: 'rgba(241, 196, 15, 0.1)' } : {}}>
                    <td style={{fontWeight: m === bestTrackAPerH[horizon] ? 700 : 500}}>
                      {m === bestTrackAPerH[horizon] && '🏆 '}{m}
                    </td>
                    {metrics.map(k => (
                      <td key={k} className="mono" style={{textAlign: 'right', fontWeight: m === bestTrackAPerH[horizon] ? 700 : 400}}>
                        {trackA[horizon][m][k].toFixed(3)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Track B — Klasifikasi Binary</div>
          <div className="card-sub">Terbaik H={horizon}: <strong>{bestTrackBPerH[horizon]}</strong></div>
          <div ref={chartBRef}></div>
          <div className="table-wrap" style={{marginTop: 14}}>
            <table className="data">
              <thead>
                <tr><th>Model</th>{metrics.map(m => <th key={m} style={{textAlign:'right'}}>{metricLabels[m]}</th>)}</tr>
              </thead>
              <tbody>
                {modelsB.map(m => (
                  <tr key={m} style={m === bestTrackBPerH[horizon] ? { background: 'rgba(241, 196, 15, 0.1)' } : {}}>
                    <td style={{fontWeight: m === bestTrackBPerH[horizon] ? 700 : 500}}>
                      {m === bestTrackBPerH[horizon] && '🏆 '}{m}
                    </td>
                    {metrics.map(k => (
                      <td key={k} className="mono" style={{textAlign: 'right', fontWeight: m === bestTrackBPerH[horizon] ? 700 : 400}}>
                        {trackB[horizon][m][k].toFixed(3)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ───── Tab 2: Track A vs Track B ─────
const TrackTab = ({ trackA, trackB, horizon, setHorizon }) => {
  const radarRef = React.useRef(null);
  const a = trackA[horizon].Stacking;
  const b = trackB[horizon][horizon === 24 ? 'LightGBM' : 'SoftVoting'];

  React.useEffect(() => {
    if (!radarRef.current) return;
    const metrics = ['Macro F1', 'F1-HR', 'Prec-HR', 'Rec-HR', 'AUC'];
    const aValues = [a.MacroF1, a.F1_HR, a.Prec_HR, a.Rec_HR, a.AUC];
    const bValues = [b.MacroF1, b.F1_HR, b.Prec_HR, b.Rec_HR, b.AUC];

    Plotly.react(radarRef.current, [
      { type: 'scatterpolar', r: [...aValues, aValues[0]], theta: [...metrics, metrics[0]],
        fill: 'toself', name: 'Track A · Stacking',
        line: { color: '#E74C3C', width: 2 }, fillcolor: 'rgba(231, 76, 60, 0.15)',
        marker: { size: 6 } },
      { type: 'scatterpolar', r: [...bValues, bValues[0]], theta: [...metrics, metrics[0]],
        fill: 'toself', name: `Track B · ${horizon === 24 ? 'LightGBM' : 'SoftVoting'}`,
        line: { color: '#3498DB', width: 2 }, fillcolor: 'rgba(52, 152, 219, 0.18)',
        marker: { size: 6 } },
    ], {
      polar: {
        radialaxis: { visible: true, range: [0.4, 0.9], gridcolor: '#ECF0F1', tickfont: { size: 10 } },
        angularaxis: { tickfont: { size: 11.5, family: 'Inter', color: '#34495E' } },
        bgcolor: 'rgba(0,0,0,0)',
      },
      legend: { orientation: 'h', y: -0.1, font: { family: 'Inter', size: 12 } },
      margin: { l: 50, r: 50, t: 30, b: 60 },
      height: 380, font: { family: 'Inter' },
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
    }, { displayModeBar: false, responsive: true });
  }, [horizon, a, b]);

  const metricRows = [
    { key: 'MacroF1', label: 'Macro F1' },
    { key: 'Rec_HR',  label: 'Recall HIGH_RISK' },
    { key: 'Prec_HR', label: 'Precision HIGH_RISK' },
    { key: 'F1_HR',   label: 'F1 HIGH_RISK' },
    { key: 'AUC',     label: 'ROC AUC' },
  ];

  return (
    <div>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16}}>
        <span style={{fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600}}>Horizon:</span>
        {[4, 12, 24].map(h => (
          <div key={h} className={`chip ${horizon === h ? 'active' : ''}`} onClick={() => setHorizon(h)}>H = {h} minggu</div>
        ))}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 16}}>
        <div className="card">
          <div className="card-title">Radar Chart · 5 dimensi metrik</div>
          <div className="card-sub">Visualisasi perbandingan Track A vs Track B pada H={horizon}.</div>
          <div ref={radarRef}></div>
        </div>

        <div className="card">
          <div className="card-title">Selisih Metrik · Track A → Track B</div>
          <div className="card-sub">Persentase poin perbedaan; positif berarti Track B unggul.</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8}}>
            {metricRows.map(row => {
              const av = a[row.key], bv = b[row.key];
              const delta = (bv - av) * 100;
              return (
                <div key={row.key} style={{display: 'flex', alignItems: 'center', padding: '12px 14px', background: 'var(--canvas)', borderRadius: 10, gap: 14}}>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: 12, color: 'var(--ink-3)', fontWeight: 600}}>{row.label}</div>
                    <div className="mono" style={{fontSize: 14, marginTop: 2}}>
                      <span style={{color: 'var(--hr)'}}>{av.toFixed(3)}</span>
                      &nbsp;→&nbsp;
                      <span style={{color: 'var(--accent)'}}>{bv.toFixed(3)}</span>
                    </div>
                  </div>
                  <div style={{fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 700,
                               color: delta > 0 ? 'var(--safe)' : 'var(--hr)'}}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)} <span style={{fontSize: 10, color: 'var(--ink-4)'}}>pp</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ───── Tab 3: Macro Ablation ─────
const MacroTab = ({ macroAblation, macroCorr }) => {
  const ablRef = React.useRef(null);

  React.useEffect(() => {
    if (!ablRef.current) return;
    Plotly.react(ablRef.current, [{
      type: 'bar',
      x: macroAblation.map(d => `H = ${d.H}`),
      y: macroAblation.map(d => d.delta),
      marker: { color: macroAblation.map(d => d.H === 12 ? '#27AE60' : '#85C1A2') },
      text: macroAblation.map(d => `+${(d.delta*100).toFixed(2)}%`),
      textposition: 'outside',
      textfont: { size: 12, color: '#196F3D', family: 'JetBrains Mono' },
      width: 0.5,
      hovertemplate: '<b>%{x}</b><br>ΔF1 = %{y:.4f}<extra></extra>',
    }], {
      template: 'plotly_white',
      yaxis: {
        title: { text: 'Δ Macro F1 (full vs no-macro)', font: { size: 11, color: '#5D6D7E' } },
        gridcolor: '#ECF0F1', range: [-0.005, 0.04],
        zeroline: true, zerolinecolor: '#5D6D7E', zerolinewidth: 1.5,
      },
      xaxis: { tickfont: { size: 13, family: 'Inter' } },
      margin: { l: 60, r: 30, t: 30, b: 50 },
      height: 320, font: { family: 'Inter' },
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
    }, { displayModeBar: false, responsive: true });
  }, [macroAblation]);

  return (
    <div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">ΔMacro F1 · Full Model vs Tanpa Makroekonomi</div>
          <div className="card-sub">Eksperimen dengan menghilangkan 3 fitur makro lag-1 dan 2 fitur interaksi.</div>
          <div ref={ablRef}></div>
        </div>

        <div className="card">
          <div className="card-title">Korelasi Pearson dengan CLR</div>
          <div className="card-sub">Analisis bivariat per variabel makro.</div>
          <div className="table-wrap" style={{marginTop: 12}}>
            <table className="data">
              <thead>
                <tr><th>Variabel</th><th>Pearson r</th><th>p-value</th><th>Interpretasi</th></tr>
              </thead>
              <tbody>
                {macroCorr.map(row => (
                  <tr key={row.v}>
                    <td>{row.v}</td>
                    <td className="mono" style={{color: 'var(--hr)', fontWeight: 600}}>{row.r.toFixed(2)}</td>
                    <td className="mono">{row.p}</td>
                    <td style={{fontSize: 12, color: 'var(--ink-3)'}}>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

window.ResearchPage = ResearchPage;
