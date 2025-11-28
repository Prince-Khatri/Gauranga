import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import Button from "./ui/Button";
import { Pencil, RotateCcw, AlertCircle } from "lucide-react";

const SpiralCanvasStep = ({
  onComplete,
  surveyScore,
  tapScore,
  onFinalResults,
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Set canvas size
    canvas.width = 600;
    canvas.height = 600;

    // Draw guide spiral
    drawGuideSpiral(ctx);
  }, []);

  const drawGuideSpiral = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw light gray guide spiral
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();

    const centerX = 300;
    const centerY = 300;
    const turns = 3;
    const maxRadius = 150;

    for (let angle = 0; angle < turns * 2 * Math.PI; angle += 0.1) {
      const radius = (angle / (turns * 2 * Math.PI)) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      if (angle === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.setLineDash([]);

    // Add center dot
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Add instruction text
    ctx.fillStyle = "#6b7280";
    ctx.font = "14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Start from the center and draw outward",
      centerX,
      centerY - 180
    );
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#1e40af";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(x, y);

    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    drawGuideSpiral(ctx);
    setHasDrawn(false);
  };

  const handleSubmit = async () => {
    if (!hasDrawn) {
      setError("Please draw a spiral before submitting");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert canvas to blob
      const canvas = canvasRef.current;
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      // Upload spiral image
      const formData = new FormData();
      formData.append("file", blob, "spiral.png");

      const spiralResponse = await axios.post(
        "/api/v1/analyze/spiral",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Call onComplete to pass spiral results to parent
      onComplete(spiralResponse.data);

      // Aggregate all results
      const aggregateResponse = await axios.post("/api/v1/aggregate", {
        survey_score: surveyScore,
        tap_score: tapScore,
        spiral_score: spiralResponse.data.score,
      });

      // Pass final results to parent
      onFinalResults(aggregateResponse.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to analyze spiral. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
          <Pencil className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Spiral Drawing Test
        </h2>
        <p className="text-gray-600">
          This test analyzes fine motor control and tremor patterns
        </p>
      </div>

      <div className="mb-6 p-6 bg-blue-50 rounded-xl">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Instructions:
        </h3>
        <ul className="space-y-2 text-blue-800 text-left">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">1.</span>
            Starting from the center dot, draw a spiral following the guide
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">2.</span>
            Try to maintain smooth, steady lines
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">3.</span>
            Take your time and draw naturally
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">4.</span>
            Click "Clear" if you want to start over
          </li>
        </ul>
      </div>

      <div className="mb-6 flex justify-center">
        <div className="bg-white border-4 border-gray-200 rounded-2xl shadow-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="cursor-crosshair"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleClear}
          icon={RotateCcw}
          disabled={loading}
        >
          Clear Canvas
        </Button>

        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!hasDrawn}
          loading={loading}
        >
          {loading ? "Analyzing Results..." : "Complete Assessment"}
        </Button>
      </div>
    </div>
  );
};

export default SpiralCanvasStep;
