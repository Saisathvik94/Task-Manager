import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  Sun,
  Moon,
  ArrowRight,
  Kanban,
  LayoutDashboard,
  Users,
  ChevronRight
} from "lucide-react";

const Landing: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 transition-colors duration-200 selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-950 dark:selection:text-blue-200 font-sans">
      {/* Notion-style minimal header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-100 dark:border-neutral-900 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <span className="font-serif italic text-base tracking-wide text-neutral-900 dark:text-neutral-50">TaskFlow</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              {theme === "light" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
            </button>

            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-1 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-black font-semibold text-xs px-3.5 py-2 rounded-lg transition-all"
              >
                <span>Go to Console</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-3.5">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-brand hover:bg-brand-hover text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-sm"
                >
                  Get TaskFlow free
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notion-style Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 text-center space-y-6">
        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.08]">
          Your tasks, projects, <br />
          & collaborators. <span className="underline decoration-brand/60 decoration-4 underline-offset-4">Together.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-450 max-w-xl mx-auto font-normal leading-relaxed">
          TaskFlow is the clean, collaborative workspace where teams align, execute tasks, and inspect productivity analytics.
        </p>

        {/* Notion-style CTA Button */}
        <div className="pt-4 space-y-2">
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-semibold text-sm sm:text-base px-6 py-3 rounded-lg transition-all shadow-md group"
            >
              <span>Go to your workspace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-semibold text-sm sm:text-base px-6 py-3 rounded-lg transition-all shadow-md group"
            >
              <span>Get TaskFlow free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
          <span className="block text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
            Free for individuals. No credit card required.
          </span>
        </div>

        {/* Minimal Illustration Mockup */}
        <div className="pt-16 max-w-5xl mx-auto animate-slide-up">
          <div className="bg-white dark:bg-[#0c0c0c] border border-neutral-200/80 dark:border-neutral-850 rounded-xl p-3 shadow-lg relative overflow-hidden">
            {/* Header controls */}
            <div className="flex items-center justify-between mb-3 px-2 text-[10px] text-neutral-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
              </div>
              <span className="font-mono bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 px-3 py-0.5 rounded text-[9px]">
                taskflow.so/my-workspace
              </span>
              <div className="w-10" />
            </div>

            {/* Simulated UI layout */}
            <div className="border border-neutral-150 dark:border-neutral-900 rounded-lg overflow-hidden bg-[#fbfbfb] dark:bg-[#050505] p-5 grid grid-cols-4 gap-5 text-left min-h-[300px]">
              {/* Left Column: Sidebar Mock */}
              <div className="border-r border-neutral-150 dark:border-neutral-900 pr-4 space-y-4 hidden sm:block">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-brand text-white flex items-center justify-center font-bold text-[8px]">T</div>
                  <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-2 w-full bg-brand/10 dark:bg-brand/20 rounded" />
                  <div className="h-2 w-4/5 bg-neutral-100 dark:bg-neutral-850 rounded" />
                  <div className="h-2 w-3/4 bg-neutral-100 dark:bg-neutral-850 rounded" />
                </div>
              </div>

              {/* Right columns: Kanban simulation */}
              <div className="col-span-4 sm:col-span-3 grid grid-cols-3 gap-3">
                {/* To Do */}
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">To Do</span>
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-850 p-3 rounded-lg shadow-xs space-y-2">
                    <div className="h-3 w-4/5 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[8px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded px-1 font-medium">Low</span>
                      <span className="w-4 h-4 rounded-full bg-blue-500" />
                    </div>
                  </div>
                </div>

                {/* In Progress */}
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider text-brand">In Progress</span>
                  <div className="bg-white dark:bg-neutral-900 border border-brand/20 dark:border-brand-dark/30 p-3 rounded-lg shadow-xs space-y-2">
                    <div className="h-3 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[8px] bg-brand-light text-brand rounded px-1 font-medium">High</span>
                      <span className="w-4 h-4 rounded-full bg-brand" />
                    </div>
                  </div>
                </div>

                {/* Done */}
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Done</span>
                  <div className="bg-white/60 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-900 p-3 rounded-lg space-y-2 opacity-50">
                    <div className="h-3 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded line-through" />
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[8px] bg-neutral-100 dark:bg-neutral-800 text-neutral-400 rounded px-1 font-medium">Medium</span>
                      <span className="w-4 h-4 rounded-full bg-neutral-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notion-style Grid Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-neutral-100 dark:border-neutral-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Feature 1 */}
          <div className="space-y-3.5 p-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-brand flex items-center justify-center border border-blue-100/50 dark:border-blue-900/20">
              <Kanban className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Visual Kanban Boards</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Track project statuses with a minimal drag-and-drop board. Drag cards to update statuses and assignees instantly.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="space-y-3.5 p-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-brand flex items-center justify-center border border-blue-100/50 dark:border-blue-900/20">
              <LayoutDashboard className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Productivity Dashboard</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Inspect workflow health through charts plotting status distributions, priorities, and task timelines automatically.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="space-y-3.5 p-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-brand flex items-center justify-center border border-blue-100/50 dark:border-blue-900/20">
              <Users className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Collaborative Spaces</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Invite collaborators, establish roles (Owner vs Member), and isolate tasks securely under workspaces.
            </p>
          </div>
        </div>
      </section>

      {/* Notion-style bottom banner */}
      <section className="bg-neutral-50 dark:bg-[#0c0c0c] border-t border-b border-neutral-100 dark:border-neutral-900 py-16 text-center">
        <div className="max-w-2xl mx-auto px-4 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Get started with TaskFlow today
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Create your account and structure your personal collaborative workspace in seconds.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4.5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              Get TaskFlow free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-[10px] text-neutral-400 dark:text-neutral-500">
        <p>© 2026 TaskFlow Inc. Crafted with absolute simplicity and pixel-precision.</p>
      </footer>
    </div>
  );
};

export default Landing;
