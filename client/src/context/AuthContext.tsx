import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api.js";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Workspace {
  _id: string;
  name: string;
  owner: string;
  members: { user: { _id: string; name: string; email: string }; role: "OWNER" | "MEMBER" }[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  selectWorkspace: (workspaceId: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

  const fetchProfileAndWorkspaces = async () => {
    try {
      // Get current user profile
      const userRes = await api.get("/auth/me");
      setUser(userRes.data.data.user);

      // Get user workspaces
      const wsRes = await api.get("/workspaces");
      const wsList = wsRes.data.data || [];
      setWorkspaces(wsList);

      if (wsList.length > 0) {
        // Restore last active workspace from localStorage or default to first
        const savedWsId = localStorage.getItem("lastWorkspaceId");
        const activeWs = wsList.find((w: Workspace) => w._id === savedWsId) || wsList[0];
        setCurrentWorkspace(activeWs);
        localStorage.setItem("lastWorkspaceId", activeWs._id);
      } else {
        setCurrentWorkspace(null);
      }
    } catch (err) {
      console.error("Failed to load user session:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfileAndWorkspaces();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token: userToken, user: userData } = res.data.data;
      localStorage.setItem("token", userToken);
      setToken(userToken);
      setUser(userData);
      // Wait for workspaces to load inside the useEffect or fetch here
      const wsRes = await api.get("/workspaces");
      const wsList = wsRes.data.data || [];
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        setCurrentWorkspace(wsList[0]);
        localStorage.setItem("lastWorkspaceId", wsList[0]._id);
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", { name, email, password });
      const { token: userToken, user: userData } = res.data.data;
      localStorage.setItem("token", userToken);
      setToken(userToken);
      setUser(userData);
      // Fresh users will have no workspaces initially, backend will handle auto-creating a personal workspace
      const wsRes = await api.get("/workspaces");
      const wsList = wsRes.data.data || [];
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        setCurrentWorkspace(wsList[0]);
        localStorage.setItem("lastWorkspaceId", wsList[0]._id);
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("lastWorkspaceId");
    localStorage.removeItem("demoMode");
    setToken(null);
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspace(null);
  };

  const selectWorkspace = (workspaceId: string) => {
    const activeWs = workspaces.find((w) => w._id === workspaceId) || null;
    setCurrentWorkspace(activeWs);
    if (activeWs) {
      localStorage.setItem("lastWorkspaceId", activeWs._id);
    } else {
      localStorage.removeItem("lastWorkspaceId");
    }
  };

  const refreshWorkspaces = async () => {
    try {
      const wsRes = await api.get("/workspaces");
      const wsList = wsRes.data.data || [];
      setWorkspaces(wsList);
      
      // Update current workspace if it still exists
      if (currentWorkspace) {
        const updated = wsList.find((w: Workspace) => w._id === currentWorkspace._id);
        if (updated) {
          setCurrentWorkspace(updated);
        } else if (wsList.length > 0) {
          setCurrentWorkspace(wsList[0]);
          localStorage.setItem("lastWorkspaceId", wsList[0]._id);
        } else {
          setCurrentWorkspace(null);
          localStorage.removeItem("lastWorkspaceId");
        }
      } else if (wsList.length > 0) {
        setCurrentWorkspace(wsList[0]);
        localStorage.setItem("lastWorkspaceId", wsList[0]._id);
      }
    } catch (err) {
      console.error("Error refreshing workspaces:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        workspaces,
        currentWorkspace,
        login,
        register,
        logout,
        selectWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
