// Page 1: Input Data & Prediksi — Wizard 4 langkah
// Alur yang dipakai pengguna UMKM:
//   1. Data Usaha       — identitas + upload sales.csv + expense.csv (+ data contoh + template)
//   2. Rentang Prediksi — 1 / 3 / 6 bulan ke depan
//   3. Cara Menampilkan — 2 atau 3 tingkat (threshold slider hanya untuk 2 tingkat).
//                         Data ekonomi nasional OTOMATIS terintegrasi, bukan opsi.
//   4. Konfirmasi       — ringkasan + jalankan prediksi

const SECTORS = ['Retail', 'Makanan & Minuman', 'Manufaktur / Konveksi', 'Jasa', 'Lainnya'];

// ----- CSV utilities -----
const parseCSV = (text) => {
  const clean = text.replace(/^\uFEFF/, '').trim();
  if (!clean) return { error: 'File CSV kosong.' };
  const lines = clean.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length < 2) return { error: 'CSV harus berisi header + minimal 1 baris data.' };
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, j) => { obj[h] = cells[j] !== undefined ? cells[j] : ''; });
    rows.push(obj);
  }
  return { headers, rows };
};

const triggerDownload = (filename, csvText) => {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const buildTemplate = (kind) => {
  const col = kind === 'sales' ? 'sub_total' : 'total';
  const lines = [`date,${col}`];
  const today = new Date();
  for (let i = 139; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    if (d.getDay() === 0) continue;
    const ds = d.toISOString().slice(0, 10);
    const base = kind === 'sales' ? 1_250_000 : 850_000;
    const wave = Math.round(Math.sin(i * 0.18) * (kind === 'sales' ? 400_000 : 250_000));
    const weekly = Math.round(Math.sin(i * 0.9) * (kind === 'sales' ? 180_000 : 100_000));
    lines.push(`${ds},${base + wave + weekly}`);
  }
  return lines.join('\n') + '\n';
};

const validateCsv = (parsed, kind) => {
  if (parsed.error) return { error: parsed.error };
  const valueCol = kind === 'sales' ? 'sub_total' : 'total';
  const need = ['date', valueCol];
  const missing = need.filter(c => !parsed.headers.includes(c));
  if (missing.length) {
    return { error: `Kolom wajib hilang: ${missing.map(c => `"${c}"`).join(', ')}. Ditemukan: ${parsed.headers.join(', ') || '—'}` };
  }
  if (parsed.headers.includes('customer_id')) {
    return { error: 'Format lama terdeteksi (kolom "customer_id"). Pada versi ini, 1 file = 1 UMKM. Hapus kolom customer_id.' };
  }
  const cleanRows = [];
  let badDates = 0, badValues = 0;
  for (const r of parsed.rows) {
    const ds = r.date;
    const v = parseFloat(String(r[valueCol]).replace(/[,_\s]/g, ''));
    const ts = Date.parse(ds);
    if (isNaN(ts)) { badDates++; continue; }
    if (!isFinite(v)) { badValues++; continue; }
    cleanRows.push({ date: ds, ts, value: v });
  }
  if (!cleanRows.length) return { error: 'Tidak ada baris valid setelah parsing tanggal & nilai.' };
  cleanRows.sort((a, b) => a.ts - b.ts);
  const tsMin = cleanRows[0].ts;
  const tsMax = cleanRows[cleanRows.length - 1].ts;
  const dayspan = (tsMax - tsMin) / 86400000;
  const weeks = Math.max(1, Math.floor(dayspan / 7) + 1);
  const total = cleanRows.reduce((s, r) => s + r.value, 0);
  return {
    rows: cleanRows.length, badDates, badValues, weeks,
    minDate: new Date(tsMin).toISOString().slice(0, 10),
    maxDate: new Date(tsMax).toISOString().slice(0, 10),
    total, preview: cleanRows.slice(0, 5), valueCol,
  };
};

const MIN_WEEKS = { 4: 12, 12: 20, 24: 32 };

// Human labels for horizons
const HORIZON_LABELS = {
  4:  { headline: '1 bulan ke depan', sub: '4 minggu',  caption: 'Paling akurat · perencanaan jangka pendek' },
  12: { headline: '3 bulan ke depan', sub: '12 minggu', caption: 'Akurasi menengah · perencanaan kuartalan' },
  24: { headline: '6 bulan ke depan', sub: '24 minggu', caption: 'Jangka panjang · perencanaan strategis' },
};

// =========================================================================
const InputPage = ({ setPage, thresholds, horizonStats, onPredict, predictionDone }) => {
  // Step state
  const [step, setStep] = React.useState(1);

  // Step 1: identitas + files
  const [umkmId, setUmkmId] = React.useState('');
  const [umkmName, setUmkmName] = React.useState('');
  const [umkmSector, setUmkmSector] = React.useState('Retail');
  const [tab, setTab] = React.useState('upload');
  const [salesData, setSalesData] = React.useState(null);
  const [expenseData, setExpenseData] = React.useState(null);
  const [salesError, setSalesError] = React.useState(null);
  const [expenseError, setExpenseError] = React.useState(null);

  // Step 2: horizon
  const [horizon, setHorizon] = React.useState(4);

  // Step 3: mode
  const [mode, setMode] = React.useState('3'); // '2' = dua tingkat, '3' = tiga tingkat
  const [tau, setTau] = React.useState(thresholds[4]);

  // Step 4: running
  const [running, setRunning] = React.useState(false);
  const [pipelineStep, setPipelineStep] = React.useState(0);

  const salesInputRef = React.useRef(null);
  const expenseInputRef = React.useRef(null);

  // When horizon changes, sync default tau
  React.useEffect(() => { setTau(thresholds[horizon]); }, [horizon, thresholds]);

  // ---- File handling ----
  const handleFile = (kind, file) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      const err = `File harus berekstensi .csv (dapat: ${file.name})`;
      if (kind === 'sales') { setSalesError(err); setSalesData(null); }
      else { setExpenseError(err); setExpenseData(null); }
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const txt = String(ev.target.result || '');
      const parsed = parseCSV(txt);
      const result = validateCsv(parsed, kind);
      if (result.error) {
        if (kind === 'sales') { setSalesError(result.error); setSalesData(null); }
        else { setExpenseError(result.error); setExpenseData(null); }
        return;
      }
      const data = { name: file.name, size: file.size, ...result };
      if (kind === 'sales') { setSalesData(data); setSalesError(null); }
      else { setExpenseData(data); setExpenseError(null); }
    };
    reader.onerror = () => {
      const err = 'Gagal membaca file. Coba lagi.';
      if (kind === 'sales') setSalesError(err); else setExpenseError(err);
    };
    reader.readAsText(file);
  };

  const onDrop = (kind) => (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(kind, f);
  };
  const onDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); };
  const onDragLeave = (e) => { e.currentTarget.classList.remove('drag-over'); };

  const removeFile = (kind) => {
    if (kind === 'sales') { setSalesData(null); setSalesError(null); if (salesInputRef.current) salesInputRef.current.value = ''; }
    else { setExpenseData(null); setExpenseError(null); if (expenseInputRef.current) expenseInputRef.current.value = ''; }
  };

  const loadDemoFiles = () => {
    const fakeFile = (name, text) => {
      const blob = new Blob([text], { type: 'text/csv' });
      return new File([blob], name, { type: 'text/csv' });
    };
    const sales = fakeFile('contoh_penjualan.csv', buildTemplate('sales'));
    const expense = fakeFile('contoh_pengeluaran.csv', buildTemplate('expense'));
    handleFile('sales', sales);
    handleFile('expense', expense);
    if (!umkmId) setUmkmId('UMKM_DEMO_01');
    if (!umkmName) setUmkmName('Toko Demo Mandiri');
  };

  // ---- Validation ----
  const identityFilled = umkmId.trim() && umkmName.trim();
  const haveFiles = salesData && expenseData;
  const minWeeks = MIN_WEEKS[horizon];
  const enoughHistory = haveFiles && Math.min(salesData.weeks, expenseData.weeks) >= minWeeks;
  const datesOverlap = haveFiles && salesData.minDate && expenseData.minDate
    ? !(salesData.maxDate < expenseData.minDate || expenseData.maxDate < salesData.minDate)
    : true;

  const step1Issues = [];
  if (!identityFilled) step1Issues.push('Lengkapi nama & ID usaha Anda');
  if (!salesData) step1Issues.push('Unggah data penjualan');
  if (!expenseData) step1Issues.push('Unggah data pengeluaran');
  if (haveFiles && !datesOverlap) step1Issues.push('Rentang tanggal penjualan & pengeluaran tidak overlap');

  // Step 1 OK if identity + files + overlap; "enoughHistory" depends on horizon so we check at step 4.
  const step1Ready = step1Issues.length === 0;
  const horizonHistoryOK = !haveFiles || enoughHistory;

  // ---- Pipeline ----
  const pipelineSteps = [
    `Membaca data ${umkmName || umkmId || 'usaha Anda'}`,
    'Mengelompokkan transaksi per minggu',
    'Menghitung rasio arus kas (pemasukan ÷ pengeluaran)',
    'Menggabungkan dengan data ekonomi nasional',
    'Menjalankan model & menyusun laporan',
  ];

  const buildWeeklyCLR = () => {
    const weeks = Math.min(salesData.weeks, expenseData.weeks);
    const meanIn = salesData.total / weeks;
    const meanOut = expenseData.total / weeks;
    const baseCLR = meanOut > 0 ? meanIn / meanOut : 1;
    let s = 0;
    for (let i = 0; i < (umkmId || 'X').length; i++) s += (umkmId || 'X').charCodeAt(i);
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const series = [];
    let drift = 0;
    for (let w = 0; w < weeks; w++) {
      drift += (rand() - 0.5) * 0.04;
      const noise = (rand() - 0.5) * 0.25;
      series.push(Math.max(0.1, +(baseCLR * (1 + drift) + noise).toFixed(3)));
    }
    return { series, baseCLR };
  };

  const runPipeline = () => {
    setRunning(true);
    setPipelineStep(0);
    let i = 0;
    const tick = () => {
      i++;
      setPipelineStep(i);
      if (i < pipelineSteps.length) {
        setTimeout(tick, 480);
      } else {
        setTimeout(() => {
          const { series } = buildWeeklyCLR();
          const last = series[series.length - 1];
          const last4 = series.slice(-4);
          const mean = last4.reduce((a, b) => a + b, 0) / last4.length;
          const ms = [0, 1, 2, 3].reduce((acc, j) => acc + (j - 1.5) * (last4[j] - mean), 0);
          const slope4 = +(ms / 5).toFixed(3);
          const tren = slope4 > 0.02 ? 'up' : slope4 < -0.02 ? 'down' : 'flat';
          const q25 = 0.82;
          let prob = 0.5
            + 0.45 * Math.max(0, (q25 - last) / q25)
            - 0.30 * Math.max(0, last - 1.4)
            - 1.5 * slope4;
          prob = Math.max(0.03, Math.min(0.97, prob));

          const submittedUMKM = {
            id: umkmId.trim(),
            nama: umkmName.trim(),
            sektor: umkmSector,
            prob: +prob.toFixed(3),
            clrSeries: series,
            clrLast: last,
            slope4, tren,
            weekLast: salesData.maxDate,
            weeks: Math.min(salesData.weeks, expenseData.weeks),
            dateRange: `${salesData.minDate} → ${salesData.maxDate}`,
            totalInflow: salesData.total,
            totalOutflow: expenseData.total,
            salesFileName: salesData.name,
            expenseFileName: expenseData.name,
            submittedAt: new Date().toISOString(),
          };
          onPredict({ horizon, tau, mode, submittedUMKM });
          setRunning(false);
        }, 350);
      }
    };
    setTimeout(tick, 420);
  };

  // ===== Stepper definition =====
  const stepDefs = [
    { n: 1, label: 'Data Usaha',         hint: 'Identitas & riwayat transaksi' },
    { n: 2, label: 'Rentang Prediksi',   hint: 'Mau lihat berapa lama ke depan?' },
    { n: 3, label: 'Cara Tampilan',      hint: 'Tingkat detail hasil prediksi' },
    { n: 4, label: 'Konfirmasi',         hint: 'Periksa & jalankan' },
  ];

  const goNext = () => setStep(s => Math.min(4, s + 1));
  const goBack = () => setStep(s => Math.max(1, s - 1));

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-eyebrow">Halaman 1 dari 4</div>
        <h1 className="page-title">Mulai Prediksi Arus Kas Usaha Anda</h1>
        <p className="page-sub">
          Empat langkah singkat. Kami akan memandu Anda dari unggah data sampai laporan prediksi.
        </p>
      </div>

      <Stepper steps={stepDefs} current={step} onJump={(n) => {
        // Allow jumping backwards freely; forward jumps only to steps already validly reachable.
        if (n < step) setStep(n);
        else if (n === step) {/* noop */}
        else if (n === 2 && step1Ready) setStep(2);
        else if (n === 3 && step1Ready) setStep(3);
        else if (n === 4 && step1Ready) setStep(4);
      }} />

      {step === 1 && (
        <Step1Data
          umkmId={umkmId} setUmkmId={setUmkmId}
          umkmName={umkmName} setUmkmName={setUmkmName}
          umkmSector={umkmSector} setUmkmSector={setUmkmSector}
          tab={tab} setTab={setTab}
          salesData={salesData} expenseData={expenseData}
          salesError={salesError} expenseError={expenseError}
          salesInputRef={salesInputRef} expenseInputRef={expenseInputRef}
          handleFile={handleFile} onDrop={onDrop}
          onDragOver={onDragOver} onDragLeave={onDragLeave}
          removeFile={removeFile} loadDemoFiles={loadDemoFiles}
          datesOverlap={datesOverlap}
        />
      )}

      {step === 2 && (
        <Step2Horizon
          horizon={horizon} setHorizon={setHorizon}
          horizonStats={horizonStats}
          haveFiles={haveFiles} salesData={salesData} expenseData={expenseData}
          enoughHistory={enoughHistory} minWeeks={minWeeks}
        />
      )}

      {step === 3 && (
        <Step3Mode
          mode={mode} setMode={setMode}
          tau={tau} setTau={setTau}
          horizon={horizon} thresholds={thresholds}
        />
      )}

      {step === 4 && (
        <Step4Confirm
          umkmId={umkmId} umkmName={umkmName} umkmSector={umkmSector}
          salesData={salesData} expenseData={expenseData}
          horizon={horizon} mode={mode} tau={tau}
          horizonStats={horizonStats}
          horizonHistoryOK={horizonHistoryOK} minWeeks={minWeeks}
          running={running} pipelineStep={pipelineStep} pipelineSteps={pipelineSteps}
          runPipeline={runPipeline}
          predictionDone={predictionDone}
          setPage={setPage}
          goBack={goBack}
        />
      )}

      {/* Nav buttons (except on step 4 — handled inline there) */}
      {step < 4 && (
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18}}>
          <button
            className="btn btn-ghost"
            onClick={goBack}
            disabled={step === 1}
            style={step === 1 ? {visibility: 'hidden'} : {}}
          >← Kembali</button>
          <div style={{fontSize: 12, color: 'var(--ink-4)'}}>
            Langkah {step} dari 4
          </div>
          <button
            className="btn btn-primary"
            onClick={goNext}
            disabled={step === 1 && !step1Ready}
          >
            Lanjutkan →
          </button>
        </div>
      )}

      <div className="disclaimer">
        <strong>⚠️ Catatan:</strong> Prototipe Tugas Akhir STI ITB 2025. Prediksi tidak dapat
        digunakan sebagai dasar keputusan bisnis nyata tanpa validasi lebih lanjut.
      </div>
    </div>
  );
};

