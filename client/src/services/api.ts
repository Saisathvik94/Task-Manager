import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Safe Request Body Parser
const getRequestBody = (config: any) => {
  if (!config.data) return {};
  if (typeof config.data === "string") {
    try {
      return JSON.parse(config.data);
    } catch (e) {
      return {};
    }
  }
  return config.data;
};

// Mock Database Initializer for Demo Mode
const initDemoDb = () => {
  const currentDbVersion = "2";
  if (localStorage.getItem("demo_db_version") !== currentDbVersion) {
    localStorage.removeItem("demo_workspaces");
    localStorage.removeItem("demo_tasks");
    localStorage.setItem("demo_db_version", currentDbVersion);
  }

  if (!localStorage.getItem("demo_workspaces")) {
    localStorage.setItem(
      "demo_workspaces",
      JSON.stringify([
        {
          _id: "demo-workspace-1",
          name: "Acme Design Project",
          owner: "demo-user-id",
          members: [
            { user: { _id: "demo-user-id", name: "Demo User", email: "demo@taskflow.so" }, role: "OWNER" },
            { user: { _id: "user-2", name: "Sarah Connor", email: "sarah@company.com" }, role: "MEMBER" },
            { user: { _id: "user-3", name: "Miles Dyson", email: "miles@cyberdyne.com" }, role: "MEMBER" }
          ]
        }
      ])
    );
  }

  if (!localStorage.getItem("demo_tasks")) {
    localStorage.setItem(
      "demo_tasks",
      JSON.stringify([
        {
          _id: "task-1",
          title: "Build responsive React UI components",
          description: "Develop the dashboard, Kanban board layout, task list views, and settings page components using Tailwind CSS.",
          status: "done",
          priority: "high",
          dueDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
          workspace: "demo-workspace-1",
          owner: { _id: "demo-user-id", name: "Demo User", email: "demo@taskflow.so" },
          assignee: { _id: "demo-user-id", name: "Demo User", email: "demo@taskflow.so" },
          createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString()
        },
        {
          _id: "task-2",
          title: "Connect application to MongoDB database",
          description: "Configure Mongoose schemas, establish local connection pools, and secure model integrity parameters.",
          status: "done",
          priority: "high",
          dueDate: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split("T")[0],
          workspace: "demo-workspace-1",
          owner: { _id: "demo-user-id", name: "Demo User", email: "demo@taskflow.so" },
          assignee: { _id: "user-3", name: "Miles Dyson", email: "miles@cyberdyne.com" },
          createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
        },
        {
          _id: "task-3",
          title: "Fix workspace task deletion crashing issue",
          description: "Resolve the backend crash caused by reading the workspace property of undefined request payloads.",
          status: "in_progress",
          priority: "high",
          dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split("T")[0],
          workspace: "demo-workspace-1",
          owner: { _id: "demo-user-id", name: "Demo User", email: "demo@taskflow.so" },
          assignee: { _id: "user-2", name: "Sarah Connor", email: "sarah@company.com" },
          createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
        },
        {
          _id: "task-4",
          title: "Fix dark mode class toggling issue",
          description: "Declare custom variant dark CSS rules to natively toggle dark classes on HTML root elements in Tailwind v4.",
          status: "todo",
          priority: "medium",
          dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
          workspace: "demo-workspace-1",
          owner: { _id: "demo-user-id", name: "Demo User", email: "demo@taskflow.so" },
          assignee: { _id: "demo-user-id", name: "Demo User", email: "demo@taskflow.so" },
          createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
        },
        {
          _id: "task-5",
          title: "Optimize composite database indexes",
          description: "Add status, priority, and due date composite index sets to accelerate workspace task searches.",
          status: "todo",
          priority: "medium",
          workspace: "demo-workspace-1",
          owner: { _id: "demo-user-id", name: "Demo User", email: "demo@taskflow.so" },
          assignee: null,
          createdAt: new Date().toISOString()
        }
      ])
    );
  }
};

