# Project Management System (PMS)

A full-stack project management application with role-based access control, built with React + Vite (frontend) and Node.js + Express (backend).


## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@pms.com` | `admin123` |
| **Manager** | `manager@pms.com` | `manager123` |
| **Employee** | `employee@pms.com` | `employee123` |


##  Core Features

### 🔐 Authentication
- JWT-based authentication with refresh tokens
- HTTP-only cookies for secure token storage
- Automatic token refresh
- Session management

### User Management (Admin Only)
- Create, update, delete users
- Change user roles (Manager/Employee)
- Activate/deactivate user accounts

### Project Management
- Create, edit, delete projects
- Assign project managers
- Add team members and individual members
- Track project status (Active, Completed, Archived)

### Task Management
- Create, edit, delete tasks
- Assign tasks to users
- Update task status (To Do → In Progress → Review → Done)
- Task priority levels (Low, Medium, High, Critical)

### Team Management (Admin Only)
- Create, edit, delete teams
- Assign team leaders
- Add/remove team members

### Dashboard
- Role-specific dashboards with key metrics
- Task statistics and project overview




---

## 🌐 API Endpoints

### Authentication
