# TaskFlow — Collaborative Task Management & Analytics

TaskFlow is a production-quality, high-performance collaborative task management and productivity analytics application. It features a clean, Apple-inspired minimal interface, a Notion-style marketing landing page, an interactive drag-and-drop Kanban board, workspace isolation, and secure Role-Based Access Control (RBAC).

---

## 1. TECHNOLOGY STACK

### Frontend
* **React 19 & TypeScript**: Provides structured components and type safety.
* **Vite**: Rapid hot module replacement (HMR) builder.
* **Tailwind CSS v4**: Zero-config compilation utilizing native CSS directives.
* **Recharts**: High-performance SVG charting library for dashboard graphics.
* **Lucide React**: Minimal, geometric iconography.
* **Axios**: HTTP client featuring token injection and session interceptors.

### Backend
* **Node.js & Express**: High-speed, stateless RESTful routing.
* **Mongoose & MongoDB**: ODM layer and document store.
* **JWT (JsonWebTokens)**: Secure stateless authorization headers.
* **Bcryptjs**: Strong salt-based password hashing.
* **Zod**: Type-safe declarative body schema validations.
* **Helmet & CORS**: Essential HTTP headers and rate limit security policies.

---

## 2. SYSTEM ARCHITECTURE & PERMISSIONS

The backend routes are secured using a layered middleware pipeline:
```
[HTTP Request] ➔ [Helmet & CORS] ➔ [Rate Limiter] ➔ [JWT Authentication] ➔ [RBAC Authorization] ➔ [Controller]
```

### Roles and Permissions (RBAC)
* **OWNER**: Full administrative control. Can edit workspace details, invite collaborators by email, remove collaborators, create tasks, edit all tasks in the workspace, and delete tasks.
* **MEMBER**: Standard team user. Can view workspace details, create tasks, and update tasks they created or are assigned to. Cannot delete tasks or manage members.

---

## 3. DESIGN DECISIONS

### Database Indexing & Schema Design
To maintain `O(log N)` search speeds and avoid performance-damaging collection scans (`COLLSCAN`) under production loads, the database schema implements strategic indexes:
* **`{ workspace: 1, status: 1 }`**: Speeds up queries retrieving tasks inside the current workspace filtered by status (e.g. todo, in-progress, done).
* **`{ workspace: 1, priority: 1 }`**: Optimizes queries filtering tasks by priority levels within a specific workspace context.
* **`{ workspace: 1, dueDate: 1 }`**: Supports sorting by due dates within the workspace.
* **`{ owner: 1 }`**: Speeds up fetching tasks created by a specific user.
* **`{ "members.user": 1 }`**: Accelerates workspace list fetches (resolving which workspaces a user belongs to) by indexing the nested array of member IDs.

### Mid-Route Context Injection (RBAC Middleware)
Our authorization middleware (`authorizeWorkspace`) resolves the workspace context from request bodies, parameters, headers, or query strings. If a task ID (`:id`) is present on a task path, the middleware queries the task once, validates membership bounds, and attaches the task document directly to `req.task`. This prevents redundant double-database fetches inside route controllers.

### Light-First Apple/SaaS Aesthetics
The UI adopts a premium "Apple-style" light-first aesthetic:
* Primary pages use a crisp off-white backdrop (`#fbfbfb`) with borderless cards and thin dividers (`border-neutral-100`) to create a spacious layout.
* Accent colors are set to a premium Apple Royal Blue (`#0071e3`), which is applied consistently across CTAs, toggles, loading indicators, and active status rings.
* Page wrappers omit double-padding elements so they align cleanly with the top navigation bar margins.

### Tailwind CSS v4 CSS-Native Dark Mode
In Tailwind CSS v4, dark mode class configuration is defined directly in the main stylesheet (`src/index.css`) rather than in a JavaScript configuration file. We declare `@custom-variant dark (&:where(.dark, .dark *));` to map the `dark:` selector to the `.dark` class toggled on the `html` root by the theme provider.