// =========================================================================
// Stepper bar
const Stepper = ({ steps, current, onJump }) => (
  <div style={{
    background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)',
    padding: '16px 8px', marginBottom: 18, display: 'grid',
    gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 0, position: 'relative',
  }}>
    {steps.map((s, i) => {
      const done = s.n < current;
      const active = s.n === current;
      return (
        <div
          key={s.n}
          onClick={() => onJump(s.n)}
          style={{
            cursor: 'pointer', padding: '4px 12px', display: 'flex',
            alignItems: 'center', gap: 10, position: 'relative', minWidth: 0,
          }}
        >
          {i > 0 && (
            <div style={{
              position: 'absolute', left: 0, top: '50%',
              width: '50%', height: 2,
              background: done || active ? 'var(--accent)' : 'var(--line)',
              transform: 'translate(-100%, -50%)', zIndex: 0,
            }}/>
          )}
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: done ? 'var(--accent)' : active ? 'white' : 'var(--canvas)',
            border: `2px solid ${done || active ? 'var(--accent)' : 'var(--line-2)'}`,
            color: done ? 'white' : active ? 'var(--accent)' : 'var(--ink-4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0, zIndex: 1, position: 'relative',
            transition: 'all .2s',
          }}>
            {done ? '✓' : s.n}
          </div>
          <div style={{minWidth: 0}}>
            <div style={{
              fontSize: 13, fontWeight: active ? 700 : 600,
              color: active ? 'var(--ink)' : done ? 'var(--ink-2)' : 'var(--ink-4)',
              lineHeight: 1.2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
            }}>{s.label}</div>
            <div style={{fontSize: 11, color: 'var(--ink-4)', marginTop: 2,
              textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
            }}>{s.hint}</div>
          </div>
        </div>
      );
    })}
  </div>
);

