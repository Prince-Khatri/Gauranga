import React from "react";
import { CheckCircle2, Circle } from "lucide-react";

const WizardContainer = ({ children, currentStep, totalSteps }) => {
  const steps = [
    { id: "survey", name: "Symptom Survey" },
    { id: "taps", name: "Tap Test" },
    { id: "spiral", name: "Spiral Drawing" },
  ];

  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`
                      flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300
                      ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isCurrent
                          ? "bg-primary-600 text-white shadow-medical"
                          : "bg-gray-200 text-gray-400"
                      }
                    `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <span className="font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`
                      mt-2 text-sm font-medium text-center
                      ${isCurrent ? "text-primary-600" : "text-gray-500"}
                    `}
                    >
                      {step.name}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={`
                      flex-1 h-1 mx-4 rounded-full transition-all duration-300
                      ${index < currentIndex ? "bg-green-500" : "bg-gray-200"}
                    `}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="card">{children}</div>
      </div>
    </div>
  );
};

export default WizardContainer;
