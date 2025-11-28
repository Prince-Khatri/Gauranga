import React from "react";
import {
  AlertCircle,
  Activity,
  Hand,
  Pencil,
  RefreshCw,
  Download,
  BarChart3,
} from "lucide-react";
import Button from "./ui/Button";

const FinalDashboard = ({ results, onRestart, onViewHistory }) => {
  const { final } = results;

  if (!final) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">No results available</p>
        </div>
      </div>
    );
  }

  const getRiskColor = (level) => {
    const colors = {
      Low: "green",
      "Low-Moderate": "lime",
      Moderate: "yellow",
      "Moderate-High": "orange",
      High: "red",
    };
    return colors[level] || "gray";
  };

  const getRiskGradient = (level) => {
    const gradients = {
      Low: "from-green-500 to-green-600",
      "Low-Moderate": "from-lime-500 to-green-600",
      Moderate: "from-yellow-500 to-orange-500",
      "Moderate-High": "from-orange-500 to-red-500",
      High: "from-red-500 to-red-600",
    };
    return gradients[level] || "from-gray-500 to-gray-600";
  };

  const testDetails = [
    {
      name: "Symptom Survey",
      score: final.survey_score,
      icon: Activity,
      description: "Self-reported symptoms",
    },
    {
      name: "Tap Test",
      score: final.tap_score,
      icon: Hand,
      description: "Motor speed & rhythm",
    },
    {
      name: "Spiral Drawing",
      score: final.spiral_score,
      icon: Pencil,
      description: "Fine motor control",
    },
  ];

  const getScoreColor = (score) => {
    if (score < 30) return "text-green-600";
    if (score < 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Assessment Results
          </h1>
          <p className="text-gray-600">
            Session ID: {final.session_id} •{" "}
            {new Date(final.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Overall Risk Card */}
        <div className="card mb-8 text-center overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 to-primary-600"></div>

          <div className="py-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">
              Overall Risk Assessment
            </h2>

            {/* Risk Gauge */}
            <div className="relative w-64 h-64 mx-auto mb-6">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 200 200"
              >
                {/* Background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  stroke="#e5e7eb"
                  strokeWidth="20"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  stroke="url(#gradient)"
                  strokeWidth="20"
                  fill="none"
                  strokeDasharray={`${(final.overall_risk / 100) * 502} 502`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop
                      offset="0%"
                      className="text-primary-500"
                      stopColor="currentColor"
                    />
                    <stop
                      offset="100%"
                      className="text-primary-600"
                      stopColor="currentColor"
                    />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold text-gray-900">
                  {Math.round(final.overall_risk)}%
                </div>
                <div className="text-sm text-gray-500 mt-1">Risk Score</div>
              </div>
            </div>

            {/* Risk Level Badge */}
            <div
              className={`inline-flex items-center px-6 py-3 rounded-full shadow-lg mb-4 bg-gradient-to-r ${getRiskGradient(
                final.risk_level
              )} text-white`}
            >
              <span className="text-lg font-semibold">
                Risk Level: {final.risk_level}
              </span>
            </div>

            {/* Recommendation */}
            <div className="max-w-2xl mx-auto mt-6 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-xl text-left">
              <p className="text-blue-900 leading-relaxed">
                <strong>Recommendation:</strong> {final.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Test Breakdown */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {testDetails.map((test, index) => {
            const Icon = test.icon;
            return (
              <div key={index} className="card card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mr-3">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {test.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {test.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-sm text-gray-600">Score</span>
                    <span
                      className={`text-3xl font-bold ${getScoreColor(
                        test.score
                      )}`}
                    >
                      {Math.round(test.score)}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-1000"
                      style={{ width: `${test.score}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Important Disclaimer */}
        <div className="card border-2 border-amber-200 bg-amber-50 mb-8">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">
                Important Medical Disclaimer
              </h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                This assessment is a screening tool only and does not constitute
                a medical diagnosis. Parkinson's Disease can only be diagnosed
                by a qualified healthcare professional through comprehensive
                clinical evaluation. These results should be discussed with your
                doctor, especially if you have concerns about your symptoms.
                Early consultation with a neurologist or movement disorder
                specialist is recommended for anyone showing potential
                indicators.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={onRestart}
            icon={RefreshCw}
          >
            Take New Assessment
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => window.print()}
            icon={Download}
          >
            Print Results
          </Button>

          {onViewHistory && (
            <Button
              variant="outline"
              size="lg"
              onClick={onViewHistory}
              icon={BarChart3}
            >
              View History & Analytics
            </Button>
          )}
        </div>

        {/* Additional Resources */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p className="mb-2">
            For more information about Parkinson's Disease:
          </p>
          <div className="space-x-4">
            <a
              href="https://www.parkinson.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Parkinson's Foundation
            </a>
            <span>•</span>
            <a
              href="https://www.michaeljfox.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Michael J. Fox Foundation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalDashboard;
