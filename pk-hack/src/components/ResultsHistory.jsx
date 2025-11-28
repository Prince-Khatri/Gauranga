import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  AlertCircle,
  Download,
  Filter,
  ChevronDown,
} from "lucide-react";
import Button from "./ui/Button";

const ResultsHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [sortOrder, setSortOrder] = useState("desc");

  const RISK_COLORS = {
    Low: "#10b981",
    "Low-Moderate": "#84cc16",
    Moderate: "#f59e0b",
    "Moderate-High": "#f97316",
    High: "#ef4444",
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, statsRes] = await Promise.all([
        axios.get("/api/v1/sessions?limit=100"),
        axios.get("/api/v1/statistics"),
      ]);

      setSessions(sessionsRes.data.sessions);
      setStatistics(statsRes.data);
      setError(null);
    } catch (err) {
      setError("Failed to load results history");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRiskBadgeColor = (riskLevel) => {
    return RISK_COLORS[riskLevel] || "#6b7280";
  };

  // Prepare chart data
  const trendData = sessions
    .slice()
    .reverse()
    .map((session) => ({
      date: new Date(session.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      risk: Math.round(session.overall_risk),
      survey: Math.round(session.survey_score),
      tap: Math.round(session.tap_score),
      spiral: Math.round(session.spiral_score),
      timestamp: session.timestamp,
    }))
    .slice(-30); // Last 30 sessions

  const latestSession = sessions[0];
  const latestScores = latestSession
    ? [
        {
          component: "Survey",
          value: Math.round(latestSession.survey_score),
          fullMark: 100,
        },
        {
          component: "Tap Test",
          value: Math.round(latestSession.tap_score),
          fullMark: 100,
        },
        {
          component: "Spiral",
          value: Math.round(latestSession.spiral_score),
          fullMark: 100,
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Assessment History & Analytics
          </h1>
          <p className="text-gray-600">
            Track your progress and view detailed analytics from all assessments
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {["overview", "trends", "comparison", "details"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium transition-all capitalize ${
                activeTab === tab
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Summary Cards */}
            {statistics && (
              <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl shadow-soft p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm font-medium">
                      Total Assessments
                    </span>
                    <Calendar className="w-5 h-5 text-primary-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics.statistics.total_sessions || 0}
                  </p>
                </div>

                <div className="bg-white rounded-2xl shadow-soft p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm font-medium">
                      Average Risk
                    </span>
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics.statistics.avg_risk
                      ? Math.round(statistics.statistics.avg_risk)
                      : 0}
                    %
                  </p>
                </div>

                <div className="bg-white rounded-2xl shadow-soft p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm font-medium">
                      Lowest Risk
                    </span>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics.statistics.min_risk
                      ? Math.round(statistics.statistics.min_risk)
                      : 0}
                    %
                  </p>
                </div>

                <div className="bg-white rounded-2xl shadow-soft p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm font-medium">
                      Highest Risk
                    </span>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics.statistics.max_risk
                      ? Math.round(statistics.statistics.max_risk)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            )}

            {/* Risk Distribution */}
            {statistics && statistics.risk_distribution.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-soft p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Risk Level Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statistics.risk_distribution}
                        dataKey="count"
                        nameKey="risk_level"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ risk_level, count }) =>
                          `${risk_level}: ${count}`
                        }
                      >
                        {statistics.risk_distribution.map((entry) => (
                          <Cell
                            key={`cell-${entry.risk_level}`}
                            fill={getRiskBadgeColor(entry.risk_level)}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {latestSession && (
                  <div className="bg-white rounded-2xl shadow-soft p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Latest Assessment Components
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={latestScores}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="component" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar
                          name="Score"
                          dataKey="value"
                          stroke="#0284c7"
                          fill="#0284c7"
                          fillOpacity={0.6}
                        />
                        <Tooltip />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === "trends" && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Risk Score Trend (Last 30 Sessions)
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#6b7280" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="risk"
                    stroke="#ef4444"
                    name="Overall Risk"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Component Scores Over Time
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#6b7280" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="survey"
                    stroke="#0284c7"
                    name="Survey Score"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="tap"
                    stroke="#10b981"
                    name="Tap Test Score"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="spiral"
                    stroke="#f59e0b"
                    name="Spiral Score"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === "comparison" && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Score Comparison (Last 10 Sessions)
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={trendData.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#6b7280" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="survey" fill="#0284c7" name="Survey" radius={8} />
                <Bar dataKey="tap" fill="#10b981" name="Tap Test" radius={8} />
                <Bar dataKey="spiral" fill="#f59e0b" name="Spiral" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === "details" && (
          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Overall Risk
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Survey
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tap Test
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Spiral
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr
                      key={session.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(session.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="px-3 py-1 text-xs font-semibold text-white rounded-full"
                          style={{
                            backgroundColor: getRiskBadgeColor(
                              session.risk_level
                            ),
                          }}
                        >
                          {session.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                        {Math.round(session.overall_risk)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                        {Math.round(session.survey_score)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                        {Math.round(session.tap_score)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                        {Math.round(session.spiral_score)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsHistory;