### Legacy Workspace Integrity Checks
To prevent null pointer crashes when updating or deleting old or corrupt task documents that may lack a `workspace` reference in the database, we integrated explicit workspace safety checks. If `task.workspace` is missing, the server catches it and returns a structured `400 INVALID_TASK` response rather than throwing a runtime error.

### Consolidated Avatar Navigation UX
We replaced floating standalone action buttons with a consolidated dropdown menu in the header. Clicking the user's avatar displays their signed-in profile email, a direct link to Workspace Settings, and a logout action.

---

## 4. SETUP STEPS

### Prerequisites
* **Node.js** (v18 or higher)
* **MongoDB** (local database instance running on `localhost:27017`)

### 1. Configure the Environment
Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_jwt_signing_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 2. Install and Run the Backend
```bash
# Navigate to the server folder
cd server

# Install dependencies
npm install

# Start the tsx development watcher
npm run dev
```

### 3. Install and Run the Frontend
```bash
# Navigate to the client folder
cd client

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 5. API ENDPOINTS

All API responses return a standardized JSON payload structure:
`{ "success": true, "data": ... }` or `{ "success": false, "error": { "code": "...", "message": "..." } }`

### Authentication (`/api/auth`)
| Method | Path | Auth Required | Role Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/register` | No | None | Registers user & auto-creates a personal workspace. |
| `POST` | `/login` | No | None | Validates credentials and issues a JWT cookie/token. |
| `POST` | `/logout` | Yes | None | Standard logout. |
| `GET` | `/me` | Yes | None | Returns active user profile session data. |

### Workspaces (`/api/workspaces`)
| Method | Path | Auth Required | Role Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Yes | None | Lists all workspaces the user is a member of. |
| `GET` | `/:id` | Yes | MEMBER / OWNER | Retrieves specific workspace member listing. |
| `POST` | `/` | Yes | None | Creates a new workspace. |
| `POST` | `/:id/members` | Yes | OWNER | Invites a member to the workspace by email. |
| `DELETE` | `/:id/members/:userId` | Yes | OWNER | Removes a member from the workspace. |

### Tasks (`/api/tasks`)
| Method | Path | Auth Required | Role Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Yes | MEMBER / OWNER | Queries tasks (supports sorting, page pagination, search, status, and priority filters). |
| `GET` | `/:id` | Yes | MEMBER / OWNER | Fetches individual task by ID. |
| `POST` | `/` | Yes | MEMBER / OWNER | Creates a task inside the active workspace. |
| `PUT` | `/:id` | Yes | MEMBER / OWNER | Updates task details (Members can only edit tasks they own or are assigned to). |
| `DELETE` | `/:id` | Yes | OWNER | Deletes task document (restricted to workspace owners). |

### Analytics (`/api/analytics`)
| Method | Path | Auth Required | Role Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Yes | MEMBER / OWNER | Returns aggregated status, priority, and completion rate stats for the current workspace. |

---

## 6. OFFLINE DEMO MODE (SERVERLESS SANDBOX)

To enable developers and reviewers to test the complete application instantly without installing MongoDB or running the Node.js backend, TaskFlow includes an **Offline Demo Mode**.

### How to Access Demo Mode
1. Start only the frontend client dev server (`npm run dev` in `client/`).
2. Visit `http://localhost:5173/login`.
3. Click the prominent **"Explore with Demo Account"** button below the form, or log in with these credentials:
   * **Email:** `demo@taskflow.so`
   * **Password:** `demopassword`

### How it Works
When Demo Mode is activated:
* **Axios Interception:** The client overrides the default Axios requests handler inside [api.ts](file:///Users/madapathisaisathvik/Desktop/Task%20Manager/client/src/services/api.ts) using a custom adapter.
* **Local Storage DB:** All REST requests (`GET`, `POST`, `PUT`, `DELETE`) are processed locally using an in-browser database simulated on top of `localStorage`.
* **State Preservation:** Creating, modifying, deleting tasks, moving columns on the Kanban board, and adding workspace members will persist across page refreshes and update the Recharts analytics graphs dynamically.
* **Zero Backend Overhead:** The entire application behaves as if a live Node.js server is processing queries, making it suitable for static server deployments (e.g. GitHub Pages, Vercel, Netlify).