// =========================================================================
// STEP 1 — Data Usaha (identitas + upload)
const Step1Data = ({
  umkmId, setUmkmId, umkmName, setUmkmName, umkmSector, setUmkmSector,
  tab, setTab,
  salesData, expenseData, salesError, expenseError,
  salesInputRef, expenseInputRef,
  handleFile, onDrop, onDragOver, onDragLeave, removeFile, loadDemoFiles,
  datesOverlap,
}) => {
  const haveFiles = salesData && expenseData;
  return (
    <>
      <div className="card" style={{marginBottom: 14}}>
        <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8}}>
          <div>
            <div className="card-title">🪪 Tentang Usaha Anda</div>
            <div className="card-sub">Beri nama dan kode singkat untuk usaha yang akan dianalisis.</div>
          </div>
          <button className="btn btn-ghost" onClick={loadDemoFiles}>
            ✨ Belum siap? Pakai data contoh
          </button>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 16, marginTop: 12}}>
          <div>
            <label className="field-label">Kode Usaha <span style={{color: 'var(--hr)'}}>*</span></label>
            <input
              className="input mono"
              placeholder="cth: TOKO_BU_SRI"
              value={umkmId}
              onChange={(e) => setUmkmId(e.target.value)}
              autoComplete="off"
            />
            <div className="field-hint">Tanpa spasi, untuk arsip Anda.</div>
          </div>
          <div>
            <label className="field-label">Nama Usaha <span style={{color: 'var(--hr)'}}>*</span></label>
            <input
              className="input"
              placeholder="cth: Toko Sembako Bu Sri"
              value={umkmName}
              onChange={(e) => setUmkmName(e.target.value)}
            />
            <div className="field-hint">Akan muncul di laporan hasil prediksi.</div>
          </div>
          <div>
            <label className="field-label">Jenis Usaha</label>
            <select className="select" value={umkmSector} onChange={(e) => setUmkmSector(e.target.value)}>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="field-hint">Untuk perbandingan dengan usaha sejenis.</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">📁 Riwayat Transaksi (2 File)</div>
        <div className="card-sub">
          Sistem perlu dua file: catatan <strong>uang masuk</strong> (penjualan) dan
          <strong> uang keluar</strong> (pengeluaran). Format CSV.
        </div>

        <div className="tabs">
          <div className={`tab ${tab === 'upload' ? 'active' : ''}`} onClick={() => setTab('upload')}>
            Unggah File Saya
          </div>
          <div className={`tab ${tab === 'format' ? 'active' : ''}`} onClick={() => setTab('format')}>
            Format & Template
          </div>
        </div>

        {tab === 'upload' && (
          <>
            <div className="grid-2">
              <FileDrop
                kind="sales"
                title="Catatan Penjualan (Uang Masuk)"
                hint="2 kolom: tanggal, jumlah penjualan"
                file={salesData} error={salesError}
                inputRef={salesInputRef}
                onPick={(f) => handleFile('sales', f)}
                onDrop={onDrop('sales')}
                onDragOver={onDragOver} onDragLeave={onDragLeave}
                onRemove={() => removeFile('sales')}
              />
              <FileDrop
                kind="expense"
                title="Catatan Pengeluaran (Uang Keluar)"
                hint="2 kolom: tanggal, jumlah pengeluaran"
                file={expenseData} error={expenseError}
                inputRef={expenseInputRef}
                onPick={(f) => handleFile('expense', f)}
                onDrop={onDrop('expense')}
                onDragOver={onDragOver} onDragLeave={onDragLeave}
                onRemove={() => removeFile('expense')}
              />
            </div>

            {haveFiles && (
              <FilePreview salesData={salesData} expenseData={expenseData} datesOverlap={datesOverlap}/>
            )}

            {!salesData && !expenseData && (
              <div className="alert alert-info" style={{marginTop: 14}}>
                <span className="alert-icon">💡</span>
                <div>
                  <div className="alert-title">Belum punya file siap pakai?</div>
                  Klik <strong>"Pakai data contoh"</strong> di atas untuk mencoba sistem, atau
                  buka tab <strong>Format & Template</strong> untuk mengunduh contoh yang bisa Anda isi.
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'format' && <FormatTab />}
      </div>
    </>
  );
};

// =========================================================================
// STEP 2 — Rentang Prediksi
const Step2Horizon = ({ horizon, setHorizon, horizonStats, haveFiles, salesData, expenseData, enoughHistory, minWeeks }) => {
  return (
    <>
      <div className="card">
        <div className="card-title">⏳ Mau lihat sejauh apa ke depan?</div>
        <div className="card-sub">
          Pilih jangka waktu prediksi. Semakin dekat, semakin akurat.
        </div>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12}}>
          {[4, 12, 24].map(h => {
            const label = HORIZON_LABELS[h];
            const selected = horizon === h;
            const accuracyPct = Math.round(horizonStats[h].macroF1 * 100);
            return (
              <div
                key={h}
                onClick={() => setHorizon(h)}
                style={{
                  border: `2px solid ${selected ? 'var(--accent)' : 'var(--line-2)'}`,
                  background: selected ? 'rgba(52, 152, 219, 0.04)' : 'white',
                  borderRadius: 'var(--r-lg)', padding: '18px 18px 16px',
                  cursor: 'pointer', transition: 'all .15s', position: 'relative',
                }}
              >
                {selected && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--accent)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                  }}>✓</div>
                )}
                <div style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: selected ? 'var(--accent)' : 'var(--ink-4)',
                  marginBottom: 6,
                }}>{label.sub}</div>
                <div style={{fontSize: 22, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.15, letterSpacing: '-0.01em'}}>
                  {label.headline}
                </div>
                <div style={{fontSize: 12.5, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.4}}>
                  {label.caption}
                </div>

                <div style={{
                  marginTop: 14, paddingTop: 12,
                  borderTop: '1px dashed var(--line)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 11.5, color: 'var(--ink-3)',
                }}>
                  <span>Akurasi model</span>
                  <span className="mono" style={{fontWeight: 700, color: 'var(--ink-2)'}}>
                    ~{accuracyPct}%
                  </span>
                </div>
                <div style={{marginTop: 6, fontSize: 11, color: 'var(--ink-4)'}}>
                  Butuh riwayat ≥ <span className="mono">{MIN_WEEKS[h]} minggu</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="alert alert-info" style={{marginTop: 16}}>
          <span className="alert-icon">💡</span>
          <div>
            <div className="alert-title">Tidak yakin?</div>
            Jika baru pertama kali mencoba, pilih <strong>1 bulan ke depan</strong>. Prediksinya
            paling tajam dan kebutuhan datanya paling ringan.
          </div>
        </div>

        {haveFiles && !enoughHistory && (
          <div className="alert alert-warn" style={{marginTop: 12}}>
            <span className="alert-icon">⚠️</span>
            <div>
              <div className="alert-title">Riwayat Anda mungkin kurang</div>
              Untuk prediksi <strong>{HORIZON_LABELS[horizon].headline}</strong>, sistem ingin
              riwayat ≥ <strong>{minWeeks} minggu</strong>. Data Anda saat ini hanya
              <strong> {Math.min(salesData.weeks, expenseData.weeks)} minggu</strong>.
              Anda masih bisa lanjut, tetapi akurasinya berkurang.
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// =========================================================================
// STEP 3 — Cara Menampilkan Hasil (mode + threshold)
const Step3Mode = ({ mode, setMode, tau, setTau, horizon, thresholds }) => {
  return (
    <>
      <div className="card" style={{marginBottom: 14}}>
        <div className="card-title">🎯 Bagaimana hasil prediksi ditampilkan?</div>
        <div className="card-sub">
          Pilih tingkat detail yang paling mudah Anda baca.
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14}}>
          <ModeCard
            selected={mode === '3'} onClick={() => setMode('3')}
            label="Tiga Tingkat"
            tag="LEBIH DETAIL"
            description="Hasil dibagi menjadi tiga kategori: Aman, Waspada, dan Berisiko."
            preview={[
              { color: 'var(--safe)', bg: 'var(--safe-bg)', label: 'Aman' },
              { color: 'var(--warn)', bg: 'var(--warn-bg)', label: 'Waspada' },
              { color: 'var(--hr)',   bg: 'var(--hr-bg)',   label: 'Berisiko' },
            ]}
            note="Cocok untuk pemantauan rutin — bisa membedakan keadaan stabil dan keadaan perlu perhatian."
          />
          <ModeCard
            selected={mode === '2'} onClick={() => setMode('2')}
            label="Dua Tingkat"
            tag="LEBIH SEDERHANA"
            description="Hasil hanya: Aman atau Berisiko. Tanpa zona tengah."
            preview={[
              { color: 'var(--safe)', bg: 'var(--safe-bg)', label: 'Aman' },
              { color: 'var(--hr)',   bg: 'var(--hr-bg)',   label: 'Berisiko' },
            ]}
            note="Cocok untuk keputusan cepat ya/tidak. Cepat dibaca tanpa interpretasi tambahan."
          />
        </div>
      </div>

      {/* Auto-tuned & macro integration — both NOT user-configurable */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
        <div className="alert alert-success" style={{alignItems: 'flex-start'}}>
          <span className="alert-icon">🎯</span>
          <div>
            <div className="alert-title">Kepekaan peringatan sudah disetel otomatis</div>
            Sistem memakai pengaturan terbaik hasil uji ribuan kombinasi —
            menyeimbangkan <strong>ketepatan</strong>, <strong>cakupan</strong>, dan
            <strong> jumlah peringatan keliru</strong>. Anda tidak perlu mengatur apa pun.
          </div>
        </div>
        <div className="alert alert-success" style={{alignItems: 'flex-start'}}>
          <span className="alert-icon">🌐</span>
          <div>
            <div className="alert-title">Data ekonomi nasional sudah disertakan otomatis</div>
            Setiap prediksi memperhitungkan <strong>inflasi</strong>, <strong>suku bunga BI</strong>,
            dan <strong>nilai tukar rupiah</strong> di samping data usaha Anda.
          </div>
        </div>
      </div>
    </>
  );
};

const ModeCard = ({ selected, onClick, label, tag, description, preview, note }) => (
  <div
    onClick={onClick}
    style={{
      border: `2px solid ${selected ? 'var(--accent)' : 'var(--line-2)'}`,
      background: selected ? 'rgba(52, 152, 219, 0.04)' : 'white',
      borderRadius: 'var(--r-lg)', padding: '18px 18px 16px',
      cursor: 'pointer', transition: 'all .15s', position: 'relative',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}
  >
    {selected && (
      <div style={{
        position: 'absolute', top: 12, right: 12,
        width: 22, height: 22, borderRadius: '50%',
        background: 'var(--accent)', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
      }}>✓</div>
    )}
    <div style={{
      fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em',
      color: selected ? 'var(--accent)' : 'var(--ink-4)',
    }}>{tag}</div>
    <div style={{fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em'}}>
      {label}
    </div>
    <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
      {preview.map((p, i) => (
        <span key={i} style={{
          background: p.bg, color: p.color, fontWeight: 700, fontSize: 11.5,
          padding: '4px 10px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{width: 6, height: 6, borderRadius: '50%', background: p.color}}></span>
          {p.label}
        </span>
      ))}
    </div>
    <div style={{fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5}}>{description}</div>
    <div style={{fontSize: 11.5, color: 'var(--ink-4)', lineHeight: 1.5, marginTop: 'auto', fontStyle: 'italic'}}>
      {note}
    </div>
  </div>
);

// =========================================================================
// STEP 4 — Konfirmasi & Jalankan
const Step4Confirm = ({
  umkmId, umkmName, umkmSector,
  salesData, expenseData,
  horizon, mode, tau, horizonStats,
  horizonHistoryOK, minWeeks,
  running, pipelineStep, pipelineSteps, runPipeline,
  predictionDone, setPage, goBack,
}) => {
  const totalIn = salesData ? salesData.total : 0;
  const totalOut = expenseData ? expenseData.total : 0;
  const weeks = salesData && expenseData ? Math.min(salesData.weeks, expenseData.weeks) : 0;

  return (
    <>
      <div className="card" style={{marginBottom: 14}}>
        <div className="card-title">📋 Periksa Sebelum Jalan</div>
        <div className="card-sub">
          Pastikan semuanya sudah benar. Anda bisa kembali ke langkah sebelumnya untuk mengubah.
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14}}>
          <SummaryBlock title="Usaha Anda" items={[
            { k: 'Nama', v: umkmName || '—' },
            { k: 'Kode', v: <span className="mono">{umkmId || '—'}</span> },
            { k: 'Jenis', v: umkmSector },
          ]} />
          <SummaryBlock title="Data yang Dibaca" items={[
            { k: 'File penjualan', v: salesData ? `${salesData.name} · ${salesData.rows} baris` : '—' },
            { k: 'File pengeluaran', v: expenseData ? `${expenseData.name} · ${expenseData.rows} baris` : '—' },
            { k: 'Rentang', v: salesData && expenseData
              ? <span className="mono" style={{fontSize: 11.5}}>{salesData.minDate} → {salesData.maxDate}</span>
              : '—' },
            { k: 'Riwayat', v: `${weeks} minggu` },
            { k: 'Total uang masuk', v: <span className="mono">Rp {formatShort(totalIn)}</span> },
            { k: 'Total uang keluar', v: <span className="mono">Rp {formatShort(totalOut)}</span> },
          ]} />
          <SummaryBlock title="Pengaturan Prediksi" items={[
            { k: 'Rentang prediksi', v: <strong>{HORIZON_LABELS[horizon].headline}</strong> },
            { k: 'Akurasi model', v: `~${Math.round(horizonStats[horizon].macroF1 * 100)}%` },
            { k: 'Tampilan hasil', v: mode === '3' ? 'Tiga tingkat (Aman / Waspada / Berisiko)' : 'Dua tingkat (Aman / Berisiko)' },
            { k: 'Kepekaan peringatan', v: 'Otomatis (terbaik)' },
          ]} />
          <SummaryBlock title="Otomatis Disertakan" items={[
            { k: 'Inflasi nasional', v: '✓ Aktif' },
            { k: 'Suku bunga BI', v: '✓ Aktif' },
            { k: 'Nilai tukar rupiah', v: '✓ Aktif' },
          ]} accent="success" />
        </div>

        {!horizonHistoryOK && (
          <div className="alert alert-warn" style={{marginTop: 14}}>
            <span className="alert-icon">⚠️</span>
            <div>
              <div className="alert-title">Riwayat di bawah anjuran</div>
              Untuk rentang prediksi yang dipilih, sistem menganjurkan ≥ <strong>{minWeeks} minggu</strong> data.
              Anda tetap bisa menjalankan, namun akurasi tidak optimal.
            </div>
          </div>
        )}
      </div>

      {!running && !predictionDone && (
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6}}>
          <button className="btn btn-ghost" onClick={goBack}>← Ubah pengaturan</button>
          <button className="btn btn-primary" style={{padding: '12px 22px', fontSize: 14}} onClick={runPipeline}>
            🚀 Jalankan Prediksi Sekarang
          </button>
        </div>
      )}

      {running && (
        <div className="card" style={{background: 'var(--canvas)', border: '1px dashed var(--accent)'}}>
          <div className="card-title">⏳ Sedang Menganalisis…</div>
          <div className="card-sub">
            Mohon tunggu sebentar. Sistem sedang membaca data dan menjalankan model.
          </div>
          <div className="pipeline" style={{marginTop: 10}}>
            {pipelineSteps.map((stepLabel, i) => {
              const done = i < pipelineStep;
              const active = i === pipelineStep;
              return (
                <div className="pipeline-row" key={i}>
                  <span className="pipeline-label">
                    {done ? '✓ ' : active ? <span className="spinner" style={{marginRight: 6}}></span> : '○ '}
                    {i + 1}. {stepLabel}
                  </span>
                  <div className="pipeline-bar">
                    <div className="pipeline-fill" style={{width: done ? '100%' : active ? '60%' : '0%'}}/>
                  </div>
                  <span className={`pipeline-status ${done ? 'done' : ''}`}>
                    {done ? 'Selesai' : active ? '...' : 'menunggu'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {predictionDone && !running && (
        <div className="alert alert-success" style={{alignItems: 'center', marginTop: 6}}>
          <span className="alert-icon">✅</span>
          <div style={{flex: 1}}>
            <div className="alert-title">Selesai! Laporan Anda sudah siap.</div>
            Klik tombol di samping untuk melihat hasil prediksi lengkap.
          </div>
          <button className="btn btn-accent" onClick={() => setPage('hasil')}>
            Lihat Laporan →
          </button>
        </div>
      )}
    </>
  );
};

const SummaryBlock = ({ title, items, accent }) => (
  <div style={{
    background: accent === 'success' ? 'var(--safe-bg)' : 'var(--canvas)',
    border: `1px solid ${accent === 'success' ? 'rgba(39,174,96,0.25)' : 'var(--line)'}`,
    borderRadius: 'var(--r-md)', padding: '14px 16px',
  }}>
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      color: accent === 'success' ? 'var(--safe)' : 'var(--ink-4)', marginBottom: 8,
    }}>{title}</div>
    {items.map((it, i) => (
      <div className="kv" key={i}>
        <span className="k">{it.k}</span>
        <span className="v">{it.v}</span>
      </div>
    ))}
  </div>
);

// =========================================================================
// File dropzone with real <input type="file">
const FileDrop = ({ kind, title, hint, file, error, inputRef, onPick, onDrop, onDragOver, onDragLeave, onRemove }) => {
  const click = () => inputRef.current && inputRef.current.click();
  const valueCol = kind === 'sales' ? 'sub_total' : 'total';

  return (
    <div>
      <div
        className={`dropzone ${file ? 'has-file' : ''} ${error ? 'has-error' : ''}`}
        onClick={click}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          ref={inputRef} type="file" accept=".csv,text/csv" style={{display: 'none'}}
          onChange={(e) => {
            const f = e.target.files && e.target.files[0];
            if (f) onPick(f);
          }}
        />
        <div className="dropzone-icon">{file ? '📄' : error ? '⚠️' : '⬆️'}</div>
        <div className="dropzone-title">{file ? file.name : title}</div>
        <div className="dropzone-hint">
          {file
            ? `${file.rows.toLocaleString('id-ID')} baris · ${file.weeks} minggu riwayat · ${formatBytes(file.size)}`
            : hint}
        </div>
        {!file && !error && (
          <div style={{marginTop: 10, fontSize: 11, color: 'var(--accent)'}}>
            Klik untuk pilih file · atau seret CSV ke sini
          </div>
        )}
        {file && (
          <div style={{marginTop: 8, display: 'flex', justifyContent: 'center', gap: 12}}>
            <span style={{fontSize: 11, color: 'var(--ink-3)'}} className="mono">
              {file.minDate} → {file.maxDate}
            </span>
            <button
              className="btn-link-danger"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
            >Hapus</button>
          </div>
        )}
      </div>
      {error && (
        <div style={{
          marginTop: 8, fontSize: 12, color: 'var(--hr)', background: 'var(--hr-bg)',
          padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(231,76,60,0.2)', lineHeight: 1.5,
        }}>
          <strong>Tidak bisa diproses:</strong> {error}
        </div>
      )}
      {file && file.badDates + file.badValues > 0 && (
        <div style={{marginTop: 8, fontSize: 11.5, color: 'var(--warn)', fontStyle: 'italic'}}>
          ⚠️ {file.badDates} baris dengan tanggal invalid, {file.badValues} baris dengan {valueCol} invalid dilewati.
        </div>
      )}
    </div>
  );
};

// =========================================================================
const FilePreview = ({ salesData, expenseData, datesOverlap }) => {
  const clr = expenseData.total > 0 ? salesData.total / expenseData.total : 0;
  return (
    <>
      <div style={{marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10}}>
        <MiniStat label="Total Uang Masuk" value={`Rp ${formatShort(salesData.total)}`} hint={`${salesData.rows} transaksi`} />
        <MiniStat label="Total Uang Keluar" value={`Rp ${formatShort(expenseData.total)}`} hint={`${expenseData.rows} transaksi`} />
        <MiniStat
          label="Rasio Arus Kas"
          value={clr.toFixed(2)}
          hint={clr > 1 ? 'Surplus (uang masuk > keluar)' : 'Defisit (perlu perhatian)'}
          tone={clr > 1 ? 'safe' : 'warn'}
        />
        <MiniStat
          label="Riwayat Terkumpul"
          value={`${Math.min(salesData.weeks, expenseData.weeks)} mgg`}
          hint="dipakai untuk prediksi"
        />
      </div>

      <div style={{marginTop: 14}}>
        <div style={{fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6}}>
          Cuplikan {salesData.name}
        </div>
        <PreviewTable headers={['tanggal', 'jumlah penjualan']} rows={salesData.preview} />
      </div>
      <div style={{marginTop: 12}}>
        <div style={{fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6}}>
          Cuplikan {expenseData.name}
        </div>
        <PreviewTable headers={['tanggal', 'jumlah pengeluaran']} rows={expenseData.preview} />
      </div>

      {!datesOverlap && (
        <div className="alert alert-error" style={{marginTop: 14}}>
          <span className="alert-icon">❌</span>
          <div>
            <div className="alert-title">Rentang tanggal tidak cocok</div>
            Penjualan: {salesData.minDate} → {salesData.maxDate}<br/>
            Pengeluaran: {expenseData.minDate} → {expenseData.maxDate}<br/>
            Tidak ada minggu yang sama antara keduanya. Periksa kembali file Anda.
          </div>
        </div>
      )}
    </>
  );
};

const PreviewTable = ({ headers, rows }) => (
  <div className="table-wrap">
    <table className="data">
      <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="mono">{r.date}</td>
            <td className="mono" style={{textAlign: 'right'}}>Rp {r.value.toLocaleString('id-ID')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MiniStat = ({ label, value, hint, tone }) => (
  <div style={{
    background: tone === 'safe' ? 'var(--safe-bg)' : tone === 'warn' ? 'var(--warn-bg)' : 'white',
    border: `1px solid ${tone === 'safe' ? 'rgba(39,174,96,0.25)' : tone === 'warn' ? 'rgba(243,156,18,0.3)' : 'var(--line)'}`,
    borderRadius: 8, padding: '10px 12px',
  }}>
    <div style={{fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-4)'}}>
      {label}
    </div>
    <div style={{fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginTop: 2, fontVariantNumeric: 'tabular-nums'}}>
      {value}
    </div>
    <div style={{fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1}}>{hint}</div>
  </div>
);

// =========================================================================
const FormatTab = () => {
  const sampleSales = [
    { date: '2025-01-06', sub_total: 1_450_000 },
    { date: '2025-01-07', sub_total: 1_620_000 },
    { date: '2025-01-08', sub_total: 980_000 },
    { date: '2025-01-09', sub_total: 2_100_000 },
  ];
  const sampleExpense = [
    { date: '2025-01-06', total: 720_000 },
    { date: '2025-01-07', total: 850_000 },
    { date: '2025-01-08', total: 410_000 },
    { date: '2025-01-09', total: 1_200_000 },
  ];

  const download = (kind) => {
    triggerDownload(`template_${kind}.csv`, buildTemplate(kind));
  };

  return (
    <div>
      <div className="alert alert-info" style={{marginBottom: 14}}>
        <span className="alert-icon">📌</span>
        <div>
          <div className="alert-title">Format yang dipakai</div>
          Tiap file CSV berisi <strong>satu usaha saja</strong>. Hanya dua kolom: <span className="mono">date</span>
          (tanggal) dan kolom nilai (<span className="mono">sub_total</span> untuk penjualan,
          atau <span className="mono">total</span> untuk pengeluaran).
        </div>
      </div>

      <div className="grid-2">
        <div>
          <div className="field-label">📥 Penjualan (Uang Masuk)</div>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>date</th><th>sub_total</th></tr></thead>
              <tbody>
                {sampleSales.map((r, i) => (
                  <tr key={i}>
                    <td className="mono">{r.date}</td>
                    <td className="mono" style={{textAlign:'right'}}>{r.sub_total.toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-accent" style={{marginTop: 10}} onClick={() => download('sales')}>
            📥 Unduh contoh template
          </button>
        </div>
        <div>
          <div className="field-label">📤 Pengeluaran (Uang Keluar)</div>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>date</th><th>total</th></tr></thead>
              <tbody>
                {sampleExpense.map((r, i) => (
                  <tr key={i}>
                    <td className="mono">{r.date}</td>
                    <td className="mono" style={{textAlign:'right'}}>{r.total.toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-accent" style={{marginTop: 10}} onClick={() => download('expense')}>
            📥 Unduh contoh template
          </button>
        </div>
      </div>

      <div className="alert alert-info" style={{marginTop: 16}}>
        <span className="alert-icon">ℹ️</span>
        <div>
          <div className="alert-title">Tips pengisian</div>
          <ul style={{margin: '4px 0 0 16px', padding: 0, fontSize: 12, lineHeight: 1.6}}>
            <li>Tanggal harus <span className="mono">YYYY-MM-DD</span> (contoh: 2025-01-06).</li>
            <li>Nilai cukup angka saja, tanpa <span className="mono">Rp</span>, titik, atau koma (contoh: 1450000).</li>
            <li>Baris yang tanggal/nilainya tidak valid akan otomatis dilewati.</li>
            <li>Sistem akan mengelompokkan transaksi ke level mingguan secara otomatis.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// ----- helpers -----
const formatBytes = (b) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const formatShort = (n) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} Mlr`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} Jt`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} Rb`;
  return String(Math.round(n));
};

window.InputPage = InputPage;