// Intercept requests for Demo Mode
const handleDemoRequest = async (config: any): Promise<any> => {
  initDemoDb();
  const url = config.url || "";
  const method = (config.method || "get").toLowerCase();
  
  const workspaces = JSON.parse(localStorage.getItem("demo_workspaces") || "[]");
  const tasks = JSON.parse(localStorage.getItem("demo_tasks") || "[]");

  let status = 200;
  let data: any = { success: true };

  // Auth Operations
  if (url.includes("/auth/login") || url.includes("/auth/register")) {
    localStorage.setItem("demoMode", "true");
    localStorage.setItem("token", "demo-token");
    data = {
      success: true,
      data: {
        user: { id: "demo-user-id", name: "Demo User", email: "demo@taskflow.so" },
        token: "demo-token"
      }
    };
  }
  // User Session
  else if (url.includes("/auth/me")) {
    data = {
      success: true,
      data: {
        user: { id: "demo-user-id", name: "Demo User", email: "demo@taskflow.so" }
      }
    };
  }
  // Workspaces CRUD
  else if (url.endsWith("/workspaces")) {
    if (method === "get") {
      data = { success: true, data: workspaces };
    } else if (method === "post") {
      const body = getRequestBody(config);
      const newWs = {
        _id: `ws-${Math.random().toString(36).substring(4)}`,
        name: body.name || "Unnamed Workspace",
        owner: "demo-user-id",
        members: [{ user: { _id: "demo-user-id", name: "Demo User", email: "demo@taskflow.so" }, role: "OWNER" }]
      };
      workspaces.push(newWs);
      localStorage.setItem("demo_workspaces", JSON.stringify(workspaces));
      data = { success: true, data: newWs };
    }
  }
  // Add Members to Workspace
  else if (url.includes("/workspaces/") && url.endsWith("/members")) {
    const wsId = url.split("/workspaces/")[1].split("/")[0];
    const ws = workspaces.find((w: any) => w._id === wsId);
    if (ws) {
      const body = getRequestBody(config);
      const newMember = {
        user: {
          _id: `u-${Math.random().toString(36).substring(4)}`,
          name: body.email.split("@")[0].replace(".", " "),
          email: body.email
        },
        role: body.role || "MEMBER"
      };
      ws.members.push(newMember);
      localStorage.setItem("demo_workspaces", JSON.stringify(workspaces));
      data = { success: true, data: ws };
    } else {
      status = 404;
      data = { success: false, error: { message: "Workspace not found" } };
    }
  }
  // Remove Member from Workspace
  else if (url.includes("/workspaces/") && url.includes("/members/")) {
    const parts = url.split("/workspaces/")[1].split("/members/");
    const wsId = parts[0];
    const memberId = parts[1];
    const ws = workspaces.find((w: any) => w._id === wsId);
    if (ws) {
      ws.members = ws.members.filter((m: any) => m.user._id !== memberId);
      localStorage.setItem("demo_workspaces", JSON.stringify(workspaces));
      data = { success: true, data: ws };
    } else {
      status = 404;
      data = { success: false, error: { message: "Workspace not found" } };
    }
  }
  // Tasks CRUD & Queries
  else if (url.endsWith("/tasks") || url.includes("/tasks?")) {
    if (method === "get") {
      const params = config.params || {};
      const wsId = params.workspaceId;
      let workspaceTasks = tasks.filter((t: any) => t.workspace === wsId);

      // Filtering
      if (params.search) {
        const query = params.search.toLowerCase();
        workspaceTasks = workspaceTasks.filter((t: any) => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query));
      }
      if (params.status) {
        workspaceTasks = workspaceTasks.filter((t: any) => t.status === params.status);
      }
      if (params.priority) {
        workspaceTasks = workspaceTasks.filter((t: any) => t.priority === params.priority);
      }

      // Sorting
      if (params.sort) {
        const [field, order] = params.sort.split("_");
        workspaceTasks.sort((a: any, b: any) => {
          let valA = a[field] || "";
          let valB = b[field] || "";
          if (valA < valB) return order === "asc" ? -1 : 1;
          if (valA > valB) return order === "asc" ? 1 : -1;
          return 0;
        });
      }

      const page = parseInt(params.page || "1");
      const limit = parseInt(params.limit || "10");
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = workspaceTasks.slice(start, end);

      data = {
        success: true,
        data: paginated,
        pagination: {
          total: workspaceTasks.length,
          page,
          limit,
          pages: Math.ceil(workspaceTasks.length / limit)
        }
      };
    } else if (method === "post") {
      const body = getRequestBody(config);
      const activeWs = workspaces.find((w: any) => w._id === body.workspace);
      let assigneeObj = null;
      if (body.assignee && activeWs) {
        const mem = activeWs.members.find((m: any) => m.user._id === body.assignee);
        if (mem) assigneeObj = mem.user;
      }
      const newTask = {
        _id: `task-${Math.random().toString(36).substring(4)}`,
        title: body.title,
        description: body.description || "",
        status: body.status || "todo",
        priority: body.priority || "medium",
        dueDate: body.dueDate || null,
        workspace: body.workspace,
        owner: { _id: "demo-user-id", name: "Demo User", email: "demo@taskflow.so" },
        assignee: assigneeObj,
        createdAt: new Date().toISOString()
      };
      tasks.push(newTask);
      localStorage.setItem("demo_tasks", JSON.stringify(tasks));
      data = { success: true, data: newTask };
    }
  }
  // Individual Task Updates & Deletion
  else if (url.includes("/tasks/")) {
    const taskId = url.split("/tasks/")[1];
    const taskIndex = tasks.findIndex((t: any) => t._id === taskId);
    if (taskIndex > -1) {
      if (method === "put") {
        const body = getRequestBody(config);
        const activeWs = workspaces.find((w: any) => w._id === tasks[taskIndex].workspace);
        let assigneeObj = tasks[taskIndex].assignee;
        
        if (body.assignee !== undefined) {
          if (body.assignee === null) {
            assigneeObj = null;
          } else if (activeWs) {
            const mem = activeWs.members.find((m: any) => m.user._id === body.assignee);
            if (mem) assigneeObj = mem.user;
          }
        }
        
        tasks[taskIndex] = {
          ...tasks[taskIndex],
          ...body,
          assignee: assigneeObj
        };
        localStorage.setItem("demo_tasks", JSON.stringify(tasks));
        data = { success: true, data: tasks[taskIndex] };
      } else if (method === "delete") {
        tasks.splice(taskIndex, 1);
        localStorage.setItem("demo_tasks", JSON.stringify(tasks));
        data = { success: true, message: "Task deleted successfully" };
      }
    } else {
      status = 404;
      data = { success: false, error: { message: "Task not found" } };
    }
  }
  // Analytics Aggregation
  else if (url.endsWith("/analytics") || url.includes("/analytics?")) {
    const params = config.params || {};
    const wsId = params.workspaceId;
    const wsTasks = tasks.filter((t: any) => t.workspace === wsId);

    const summary = {
      totalTasks: wsTasks.length,
      completedTasks: wsTasks.filter((t: any) => t.status === "done").length,
      pendingTasks: wsTasks.filter((t: any) => t.status !== "done").length,
      overdueTasks: wsTasks.filter((t: any) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date()).length,
      completionPercentage: wsTasks.length > 0 ? Math.round((wsTasks.filter((t: any) => t.status === "done").length / wsTasks.length) * 100) : 0
    };

    const byStatus = {
      todo: wsTasks.filter((t: any) => t.status === "todo").length,
      in_progress: wsTasks.filter((t: any) => t.status === "in_progress").length,
      done: wsTasks.filter((t: any) => t.status === "done").length
    };

    const byPriority = {
      low: wsTasks.filter((t: any) => t.priority === "low").length,
      medium: wsTasks.filter((t: any) => t.priority === "medium").length,
      high: wsTasks.filter((t: any) => t.priority === "high").length
    };

    data = { success: true, data: { summary, byStatus, byPriority } };
  }

  // Return formatted Axios response
  return {
    data,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: {},
    config
  };
};

// Set custom adapter to intercept network calls when in Demo Mode
api.defaults.adapter = (config) => {
  const body = getRequestBody(config);
  const isDemo =
    localStorage.getItem("demoMode") === "true" ||
    (config.url?.includes("/auth/login") && body.email === "demo@taskflow.so");

  if (isDemo) {
    return handleDemoRequest(config);
  }

  const defaultAdapter = axios.defaults.adapter;
  if (!defaultAdapter) {
    throw new Error("No default adapter found in Axios");
  }
  if (typeof defaultAdapter === "function") {
    return defaultAdapter(config);
  }
  return (axios as any).getAdapter(defaultAdapter)(config);
};

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("demoMode");
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
