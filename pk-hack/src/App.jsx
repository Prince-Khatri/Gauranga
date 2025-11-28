import React, { useState } from "react";
import { BarChart3, Home, ArrowLeft } from "lucide-react";
import LandingPage from "./components/LandingPage";
import WizardContainer from "./components/WizardContainer";
import SurveyStep from "./components/SurveyStep";
import TapTestStep from "./components/TapTestStep";
import SpiralCanvasStep from "./components/SpiralCanvasStep";
import FinalDashboard from "./components/FinalDashboard";
import ResultsHistory from "./components/ResultsHistory";

function App() {
  const [currentStep, setCurrentStep] = useState("landing");
  const [testResults, setTestResults] = useState({
    survey: null,
    taps: null,
    spiral: null,
    final: null,
  });

  const handleStartAssessment = () => {
    setCurrentStep("survey");
  };

  const handleSurveyComplete = (result) => {
    setTestResults((prev) => ({ ...prev, survey: result }));
    setCurrentStep("taps");
  };

  const handleTapsComplete = (result) => {
    setTestResults((prev) => ({ ...prev, taps: result }));
    setCurrentStep("spiral");
  };

  const handleSpiralComplete = (result) => {
    setTestResults((prev) => ({ ...prev, spiral: result }));
    setCurrentStep("loading");
  };

  const handleFinalResults = (result) => {
    setTestResults((prev) => ({ ...prev, final: result }));
    setCurrentStep("results");
  };

  const handleRestart = () => {
    setCurrentStep("landing");
    setTestResults({
      survey: null,
      taps: null,
      spiral: null,
      final: null,
    });
  };

  const goToHistory = () => {
    setCurrentStep("history");
  };

  const goHome = () => {
    setCurrentStep("landing");
  };

  // Show navbar for all pages except landing
  const showNavbar = currentStep !== "landing";

  const renderStep = () => {
    switch (currentStep) {
      case "landing":
        return (
          <LandingPage
            onStart={handleStartAssessment}
            onViewHistory={goToHistory}
          />
        );

      case "survey":
      case "taps":
      case "spiral":
        return (
          <WizardContainer currentStep={currentStep} totalSteps={3}>
            {currentStep === "survey" && (
              <SurveyStep onComplete={handleSurveyComplete} />
            )}
            {currentStep === "taps" && (
              <TapTestStep onComplete={handleTapsComplete} />
            )}
            {currentStep === "spiral" && (
              <SpiralCanvasStep
                onComplete={handleSpiralComplete}
                surveyScore={testResults.survey?.score}
                tapScore={testResults.taps?.score}
                onFinalResults={handleFinalResults}
              />
            )}
          </WizardContainer>
        );

      case "results":
        return (
          <FinalDashboard
            results={testResults}
            onRestart={handleRestart}
            onViewHistory={goToHistory}
          />
        );

      case "history":
        return <ResultsHistory />;

      default:
        return <LandingPage onStart={handleStartAssessment} />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      {showNavbar && (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={goHome}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  <span className="font-semibold">NeuroMotion</span>
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={goToHistory}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors font-medium"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>History & Analytics</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {renderStep()}
    </div>
  );
}

export default App;
