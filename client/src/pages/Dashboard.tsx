import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Activity,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

interface AnalyticsData {
  summary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionPercentage: number;
  };
  byStatus: {
    todo: number;
    in_progress: number;
    done: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
}

const Dashboard: React.FC = () => {
  const { currentWorkspace } = useAuth();
  
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    setError(null);
    try {
      const api = (await import("../services/api")).default;
      const res = await api.get("/analytics", {
        params: { workspaceId: currentWorkspace._id }
      });
      setData(res.data.data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError("Failed to load analytics metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [currentWorkspace?._id]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="h-10 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-850 rounded-2xl animate-pulse" />
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-850 rounded-2xl animate-pulse" />
          <div className="h-80 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-850 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">Analytics unavailable</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-450 mt-1 mb-6">
          {error || "An unexpected error occurred loading your dashboard."}
        </p>
        <button
          onClick={fetchAnalytics}
          className="bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  const { summary, byStatus, byPriority } = data;

  // Chart data formatting
  const statusChartData = [
    { name: "To Do", value: byStatus.todo, color: "#9ca3af" },
    { name: "In Progress", value: byStatus.in_progress, color: "#3b82f6" },
    { name: "Completed", value: byStatus.done, color: "#0071e3" }
  ].filter((d) => d.value > 0);

  const priorityChartData = [
    { name: "Low", Tasks: byPriority.low, fill: "#a3a3a3" },
    { name: "Medium", Tasks: byPriority.medium, fill: "#f59e0b" },
    { name: "High", Tasks: byPriority.high, fill: "#ef4444" }
  ];

  const total = summary.totalTasks;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Productivity Dashboard
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Real-time analytics and task metrics for <strong>{currentWorkspace?.name}</strong>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tasks */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Total Tasks
            </span>
            <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 mt-1 block">
              {summary.totalTasks}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Completed Tasks */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Completed Tasks
            </span>
            <span className="text-2xl font-semibold text-brand mt-1 block">
              {summary.completedTasks}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-light dark:bg-brand-dark/20 text-brand flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Card 3: Completion Rate */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Completion Rate
            </span>
            <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 mt-1 block">
              {summary.completionPercentage}%
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Overdue Tasks */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Overdue Tasks
            </span>
            <span className={`text-2xl font-semibold mt-1 block ${summary.overdueTasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-50'}`}>
              {summary.overdueTasks}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${summary.overdueTasks > 0 ? 'bg-red-50 dark:bg-red-950/20 text-red-655 dark:text-red-400' : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-500'}`}>
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* No Tasks State */}
      {total === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-850 rounded-2xl p-16 text-center max-w-md mx-auto">
          <CheckSquare className="w-12 h-12 text-brand mx-auto mb-4 opacity-80" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">No tasks created yet</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 mb-6">
            Create some tasks in this workspace to see your analytics dashboard populate graphs.
          </p>
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1 bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <span>Go to Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        /* Charts Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Status Distribution */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs flex flex-col h-80">
            <h3 className="text-xs font-semibold text-neutral-450 uppercase tracking-wider mb-4">
              Status Distribution
            </h3>
            <div className="flex-1 min-h-0 relative">
              {statusChartData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-450">
                  No data to show
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderColor: "#e5e7eb",
                        borderRadius: "12px",
                        fontSize: "11px"
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Priority Breakdown */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs flex flex-col h-80">
            <h3 className="text-xs font-semibold text-neutral-450 uppercase tracking-wider mb-4">
              Tasks by Priority
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData}>
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderColor: "#e5e7eb",
                      borderRadius: "12px",
                      fontSize: "11px"
                    }}
                  />
                  <Bar dataKey="Tasks" radius={[8, 8, 0, 0]} maxBarSize={45}>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
