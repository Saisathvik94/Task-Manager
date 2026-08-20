import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Plus, Trash2, Shield, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const WorkspaceSettings: React.FC = () => {
  const { user, currentWorkspace, refreshWorkspaces } = useAuth();
  
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"OWNER" | "MEMBER">("MEMBER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // If no workspace selected
  if (!currentWorkspace) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-neutral-500">No workspace selected. Please create or select a workspace.</p>
      </div>
    );
  }

  // Find current user's role
  const currentUserRole = currentWorkspace.members.find((m) => m.user?._id === user?.id)?.role || "MEMBER";
  const isOwner = currentUserRole === "OWNER";

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const api = (await import("../services/api")).default;
      await api.post(`/workspaces/${currentWorkspace._id}/members`, {
        email: email.trim(),
        role
      });
      
      await refreshWorkspaces();
      setSuccess("Member successfully added to workspace!");
      setEmail("");
    } catch (err: any) {
      console.error("Failed to add member:", err);
      const errMsg = err.response?.data?.error?.message || "Failed to invite member. Please check email address.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string, targetName: string) => {
    if (!confirm(`Are you sure you want to remove ${targetName} from the workspace?`)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const api = (await import("../services/api")).default;
      await api.delete(`/workspaces/${currentWorkspace._id}/members/${targetUserId}`);
      
      await refreshWorkspaces();
      setSuccess("Member successfully removed.");
    } catch (err: any) {
      console.error("Failed to remove member:", err);
      const errMsg = err.response?.data?.error?.message || "Failed to remove member.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Workspace Settings
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Manage workspace members, collaborate on projects, and assign roles
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-brand-light dark:bg-brand-dark/20 text-brand rounded-xl text-xs border border-brand/20">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs border border-red-105">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Side: Workspace info and Member addition */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-semibold text-neutral-450 uppercase tracking-wider mb-4">
              Workspace Profile
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block">Workspace Name</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{currentWorkspace.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block">Your Role</span>
                <span className="text-xs font-medium inline-flex items-center gap-1 mt-1 text-brand bg-brand-light dark:bg-brand-dark/30 px-2 py-0.5 rounded-lg border border-brand/20">
                  <Shield className="w-3 h-3" />
                  {currentUserRole}
                </span>
              </div>
            </div>
          </div>

          {/* Add member box - OWNER only */}
          {isOwner && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-neutral-450 uppercase tracking-wider mb-4">
                Add Workspace Member
              </h3>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-neutral-500 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="block w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-500 uppercase tracking-wider mb-2">
                    Access Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    disabled={loading}
                    className="block w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs cursor-pointer"
                  >
                    <option value="MEMBER">Member (Read/Write Tasks)</option>
                    <option value="OWNER">Owner (Full Admin Access)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-neutral-950 dark:bg-brand hover:bg-neutral-850 dark:hover:bg-brand-hover text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Add Member</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Side: Members List */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-850">
              <h3 className="text-xs font-semibold text-neutral-450 uppercase tracking-wider">
                Workspace Members ({currentWorkspace.members.length})
              </h3>
            </div>
            
            <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
              {currentWorkspace.members.map((member) => {
                if (!member.user) return null;
                const isSelf = member.user._id === user?.id;
                return (
                  <div key={member.user._id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-350 flex items-center justify-center font-medium border border-neutral-200/30 dark:border-neutral-700/50 flex-shrink-0">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                            {member.user.name}
                          </p>
                          {isSelf && (
                            <span className="text-[9px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded px-1 flex-shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-450 dark:text-neutral-500 truncate mt-0.5">
                          {member.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                        member.role === "OWNER"
                          ? "bg-brand-light dark:bg-brand-dark/20 text-brand border-brand/20"
                          : "bg-neutral-50 dark:bg-neutral-900 text-neutral-500 border-neutral-200/60 dark:border-neutral-800/80"
                      }`}>
                        <Shield className="w-2.5 h-2.5" />
                        {member.role}
                      </span>

                      {/* Remove member button - visible to Owner, cannot remove self */}
                      {isOwner && !isSelf && (
                        <button
                          onClick={() => handleRemoveMember(member.user._id, member.user.name)}
                          disabled={loading}
                          className="p-1.5 text-neutral-400 hover:text-red-655 dark:hover:text-red-400 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors cursor-pointer"
                          title="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;
