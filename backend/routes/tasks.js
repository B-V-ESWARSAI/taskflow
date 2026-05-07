const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../db');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: check project access
function hasProjectAccess(db, projectId, user) {
  if (user.role === 'admin') return true;
  return db.projectMembers.some(pm => pm.projectId === projectId && pm.userId === user.id);
}

// GET /api/tasks - all tasks (admin) or user's tasks
router.get('/', auth, (req, res) => {
  const db = readDB();
  let tasks;

  if (req.user.role === 'admin') {
    tasks = db.tasks;
  } else {
    tasks = db.tasks.filter(t => t.assignedTo === req.user.id || t.createdBy === req.user.id);
  }

  const enriched = tasks.map(t => {
    const project = db.projects.find(p => p.id === t.projectId);
    const assignee = t.assignedTo ? db.users.find(u => u.id === t.assignedTo) : null;
    return {
      ...t,
      project: project ? { id: project.id, name: project.name } : null,
      assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
    };
  });

  res.json(enriched);
});

// GET /api/tasks/dashboard - dashboard stats
router.get('/dashboard', auth, (req, res) => {
  const db = readDB();
  const now = new Date();

  let tasks;
  if (req.user.role === 'admin') {
    tasks = db.tasks;
  } else {
    const myProjectIds = db.projectMembers.filter(pm => pm.userId === req.user.id).map(pm => pm.projectId);
    tasks = db.tasks.filter(t => myProjectIds.includes(t.projectId));
  }

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
    myTasks: tasks.filter(t => t.assignedTo === req.user.id).length,
  };

  const recentTasks = tasks
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(t => {
      const project = db.projects.find(p => p.id === t.projectId);
      const assignee = t.assignedTo ? db.users.find(u => u.id === t.assignedTo) : null;
      return { ...t, project: project ? { id: project.id, name: project.name } : null, assignee: assignee ? { id: assignee.id, name: assignee.name } : null };
    });

  const overdueTasks = tasks
    .filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done')
    .map(t => {
      const project = db.projects.find(p => p.id === t.projectId);
      return { ...t, project: project ? { id: project.id, name: project.name } : null };
    });

  res.json({ stats, recentTasks, overdueTasks });
});

// GET /api/tasks/project/:projectId
router.get('/project/:projectId', auth, (req, res) => {
  const db = readDB();
  if (!hasProjectAccess(db, req.params.projectId, req.user))
    return res.status(403).json({ error: 'Access denied' });

  const tasks = db.tasks
    .filter(t => t.projectId === req.params.projectId)
    .map(t => {
      const assignee = t.assignedTo ? db.users.find(u => u.id === t.assignedTo) : null;
      return { ...t, assignee: assignee ? { id: assignee.id, name: assignee.name } : null };
    });

  res.json(tasks);
});

// POST /api/tasks
router.post('/', auth, (req, res) => {
  const { title, description, projectId, assignedTo, dueDate, priority, status } = req.body;
  if (!title || !projectId) return res.status(400).json({ error: 'Title and projectId are required' });

  const db = readDB();
  if (!hasProjectAccess(db, projectId, req.user))
    return res.status(403).json({ error: 'Access denied' });

  // Only admins can assign to others
  const assignee = req.user.role === 'admin' ? assignedTo : (assignedTo === req.user.id ? req.user.id : null);

  const task = {
    id: uuidv4(),
    title,
    description: description || '',
    projectId,
    assignedTo: assignee || null,
    dueDate: dueDate || null,
    priority: priority || 'medium',
    status: status || 'todo',
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.tasks.push(task);
  writeDB(db);

  const assigneeUser = task.assignedTo ? db.users.find(u => u.id === task.assignedTo) : null;
  res.status(201).json({ ...task, assignee: assigneeUser ? { id: assigneeUser.id, name: assigneeUser.name } : null });
});

// PUT /api/tasks/:id
router.put('/:id', auth, (req, res) => {
  const db = readDB();
  const idx = db.tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  const task = db.tasks[idx];
  if (!hasProjectAccess(db, task.projectId, req.user))
    return res.status(403).json({ error: 'Access denied' });

  // Members can only update status of their own tasks
  if (req.user.role !== 'admin' && task.assignedTo !== req.user.id) {
    return res.status(403).json({ error: 'You can only update your own tasks' });
  }

  const allowed = req.user.role === 'admin'
    ? req.body
    : { status: req.body.status }; // members can only change status

  db.tasks[idx] = { ...task, ...allowed, id: task.id, updatedAt: new Date().toISOString() };
  writeDB(db);

  const assignee = db.tasks[idx].assignedTo ? db.users.find(u => u.id === db.tasks[idx].assignedTo) : null;
  res.json({ ...db.tasks[idx], assignee: assignee ? { id: assignee.id, name: assignee.name } : null });
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, requireAdmin, (req, res) => {
  const db = readDB();
  db.tasks = db.tasks.filter(t => t.id !== req.params.id);
  writeDB(db);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
