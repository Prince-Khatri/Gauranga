import React, { useState } from "react";
import axios from "axios";
import Button from "./ui/Button";
import { AlertCircle } from "lucide-react";

const SurveyStep = ({ onComplete }) => {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const questions = [
    {
      id: "tremor",
      question:
        "Do you experience trembling or shaking in your hands, arms, legs, jaw, or face when at rest?",
      description: "Resting tremor is a hallmark symptom",
    },
    {
      id: "rigidity",
      question: "Do you experience stiffness in your body, arms, or legs?",
      description: "Muscle rigidity and resistance to movement",
    },
    {
      id: "bradykinesia",
      question:
        "Have you noticed slowness in your movements or difficulty initiating movement?",
      description: "Bradykinesia affects daily activities",
    },
    {
      id: "balance",
      question:
        "Do you have trouble with balance or experience episodes of poor coordination?",
      description: "Postural instability and balance issues",
    },
    {
      id: "walking",
      question:
        "Have you noticed changes in your walking pattern, such as shuffling or reduced arm swing?",
      description: "Gait disturbances are common",
    },
  ];

  const options = [
    { value: 0, label: "Never", color: "green" },
    { value: 1, label: "Rarely", color: "lime" },
    { value: 2, label: "Sometimes", color: "yellow" },
    { value: 3, label: "Often", color: "orange" },
    { value: 4, label: "Always", color: "red" },
  ];

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validate all questions answered
    const allAnswered = questions.every((q) => answers[q.id] !== undefined);
    if (!allAnswered) {
      setError("Please answer all questions");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("/api/v1/analyze/survey", {
        answers: answers,
      });

      onComplete(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to submit survey. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isComplete = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Symptom Assessment
        </h2>
        <p className="text-gray-600">
          Please rate the frequency of the following symptoms over the past
          month.
        </p>
      </div>

      <div className="space-y-8">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="pb-8 border-b border-gray-100 last:border-0"
          >
            <div className="mb-4">
              <div className="flex items-start mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-700 rounded-full font-semibold text-sm mr-3 flex-shrink-0">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {question.question}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {question.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3 ml-11">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswerChange(question.id, option.value)}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200 text-center
                    ${
                      answers[question.id] === option.value
                        ? "border-primary-500 bg-primary-50 shadow-md scale-105"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }
                  `}
                >
                  <div
                    className={`
                    w-6 h-6 rounded-full mx-auto mb-2
                    ${
                      answers[question.id] === option.value
                        ? "bg-primary-500"
                        : "bg-gray-200"
                    }
                  `}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!isComplete}
          loading={loading}
        >
          Continue to Tap Test
        </Button>
      </div>
    </div>
  );
};

export default SurveyStep;
