import api from "./api";

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string | null;
  owner: { _id: string; name: string; email: string };
  workspace: string;
  assignee?: { _id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
  dueDate?: string | null;
  workspace: string;
  assignee?: string | null;
}

export interface TaskQueryParams {
  workspaceId: string;
  search?: string;
  status?: string;
  priority?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface TasksResponse {
  success: boolean;
  data: Task[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const getTasks = async (params: TaskQueryParams): Promise<TasksResponse> => {
  const res = await api.get("/tasks", { params });
  return res.data;
};

export const getTaskById = async (id: string): Promise<{ success: boolean; data: Task }> => {
  const res = await api.get(`/tasks/${id}`);
  return res.data;
};

export const createTask = async (data: CreateTaskPayload): Promise<{ success: boolean; data: Task }> => {
  const res = await api.post("/tasks", data);
  return res.data;
};

export const updateTask = async (id: string, data: Partial<CreateTaskPayload>): Promise<{ success: boolean; data: Task }> => {
  const res = await api.put(`/tasks/${id}`, data);
  return res.data;
};

export const deleteTask = async (id: string): Promise<{ success: boolean; message: string }> => {
  const res = await api.delete(`/tasks/${id}`);
  return res.data;
};
