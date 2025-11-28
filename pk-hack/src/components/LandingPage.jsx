import React from "react";
import { Activity, Brain, Clock, Target, BarChart3 } from "lucide-react";
import Button from "./ui/Button";

const LandingPage = ({ onStart, onViewHistory }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-6 shadow-medical">
            <Brain className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            NeuroMotion
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Advanced Parkinson's Disease Risk Assessment Tool
          </p>

          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            A comprehensive screening tool that evaluates motor function through
            three evidence-based assessments. This is not a diagnostic
            tool—please consult a healthcare professional for medical advice.
          </p>

          <Button
            size="lg"
            onClick={onStart}
            icon={Target}
            className="shadow-xl mr-4"
          >
            Start Assessment
          </Button>

          {onViewHistory && (
            <Button
              size="lg"
              variant="outline"
              onClick={onViewHistory}
              icon={BarChart3}
            >
              View History & Analytics
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="card card-hover text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-xl mb-4">
              <Activity className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Symptom Survey
            </h3>
            <p className="text-gray-600">
              Evidence-based questionnaire assessing key Parkinsonian symptoms
              based on UPDRS criteria.
            </p>
          </div>

          <div className="card card-hover text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-xl mb-4">
              <Clock className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Finger Tapping Test
            </h3>
            <p className="text-gray-600">
              Measures motor speed and rhythm consistency through rapid
              alternating movements.
            </p>
          </div>

          <div className="card card-hover text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-xl mb-4">
              <Brain className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Spiral Drawing
            </h3>
            <p className="text-gray-600">
              Analyzes fine motor control and tremor patterns through guided
              drawing assessment.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-xl">
          <p className="text-sm text-amber-900">
            <strong>Important Medical Disclaimer:</strong> This tool is for
            screening purposes only and does not provide medical diagnosis.
            Results should be discussed with a qualified healthcare
            professional. Early detection and professional evaluation are
            crucial for effective management.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
