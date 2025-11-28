import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Button from "./ui/Button";
import { Hand, Timer, AlertCircle } from "lucide-react";

const TapTestStep = ({ onComplete }) => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimestamps, setTapTimestamps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const startTimeRef = useRef(null);
  const lastTapRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTestComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleStart = () => {
    setShowInstructions(false);
    setIsActive(true);
    setTapCount(0);
    setTapTimestamps([]);
    setTimeLeft(10);
    startTimeRef.current = Date.now();
    lastTapRef.current = Date.now();
  };

  const handleTap = () => {
    if (!isActive || timeLeft === 0) return;

    const now = Date.now();
    const interval = now - lastTapRef.current;

    setTapCount((prev) => prev + 1);
    setTapTimestamps((prev) => [...prev, interval]);
    lastTapRef.current = now;
  };

  const handleTestComplete = async () => {
    setIsActive(false);

    if (tapTimestamps.length < 3) {
      setError(
        "Not enough taps recorded. Please try again with at least 3 taps."
      );
      setTimeout(() => {
        setShowInstructions(true);
        setError(null);
      }, 3000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Remove the first tap (usually an outlier as user is adjusting)
      const intervals = tapTimestamps.slice(1);

      const response = await axios.post("/api/v1/analyze/taps", {
        intervals: intervals,
      });

      onComplete(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to analyze taps. Please try again."
      );
      setTimeout(() => {
        setShowInstructions(true);
        setError(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = ((10 - timeLeft) / 10) * 100;

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
          <Hand className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Finger Tapping Test
        </h2>
        <p className="text-gray-600">
          This test measures motor speed and rhythm consistency
        </p>
      </div>

      {showInstructions && !isActive && (
        <div className="mb-8 p-6 bg-blue-50 rounded-xl text-left">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Instructions:
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">1.</span>
              Click "Start Test" to begin the 10-second timer
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">2.</span>
              Tap the button below as quickly and consistently as possible
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">3.</span>
              Try to maintain a steady rhythm throughout
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">4.</span>
              The test will automatically end after 10 seconds
            </li>
          </ul>
        </div>
      )}

      {!isActive && !loading && !error && (
        <Button size="lg" onClick={handleStart} icon={Timer} className="mb-6">
          Start Test
        </Button>
      )}

      {isActive && (
        <div className="space-y-6">
          {/* Timer Display */}
          <div className="relative">
            <div className="text-6xl font-bold text-primary-600 mb-2">
              {timeLeft}
            </div>
            <div className="text-sm text-gray-500 mb-4">seconds remaining</div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Tap Button */}
          <button
            onClick={handleTap}
            className="w-64 h-64 mx-auto bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full shadow-2xl transition-all duration-150 active:scale-95 flex flex-col items-center justify-center"
          >
            <Hand className="w-16 h-16 mb-4" />
            <span className="text-2xl font-bold">TAP HERE</span>
          </button>

          {/* Tap Counter */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">{tapCount}</div>
            <div className="text-sm text-gray-500">taps recorded</div>
          </div>
        </div>
      )}

      {loading && (
        <div className="py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Analyzing your tapping pattern...</p>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default TapTestStep;
