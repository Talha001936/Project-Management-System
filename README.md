# Project Management System
A complete project management application built with React that manages users, teams, projects, and tasks with role-based access control.

# Default Login Credentials
Role	    Email	            Password
Admin	    admin@pms.com	    admin123

Manager	    manager@pms.com	    manager123

Employee	employee@pms.com	employee123


# Core Features
Role-Based Access
Admin: Full control (users, projects, tasks, teams)

Manager: Manage own projects/tasks, view teams

Employee: View assigned tasks/projects, update task status

# Key Operations
Projects: Create, edit, delete, assign teams/members

Tasks: Create, assign, update status (To Do → In Progress → Review → Done)

Teams: Create, manage members, assign leaders (Admin only)

Users: Create, delete, change roles, activate/deactivate (Admin only)

# Auth:    /api/auth/login, /register, /logout, /refresh-token

# Users:   /api/users (CRUD - Admin only)

# Projects:/api/projects (CRUD - Admin/Manager)

# Tasks:   /api/tasks (CRUD + status update)

# Teams:   /api/teams (CRUD - Admin only)





