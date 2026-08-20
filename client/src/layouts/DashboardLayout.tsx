import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  Plus,
  Briefcase
} from "lucide-react";

const DashboardLayout: React.FC = () => {
  const { user, workspaces, currentWorkspace, selectWorkspace, logout, refreshWorkspaces, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [newWsModalOpen, setNewWsModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [creatingWs, setCreatingWs] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Tasks", path: "/tasks", icon: CheckSquare },
    { name: "Settings", path: "/workspaces", icon: Settings },
  ];

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setCreatingWs(true);
    try {
      const api = (await import("../services/api")).default;
      const res = await api.post("/workspaces", { name: newWsName });
      await refreshWorkspaces();
      selectWorkspace(res.data.data._id);
      setNewWsName("");
      setNewWsModalOpen(false);
    } catch (err) {
      console.error("Failed to create workspace:", err);
      alert("Error creating workspace. Please try again.");
    } finally {
      setCreatingWs(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      {/* Apple-Inspired Horizontal Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-100 dark:border-neutral-900 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Logo & Workspace Switcher */}
          <div className="flex items-center gap-6">
            {/* Logo Text only */}
            <div className="flex items-center">
              <span className="font-serif italic text-base tracking-wide text-neutral-900 dark:text-neutral-50">TaskFlow</span>
            </div>

            {/* Divider */}
            <span className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />

            {/* Workspace Switcher */}
            <div className="relative">
              <button
                onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left cursor-pointer group"
              >
                <div className="w-5.5 h-5.5 rounded-md bg-brand text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                  {currentWorkspace?.name ? currentWorkspace.name.substring(0, 2).toUpperCase() : "TM"}
                </div>
                <span className="text-xs font-medium text-neutral-850 dark:text-neutral-250 truncate max-w-[120px]">
                  {currentWorkspace?.name || "Select Workspace"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-350 transition-colors" />
              </button>

              {/* Workspace Dropdown Panel */}
              {workspaceDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-850 rounded-xl shadow-lg p-1.5 z-50 animate-scale-up">
                  <p className="text-[9px] font-semibold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider px-2 py-1">
                    Workspaces
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-0.5 mt-1">
                    {workspaces.map((ws) => (
                      <button
                        key={ws._id}
                        onClick={() => {
                          selectWorkspace(ws._id);
                          setWorkspaceDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          currentWorkspace?._id === ws._id
                            ? "bg-brand-light dark:bg-brand-dark/20 text-brand font-medium"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-350"
                        }`}
                      >
                        <span className="truncate">{ws.name}</span>
                        {ws.owner === user?.id && (
                          <span className="text-[8px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded px-1 flex-shrink-0">
                            Owner
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-neutral-100 dark:border-neutral-900 mt-1.5 pt-1.5">
                    <button
                      onClick={() => {
                        setNewWsModalOpen(true);
                        setWorkspaceDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-450 font-medium text-left cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Workspace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Desktop Menu Links */}
          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "text-neutral-950 dark:text-neutral-50 bg-neutral-50 dark:bg-neutral-900 font-semibold"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right: Theme, Logout & Avatar */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
              title={theme === "light" ? "Switch to Dark" : "Switch to Light"}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Profile Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer text-left focus:outline-none"
              >
                <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-350 flex items-center justify-center text-xs font-semibold border border-neutral-200/50 dark:border-neutral-800">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 hidden lg:block">
                  {user?.name.split(" ")[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-850 rounded-xl shadow-lg p-1.5 z-50 animate-scale-up">
                  <div className="px-2.5 py-1.5 border-b border-neutral-100 dark:border-neutral-900 mb-1">
                    <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-semibold truncate leading-none">
                      Signed in as
                    </p>
                    <p className="text-[10px] text-neutral-850 dark:text-neutral-250 truncate mt-1 font-medium">
                      {user?.email}
                    </p>
                  </div>
                  
                  <Link
                    to="/workspaces"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-350 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Workspace Settings</span>
                  </Link>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-red-50 dark:hover:bg-red-950/20 text-red-655 dark:text-red-400 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Hamburger Button (Mobile Only) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#0a0a0a] border-t border-neutral-100 dark:border-neutral-900 px-4 py-4 space-y-3 animate-fade-in">
            <nav className="flex flex-col gap-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-brand/10 text-brand font-semibold"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
            {/* Mobile Footer Area */}
            <div className="border-t border-neutral-100 dark:border-neutral-900 pt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-neutral-150 text-neutral-600 flex items-center justify-center text-xs font-medium">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="text-xs text-neutral-600 dark:text-neutral-450">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-655 text-xs font-medium cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {workspaces.length === 0 && !loading && (
          <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-850 rounded-2xl text-center shadow-xs">
            <Briefcase className="w-12 h-12 text-brand mx-auto mb-4" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
              Create a Workspace
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 mb-6">
              You are not part of any workspaces yet. Create your first workspace to start collaborating on tasks.
            </p>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <input
                type="text"
                placeholder="e.g. Acme Corporation"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                className="block w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs"
                required
              />
              <button
                type="submit"
                disabled={creatingWs}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Create and Get Started
              </button>
            </form>
          </div>
        )}

        {/* Render standard routes if workspaces exist */}
        {workspaces.length > 0 && <Outlet />}
      </main>

      {/* New Workspace Dialog */}
      {newWsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl max-w-sm w-full p-6 shadow-xl animate-scale-up">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
              Create New Workspace
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-450 mb-4">
              Organize different projects or teams under dedicated workspaces.
            </p>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Design Team, Personal"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="block w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setNewWsModalOpen(false)}
                  className="px-3.5 py-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingWs}
                  className="px-3.5 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-medium cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
