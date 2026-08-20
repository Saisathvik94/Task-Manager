import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} from "../services/tasks";
import type { Task } from "../services/tasks";
import {
  Search,
  Plus,
  List,
  Kanban,
  Calendar,
  AlertTriangle,
  User,
  Trash2,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2
} from "lucide-react";

const Tasks: React.FC = () => {
  const { user, currentWorkspace } = useAuth();
  const { showToast } = useToast();
  
  // Tasks list state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search, filter, sorting, pagination state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt_desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);

  // View state: 'list' | 'kanban'
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  // Active task selection
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formType, setFormType] = useState<"create" | "edit">("create");

  // Form inputs
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStatus, setTaskStatus] = useState<"todo" | "in_progress" | "done">("todo");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search debounce handler
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch tasks
  const fetchTasks = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getTasks({
        workspaceId: currentWorkspace._id,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        sort: sortBy,
        page,
        limit: 10
      });
      setTasks(res.data);
      setTotalPages(res.pagination.pages);
      setTotalTasks(res.pagination.total);
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when workspace, filters, search, sort, or page changes
  useEffect(() => {
    fetchTasks();
  }, [currentWorkspace?._id, debouncedSearch, statusFilter, priorityFilter, sortBy, page]);

  // Determine user role in current workspace
  const userRole = currentWorkspace?.members.find((m) => m.user?._id === user?.id)?.role || "MEMBER";
  const isOwner = userRole === "OWNER";

  // Check if current user can edit a specific task
  const canEditTask = (task: Task) => {
    if (isOwner) return true;
    return task.owner?._id === user?.id || task.assignee?._id === user?.id;
  };

  // Open task form for create
  const handleOpenCreate = () => {
    setFormType("create");
    setTaskTitle("");
    setTaskDesc("");
    setTaskStatus("todo");
    setTaskPriority("medium");
    setTaskDueDate("");
    setTaskAssignee("");
    setFormError(null);
    setFormModalOpen(true);
  };

  // Open task form for edit
  const handleOpenEdit = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening details
    setFormType("edit");
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || "");
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setTaskAssignee(task.assignee?._id || "");
    setFormError(null);
    setFormModalOpen(true);
  };

  // Open task details view
  const handleOpenDetails = (task: Task) => {
    setSelectedTask(task);
    setDetailsModalOpen(true);
  };

  // Open delete confirmation
  const handleOpenDelete = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(task);
    setDeleteModalOpen(true);
  };

  // Form Submit (create/edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setFormError("Title is required");
      return;
    }
    if (!currentWorkspace) return;

    setFormError(null);
    setSubmitting(true);

    try {
      const payload = {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        status: taskStatus,
        priority: taskPriority,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
        assignee: taskAssignee || null,
        workspace: currentWorkspace._id
      };

      if (formType === "create") {
        await createTask(payload);
        showToast("Task created successfully!");
      } else {
        if (!selectedTask) return;
        await updateTask(selectedTask._id, payload);
        showToast("Task updated successfully!");
      }

      await fetchTasks();
      setFormModalOpen(false);
    } catch (err: any) {
      console.error("Task submission error:", err);
      const msg = err.response?.data?.error?.message || "Failed to save task. Please check input parameters.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Task Delete Confirmation
  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    setSubmitting(true);
    try {
      await deleteTask(selectedTask._id);
      showToast("Task deleted successfully!");
      await fetchTasks();
      setDeleteModalOpen(false);
      setDetailsModalOpen(false);
    } catch (err: any) {
      console.error("Task deletion error:", err);
      showToast(err.response?.data?.error?.message || "Failed to delete task.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Kanban status updates via patching
  const handleStatusChange = async (taskId: string, newStatus: "todo" | "in_progress" | "done") => {
    // Find the task local reference
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    // Permissions check on status modification
    if (!canEditTask(task)) {
      showToast("As a member, you can only update status on tasks you own or are assigned to.", "error");
      return;
    }

    // Optimistically update status
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTask(taskId, { status: newStatus });
      showToast("Task status updated!");
    } catch (err) {
      console.error("Failed to update status on server:", err);
      // Revert if error
      setTasks(previousTasks);
      showToast("Failed to update task status on database.", "error");
    }
  };

  // HTML5 Drag and Drop column handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: "todo" | "in_progress" | "done") => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      handleStatusChange(taskId, targetStatus);
    }
  };

  const getDueDateLabel = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const timeDiff = compareDate.getTime() - today.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });

    if (dayDiff < 0) {
      return { text: `Overdue (${formattedDate})`, style: "text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 border-red-100 dark:border-red-950/30" };
    } else if (dayDiff === 0) {
      return { text: `Due Today`, style: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-950/30" };
    } else if (dayDiff === 1) {
      return { text: `Due Tomorrow`, style: "text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-350 border-neutral-200/50 dark:border-neutral-700/50" };
    }
    return { text: formattedDate, style: "text-neutral-500 bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 border-neutral-100 dark:border-neutral-800/30" };
  };

  const priorityMeta = {
    low: { color: "bg-neutral-400", label: "Low", text: "text-neutral-650 dark:text-neutral-400" },
    medium: { color: "bg-amber-500", label: "Medium", text: "text-amber-600 dark:text-amber-400" },
    high: { color: "bg-red-500", label: "High", text: "text-red-600 dark:text-red-400" }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            Tasks
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Organize, delegate, and monitor your workspace progress
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggler */}
          <div className="bg-neutral-150 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-850 p-0.5 rounded-xl flex items-center shadow-xs">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-white dark:bg-neutral-800 text-brand font-semibold shadow-xs"
                  : "text-neutral-500 hover:text-neutral-850 dark:hover:text-neutral-300"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-neutral-800 text-brand font-semibold shadow-xs"
                  : "text-neutral-500 hover:text-neutral-850 dark:hover:text-neutral-300"
              }`}
              title="Kanban Board"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>

          {/* New Task CTA */}
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-neutral-950 dark:bg-brand hover:bg-neutral-850 dark:hover:bg-brand-hover text-white font-medium text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-3 rounded-2xl shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-neutral-900 dark:text-neutral-50 placeholder-neutral-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-xl text-xs text-neutral-600 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-xl text-xs text-neutral-600 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-xl text-xs text-neutral-600 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand cursor-pointer"
          >
            <option value="createdAt_desc">Newest First</option>
            <option value="createdAt_asc">Oldest First</option>
            <option value="dueDate_asc">Due Date (Asc)</option>
            <option value="dueDate_desc">Due Date (Desc)</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand animate-spin mb-2" />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Loading tasks list...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-center rounded-2xl max-w-md mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Failed to load</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-450 mt-1 mb-4">{error}</p>
          <button
            onClick={fetchTasks}
            className="px-4 py-2 bg-red-655 text-white text-xs font-semibold rounded-xl hover:bg-red-700 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-16 text-center max-w-md mx-auto">
          <CheckCircle2 className="w-12 h-12 text-brand mx-auto mb-4 opacity-80" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">No tasks found</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-450 mt-2 mb-6">
            {debouncedSearch || statusFilter || priorityFilter
              ? "No tasks match your filter criteria. Try resetting filters."
              : "There are no tasks in this workspace yet. Create your first task to start."}
          </p>
          {!debouncedSearch && !statusFilter && !priorityFilter ? (
            <button
              onClick={handleOpenCreate}
              className="bg-brand hover:bg-brand-hover text-white font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Create first task
            </button>
          ) : (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setPriorityFilter("");
              }}
              className="border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-600 dark:text-neutral-300 font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === "list" ? (
        /* List View Mode */
        <div className="space-y-2">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl overflow-hidden shadow-xs">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
              {tasks.map((task) => {
                const dueDateMeta = getDueDateLabel(task.dueDate);
                return (
                  <div
                    key={task._id}
                    onClick={() => handleOpenDetails(task)}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-850/40 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Checkbox circle for Quick status complete toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(task._id, task.status === "done" ? "todo" : "done");
                        }}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                          task.status === "done"
                            ? "bg-brand border-brand text-white"
                            : "border-neutral-300 dark:border-neutral-700 hover:border-brand"
                        }`}
                      >
                        {task.status === "done" && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      <div className="min-w-0">
                        <h4
                          className={`text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 truncate ${
                            task.status === "done" ? "line-through text-neutral-400 dark:text-neutral-550" : ""
                          }`}
                        >
                          {task.title}
                        </h4>
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                          {/* Priority */}
                          <span className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta[task.priority].color}`} />
                            <span>{priorityMeta[task.priority].label}</span>
                          </span>
                          
                          {/* Status */}
                          <span className="capitalize">{task.status.replace("_", " ")}</span>
                          
                          {/* Assignee */}
                          {task.assignee && (
                            <span className="flex items-center gap-1">
                              <span className="w-4 h-4 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center text-[9px] font-medium border border-neutral-200/50 dark:border-neutral-700/50">
                                {task.assignee.name.charAt(0).toUpperCase()}
                              </span>
                              <span className="truncate max-w-[100px]">{task.assignee.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Due Date tag */}
                      {dueDateMeta && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border ${dueDateMeta.style}`}>
                          {dueDateMeta.text}
                        </span>
                      )}

                      {/* Hover action buttons */}
                      <div className="md:opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        {canEditTask(task) && (
                          <button
                            onClick={(e) => handleOpenEdit(task, e)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                            title="Edit task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isOwner && (
                          <button
                            onClick={(e) => handleOpenDelete(task, e)}
                            className="p-1.5 text-neutral-400 hover:text-red-655 dark:hover:text-red-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-850 cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-200/50 dark:border-neutral-850 pt-4 px-2">
              <span className="text-[11px] text-neutral-500">
                Showing {tasks.length} of {totalTasks} tasks
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="p-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg disabled:opacity-40 text-neutral-600 dark:text-neutral-350 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-neutral-600 dark:text-neutral-300 px-2 font-medium">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg disabled:opacity-40 text-neutral-600 dark:text-neutral-350 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Kanban Board View Mode */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {(["todo", "in_progress", "done"] as const).map((columnKey) => {
            const columnTasks = tasks.filter((t) => t.status === columnKey);
            const columnTitles = {
              todo: "To Do",
              in_progress: "In Progress",
              done: "Done"
            };

            return (
              <div
                key={columnKey}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, columnKey)}
                className="bg-neutral-100/60 dark:bg-neutral-900/50 border border-neutral-200/30 dark:border-neutral-850 rounded-2xl p-4 flex flex-col min-h-[500px]"
              >
                {/* Column Title */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      {columnTitles[columnKey]}
                    </span>
                    <span className="text-[10px] bg-neutral-200/60 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-full px-1.5 py-0.5 leading-none font-semibold">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                  {columnTasks.map((task) => {
                    const dueDateMeta = getDueDateLabel(task.dueDate);
                    return (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        onClick={() => handleOpenDetails(task)}
                        className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-3.5 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-grab active:cursor-grabbing group relative"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-50 line-clamp-2 leading-tight">
                            {task.title}
                          </h4>
                          {canEditTask(task) && (
                            <button
                              onClick={(e) => handleOpenEdit(task, e)}
                              className="md:opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded transition-opacity cursor-pointer flex-shrink-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-450 mt-1 line-clamp-2 leading-snug">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-neutral-100 dark:border-neutral-850/80">
                          {/* Priority dot */}
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta[task.priority].color}`} />
                            <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">
                              {task.priority}
                            </span>
                          </div>

                          {/* Assignee initials badge */}
                          {task.assignee ? (
                            <div
                              className="w-5 h-5 rounded-full bg-brand-light dark:bg-brand-dark/20 text-brand dark:text-brand flex items-center justify-center text-[9px] font-bold border border-brand/20"
                              title={`Assigned to ${task.assignee.name}`}
                            >
                              {task.assignee.name.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center border border-dashed border-neutral-350 dark:border-neutral-700">
                              <User className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>

                        {/* Due Date Indicator */}
                        {dueDateMeta && (
                          <div className="mt-2 flex">
                            <span className={`text-[9px] font-medium px-2 py-0.5 rounded border ${dueDateMeta.style}`}>
                              {dueDateMeta.text}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Create/Edit Form Modal */}
      {formModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-850 rounded-2xl max-w-lg w-full p-6 shadow-xl animate-scale-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                {formType === "create" ? "Create Task" : "Edit Task"}
              </h3>
              <button
                onClick={() => setFormModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-655 dark:text-red-400 rounded-lg text-xs border border-red-105">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-450 uppercase tracking-wider mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Design Landing Page"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="block w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-450 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Add detailed task notes..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-450 uppercase tracking-wider mb-2">
                    Status
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as any)}
                    className="block w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs cursor-pointer"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-neutral-450 uppercase tracking-wider mb-2">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="block w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-450 uppercase tracking-wider mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="block w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-neutral-450 uppercase tracking-wider mb-2">
                    Assignee
                  </label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="block w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {currentWorkspace?.members.map((member) => (
                      <option key={member.user?._id} value={member.user?._id}>
                        {member.user?.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-medium cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Sheet/Modal */}
      {detailsModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-850 rounded-2xl max-w-lg w-full p-6 shadow-xl animate-scale-up">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border capitalize ${
                  selectedTask.status === "done"
                    ? "bg-brand-light dark:bg-brand-dark/20 text-brand font-medium border-brand/20"
                    : selectedTask.status === "in_progress"
                    ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100"
                    : "bg-neutral-100 dark:bg-neutral-805 text-neutral-500 border-neutral-200"
                }`}>
                  {selectedTask.status.replace("_", " ")}
                </span>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50 mt-2">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Task Description */}
            <div className="py-4 border-t border-b border-neutral-100 dark:border-neutral-850 my-4">
              <h4 className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Description
              </h4>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                {selectedTask.description || "No description provided."}
              </p>
            </div>

            {/* Task Metadata details */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6">
              <div>
                <span className="text-[10px] text-neutral-450 block mb-1">Created By</span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  {selectedTask.owner?.name || "Unknown"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-450 block mb-1">Assignee</span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  {selectedTask.assignee ? (
                    <>
                      <span className="w-4.5 h-4.5 rounded-full bg-brand-light dark:bg-brand-dark/30 text-brand flex items-center justify-center font-bold text-[9px] border border-brand/20">
                        {selectedTask.assignee.name.charAt(0).toUpperCase()}
                      </span>
                      <span>{selectedTask.assignee.name}</span>
                    </>
                  ) : (
                    "Unassigned"
                  )}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-450 block mb-1">Priority</span>
                <span className="font-medium text-neutral-850 dark:text-neutral-200 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta[selectedTask.priority].color}`} />
                  <span className="capitalize">{selectedTask.priority}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-450 block mb-1">Due Date</span>
                <span className="font-medium text-neutral-805 dark:text-neutral-200 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    {selectedTask.dueDate
                      ? new Date(selectedTask.dueDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })
                      : "No due date"}
                  </span>
                </span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex gap-2 justify-between border-t border-neutral-100 dark:border-neutral-850 pt-4">
              {isOwner ? (
                <button
                  onClick={(e) => handleOpenDelete(selectedTask, e)}
                  className="flex items-center gap-1 px-3 py-2 border border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-655 dark:text-red-450 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Task</span>
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                {canEditTask(selectedTask) && (
                  <button
                    onClick={(e) => handleOpenEdit(selectedTask, e)}
                    className="flex items-center gap-1 px-3 py-2 border border-neutral-200 dark:border-neutral-850 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl text-xs font-semibold cursor-pointer text-neutral-700 dark:text-neutral-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Task</span>
                  </button>
                )}
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="px-4 py-2 bg-neutral-950 dark:bg-neutral-800 text-white rounded-xl text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl max-w-sm w-full p-6 shadow-xl animate-scale-up">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
                Delete Task?
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-450 mb-6">
                Are you sure you want to delete "<strong>{selectedTask.title}</strong>"? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTask}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {submitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
