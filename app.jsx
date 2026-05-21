// Root app — handles navigation + global state
const App = () => {
  const [page, setPage] = React.useState('landing');
  const [predictionDone, setPredictionDone] = React.useState(false);
  const [prediction, setPrediction] = React.useState({ horizon: 4, tau: 0.42 });
  const [submittedUMKM, setSubmittedUMKM] = React.useState(null);
  const [selectedUMKM, setSelectedUMKM] = React.useState(null);

  const M = window.MOCK;

  // umkmList = submitted UMKM (if any) prepended to historical peer dataset
  const effectiveList = React.useMemo(() => {
    if (!submittedUMKM) return M.umkmList;
    // Replace if same ID already exists, else prepend
    const without = M.umkmList.filter(u => u.id !== submittedUMKM.id);
    return [submittedUMKM, ...without];
  }, [submittedUMKM, M.umkmList]);

  const handlePredict = ({ horizon, tau, submittedUMKM: u }) => {
    setPrediction({ horizon, tau });
    if (u) {
      setSubmittedUMKM(u);
      setSelectedUMKM(u.id);
    }
    setPredictionDone(true);
  };

  return (
    <div className="app" data-screen-label={`${page}`}>
      <Sidebar
        currentPage={page}
        setPage={setPage}
        thresholds={M.thresholds}
      />
      {page === 'landing' && (
        <LandingPage
          setPage={setPage}
          thresholds={M.thresholds}
          horizonStats={M.horizonStats}
        />
      )}
      {page === 'input' && (
        <InputPage
          setPage={setPage}
          thresholds={M.thresholds}
          horizonStats={M.horizonStats}
          onPredict={handlePredict}
          predictionDone={predictionDone}
        />
      )}
      {page === 'hasil' && (
        <ResultsPage
          setPage={setPage}
          predictionDone={predictionDone}
          prediction={prediction}
          submittedUMKM={submittedUMKM}
          umkmList={effectiveList}
          peerList={M.umkmList}
          thresholds={M.thresholds}
          q25q75={M.q25q75}
          setSelectedUMKM={setSelectedUMKM}
        />
      )}
      {page === 'detail' && (
        <DetailPage
          setPage={setPage}
          predictionDone={predictionDone}
          prediction={prediction}
          submittedUMKM={submittedUMKM}
          umkmList={effectiveList}
          selectedUMKM={selectedUMKM || (submittedUMKM ? submittedUMKM.id : effectiveList[0].id)}
          setSelectedUMKM={setSelectedUMKM}
          topFeaturesH4={M.topFeaturesH4}
          featureValuesFor={M.featureValuesFor}
          q25q75={M.q25q75}
        />
      )}
      {page === 'riset' && (
        <ResearchPage
          trackA={M.trackA}
          trackB={M.trackB}
          bestTrackAPerH={M.bestTrackAPerH}
          bestTrackBPerH={M.bestTrackBPerH}
          macroAblation={M.macroAblation}
          macroCorr={M.macroCorr}
        />
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
