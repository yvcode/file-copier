import WelcomePage from './components/welcome/WelcomePage';
import ExplorerPage from './components/explorer/ExplorerPage';
import CopySummaryPage from './components/summary/CopySummaryPage';
import ErrorBanner from './components/common/ErrorBanner';
import { useAppOrchestrator } from './hooks/useAppOrchestrator';
import './App.css';

export default function App() {
  const {
    userName, setUserName,
    step, setStep,
    selectedItems,
    selectedPaths, setSelectedPaths,
    globalError, setGlobalError,
    updateCache,
    handleCopySelected,
    handleExcludeFile,
    resetSelectionAndGoBack
  } = useAppOrchestrator();

  return (
    <div className="app-container">
      {globalError && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, padding: '4px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <ErrorBanner message={globalError} onDismiss={() => setGlobalError(null)} />
        </div>
      )}

      {step === 1 && (
        <WelcomePage
          userName={userName}
          setUserName={setUserName}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <ExplorerPage
          userName={userName}
          selectedPaths={selectedPaths}
          setSelectedPaths={setSelectedPaths}
          onItemsLoaded={updateCache}
          onBack={() => setStep(1)}
          onCopy={handleCopySelected}
        />
      )}

      {step === 3 && (
        <CopySummaryPage
          userName={userName}
          selectedItems={selectedItems}
          onExcludeFile={handleExcludeFile}
          onBack={() => setStep(2)}
          onDone={resetSelectionAndGoBack}
        />
      )}
    </div>
  );
}
