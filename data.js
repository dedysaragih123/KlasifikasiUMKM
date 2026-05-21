// ============================================================
// Mock data for UMKM Liquidity Risk Classifier prototype
// ============================================================

window.MOCK = (function () {

  // Threshold τ* per horizon (from thresholds.pkl)
  const thresholds = {
    4: 0.42,
    12: 0.38,
    24: 0.45,
  };
  const q25q75 = {
    4: { q25: 0.82, q75: 1.45 },
    12: { q25: 0.78, q75: 1.52 },
    24: { q25: 0.71, q75: 1.61 },
  };

  // Performance numbers per horizon (research results)
  const horizonStats = {
    4:  { macroF1: 0.591, recallHR: 77.3, model: "Stacking",   modelLong: "Stacking Classifier (LR meta-learner)" },
    12: { macroF1: 0.561, recallHR: 74.1, model: "SoftVoting", modelLong: "Soft Voting Ensemble (XGB+LGB+ET)" },
    24: { macroF1: 0.528, recallHR: 69.8, model: "LightGBM",   modelLong: "LightGBM (DART booster)" },
  };

  // 12 UMKM with realistic-looking predictions
  // CLR series simulated weekly across 28 weeks
  function genCLR(seed, baseline, trend, noise, weeks = 28) {
    // simple seeded random
    let s = seed;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const arr = [];
    for (let i = 0; i < weeks; i++) {
      const v = baseline + trend * i + (rand() - 0.5) * noise;
      arr.push(Math.max(0.05, +v.toFixed(3)));
    }
    return arr;
  }

  const umkmList = [
    { id: "UMKM_001", nama: "Toko Sembako Bu Sri",     sektor: "Retail",       prob: 0.87, clrSeries: genCLR(11, 1.6, -0.04, 0.3), tau4: 0.42 },
    { id: "UMKM_002", nama: "Warung Makan Pak Joko",   sektor: "F&B",          prob: 0.81, clrSeries: genCLR(22, 1.4, -0.035, 0.28) },
    { id: "UMKM_003", nama: "Konveksi Citra Busana",   sektor: "Manufaktur",   prob: 0.72, clrSeries: genCLR(33, 1.2, -0.022, 0.25) },
    { id: "UMKM_004", nama: "Salon Cantika",           sektor: "Jasa",         prob: 0.64, clrSeries: genCLR(44, 1.1, -0.018, 0.22) },
    { id: "UMKM_005", nama: "Bengkel Motor Jaya",      sektor: "Jasa",         prob: 0.58, clrSeries: genCLR(55, 1.05, -0.012, 0.2)  },
    { id: "UMKM_006", nama: "Toko Bangunan Maju",      sektor: "Retail",       prob: 0.47, clrSeries: genCLR(66, 1.0, -0.005, 0.18) },
    { id: "UMKM_007", nama: "Laundry Bersih Wangi",    sektor: "Jasa",         prob: 0.33, clrSeries: genCLR(77, 1.1, 0.004, 0.15) },
    { id: "UMKM_008", nama: "Kafe Kopi Senja",         sektor: "F&B",          prob: 0.28, clrSeries: genCLR(88, 1.15, 0.006, 0.16) },
    { id: "UMKM_009", nama: "Toko Buku Aksara",        sektor: "Retail",       prob: 0.22, clrSeries: genCLR(99, 1.2, 0.008, 0.14) },
    { id: "UMKM_010", nama: "Catering Sehat",          sektor: "F&B",          prob: 0.18, clrSeries: genCLR(110, 1.3, 0.01, 0.14) },
    { id: "UMKM_011", nama: "Toko Elektronik Surya",   sektor: "Retail",       prob: 0.14, clrSeries: genCLR(121, 1.4, 0.011, 0.12) },
    { id: "UMKM_012", nama: "Apotek Sehat Selalu",     sektor: "Retail",       prob: 0.09, clrSeries: genCLR(132, 1.55, 0.012, 0.1) },
  ];

  umkmList.forEach((u) => {
    u.clrLast = u.clrSeries[u.clrSeries.length - 1];
    // Slope of last 4 weeks (simple linear regression)
    const last4 = u.clrSeries.slice(-4);
    const mean = last4.reduce((a, b) => a + b, 0) / 4;
    const ms = [0, 1, 2, 3].reduce((acc, i) => acc + (i - 1.5) * (last4[i] - mean), 0);
    u.slope4 = +(ms / 5).toFixed(3);
    u.tren = u.slope4 > 0.02 ? "up" : u.slope4 < -0.02 ? "down" : "flat";
    u.weekLast = "2025-02-24";
  });

  // Feature definitions used in detail page (top features for H=4 Stacking)
  const topFeaturesH4 = [
    { name: "clr_lag1",         imp: 0.182, group: "lag" },
    { name: "clr_roll4_mean",   imp: 0.146, group: "roll" },
    { name: "clr_slope4",       imp: 0.118, group: "tren" },
    { name: "clr_vs_q25",       imp: 0.097, group: "lag" },
    { name: "clr_roll12_mean",  imp: 0.083, group: "roll" },
    { name: "clr_delta4",       imp: 0.071, group: "tren" },
    { name: "macro_inflasi_lag1",imp:0.062, group: "makro" },
    { name: "clr_x_inflasi",    imp: 0.054, group: "makro" },
    { name: "clr_pct_vs_peers", imp: 0.048, group: "lain" },
    { name: "macro_bi_rate_lag1",imp:0.039, group: "makro" },
  ];

  // Per-UMKM feature values (generated relative to the UMKM's profile)
  function featureValuesFor(umkm, hz) {
    const last = umkm.clrLast;
    const recent = umkm.clrSeries.slice(-4);
    const mean4 = +(recent.reduce((a, b) => a + b, 0) / 4).toFixed(3);
    return [
      { name: "clr_lag1",          value: last, group: "lag",   extreme: last < q25q75[hz].q25 },
      { name: "clr_roll4_mean",    value: mean4, group: "roll", extreme: mean4 < q25q75[hz].q25 },
      { name: "clr_slope4",        value: umkm.slope4, group: "tren", extreme: umkm.slope4 < -0.03 },
      { name: "clr_vs_q25",        value: +(last - q25q75[hz].q25).toFixed(3), group: "lag", extreme: (last - q25q75[hz].q25) < -0.2 },
      { name: "clr_roll12_mean",   value: +(mean4 + 0.05).toFixed(3), group: "roll", extreme: false },
      { name: "clr_delta4",        value: +(last - umkm.clrSeries[umkm.clrSeries.length - 5]).toFixed(3), group: "tren", extreme: false },
      { name: "macro_inflasi_lag1",value: 0.0273, group: "makro", extreme: false },
      { name: "clr_x_inflasi",     value: +(last * 0.0273).toFixed(4), group: "makro", extreme: false },
      { name: "clr_pct_vs_peers",  value: 0.31, group: "lain", extreme: false },
      { name: "macro_bi_rate_lag1",value: 0.0600, group: "makro", extreme: false },
    ];
  }

  // Model performance tables (Section 4, hardcoded)
  const trackA = {
    4: {
      'Extra Trees': { MacroF1: 0.5689, F1_HR: 0.6723, Prec_HR: 0.6234, Rec_HR: 0.7512, AUC: 0.78 },
      'XGBoost':     { MacroF1: 0.5845, F1_HR: 0.6945, Prec_HR: 0.6345, Rec_HR: 0.7634, AUC: 0.81 },
      'LightGBM':    { MacroF1: 0.5778, F1_HR: 0.6812, Prec_HR: 0.6289, Rec_HR: 0.7589, AUC: 0.79 },
      'Stacking':    { MacroF1: 0.5912, F1_HR: 0.7156, Prec_HR: 0.6489, Rec_HR: 0.7734, AUC: 0.83 },
    },
    12: {
      'Extra Trees': { MacroF1: 0.5421, F1_HR: 0.6512, Prec_HR: 0.6011, Rec_HR: 0.7234, AUC: 0.76 },
      'XGBoost':     { MacroF1: 0.5567, F1_HR: 0.6701, Prec_HR: 0.6178, Rec_HR: 0.7401, AUC: 0.78 },
      'LightGBM':    { MacroF1: 0.5489, F1_HR: 0.6634, Prec_HR: 0.6123, Rec_HR: 0.7345, AUC: 0.77 },
      'Stacking':    { MacroF1: 0.5612, F1_HR: 0.6789, Prec_HR: 0.6234, Rec_HR: 0.7456, AUC: 0.80 },
    },
    24: {
      'Extra Trees': { MacroF1: 0.5189, F1_HR: 0.6234, Prec_HR: 0.5734, Rec_HR: 0.6912, AUC: 0.73 },
      'XGBoost':     { MacroF1: 0.5267, F1_HR: 0.6378, Prec_HR: 0.5867, Rec_HR: 0.7012, AUC: 0.75 },
      'LightGBM':    { MacroF1: 0.5234, F1_HR: 0.6312, Prec_HR: 0.5823, Rec_HR: 0.6978, AUC: 0.74 },
      'Stacking':    { MacroF1: 0.5278, F1_HR: 0.6401, Prec_HR: 0.5889, Rec_HR: 0.7034, AUC: 0.76 },
    },
  };

  const trackB = {
    4: {
      'Extra Trees': { F1_HR: 0.7234, Prec_HR: 0.7023, Rec_HR: 0.7456, AUC: 0.85, MacroF1: 0.7156 },
      'XGBoost':     { F1_HR: 0.7389, Prec_HR: 0.7178, Rec_HR: 0.7612, AUC: 0.87, MacroF1: 0.7298 },
      'LightGBM':    { F1_HR: 0.7312, Prec_HR: 0.7098, Rec_HR: 0.7534, AUC: 0.86, MacroF1: 0.7234 },
      'SoftVoting':  { F1_HR: 0.7456, Prec_HR: 0.7234, Rec_HR: 0.7689, AUC: 0.88, MacroF1: 0.7345 },
    },
    12: {
      'Extra Trees': { F1_HR: 0.7034, Prec_HR: 0.6856, Rec_HR: 0.7223, AUC: 0.83, MacroF1: 0.6956 },
      'XGBoost':     { F1_HR: 0.7189, Prec_HR: 0.6989, Rec_HR: 0.7401, AUC: 0.85, MacroF1: 0.7102 },
      'LightGBM':    { F1_HR: 0.7123, Prec_HR: 0.6923, Rec_HR: 0.7334, AUC: 0.84, MacroF1: 0.7045 },
      'SoftVoting':  { F1_HR: 0.7245, Prec_HR: 0.7045, Rec_HR: 0.7456, AUC: 0.86, MacroF1: 0.7167 },
    },
    24: {
      'Extra Trees': { F1_HR: 0.6612, Prec_HR: 0.6423, Rec_HR: 0.6812, AUC: 0.80, MacroF1: 0.6534 },
      'XGBoost':     { F1_HR: 0.6745, Prec_HR: 0.6534, Rec_HR: 0.6967, AUC: 0.82, MacroF1: 0.6678 },
      'LightGBM':    { F1_HR: 0.6789, Prec_HR: 0.6578, Rec_HR: 0.7012, AUC: 0.82, MacroF1: 0.6712 },
      'SoftVoting':  { F1_HR: 0.6712, Prec_HR: 0.6512, Rec_HR: 0.6923, AUC: 0.81, MacroF1: 0.6634 },
    },
  };

  const bestTrackBPerH = { 4: 'SoftVoting', 12: 'SoftVoting', 24: 'LightGBM' };
  const bestTrackAPerH = { 4: 'Stacking', 12: 'Stacking', 24: 'Stacking' };

  const macroAblation = [
    { H: 4,  delta: 0.0082 },
    { H: 12, delta: 0.0301 },
    { H: 24, delta: 0.0103 },
  ];

  const macroCorr = [
    { v: "Inflasi YoY",  r: -0.08, p: "<0.05", note: "Lemah negatif, signifikan" },
    { v: "BI Rate",      r: -0.07, p: "<0.05", note: "Lemah negatif, signifikan" },
    { v: "Kurs USD/IDR", r: -0.10, p: "<0.05", note: "Lemah negatif, signifikan" },
  ];

  return {
    thresholds,
    q25q75,
    horizonStats,
    umkmList,
    topFeaturesH4,
    featureValuesFor,
    trackA,
    trackB,
    bestTrackAPerH,
    bestTrackBPerH,
    macroAblation,
    macroCorr,
  };
})();
