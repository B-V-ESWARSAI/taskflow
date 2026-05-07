const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../db');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects - list all projects user has access to
router.get('/', auth, (req, res) => {
  const db = readDB();
  let projects;

  if (req.user.role === 'admin') {
    projects = db.projects;
  } else {
    const memberProjectIds = db.projectMembers
      .filter(pm => pm.userId === req.user.id)
      .map(pm => pm.projectId);
    projects = db.projects.filter(p => memberProjectIds.includes(p.id) || p.createdBy === req.user.id);
  }

  // Attach member count and task stats
  const enriched = projects.map(p => {
    const members = db.projectMembers.filter(pm => pm.projectId === p.id);
    const tasks = db.tasks.filter(t => t.projectId === p.id);
    const completed = tasks.filter(t => t.status === 'done').length;
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
    return { ...p, memberCount: members.length, taskCount: tasks.length, completedCount: completed, overdueCount: overdue };
  });

  res.json(enriched);
});

// POST /api/projects - create project (admin only)
router.post('/', auth, requireAdmin, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  const db = readDB();
  const project = {
    id: uuidv4(),
    name,
    description: description || '',
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  db.projects.push(project);

  // Auto-add creator as member
  db.projectMembers.push({ id: uuidv4(), projectId: project.id, userId: req.user.id, role: 'admin', addedAt: new Date().toISOString() });
  writeDB(db);

  res.status(201).json(project);
});

// GET /api/projects/:id
router.get('/:id', auth, (req, res) => {
  const db = readDB();
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  // Check access
  if (req.user.role !== 'admin') {
    const isMember = db.projectMembers.some(pm => pm.projectId === project.id && pm.userId === req.user.id);
    if (!isMember && project.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  const members = db.projectMembers
    .filter(pm => pm.projectId === project.id)
    .map(pm => {
      const user = db.users.find(u => u.id === pm.userId);
      return { ...pm, user: user ? { id: user.id, name: user.name, email: user.email } : null };
    });

  const tasks = db.tasks.filter(t => t.projectId === project.id).map(t => {
    const assignee = t.assignedTo ? db.users.find(u => u.id === t.assignedTo) : null;
    return { ...t, assignee: assignee ? { id: assignee.id, name: assignee.name } : null };
  });

  res.json({ ...project, members, tasks });
});

// PUT /api/projects/:id
router.put('/:id', auth, requireAdmin, (req, res) => {
  const db = readDB();
  const idx = db.projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });

  db.projects[idx] = { ...db.projects[idx], ...req.body, id: req.params.id };
  writeDB(db);
  res.json(db.projects[idx]);
});

// DELETE /api/projects/:id
router.delete('/:id', auth, requireAdmin, (req, res) => {
  const db = readDB();
  db.projects = db.projects.filter(p => p.id !== req.params.id);
  db.projectMembers = db.projectMembers.filter(pm => pm.projectId !== req.params.id);
  db.tasks = db.tasks.filter(t => t.projectId !== req.params.id);
  writeDB(db);
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:id/members - add member
router.post('/:id/members', auth, requireAdmin, (req, res) => {
  const { userId, role } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const db = readDB();
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const existing = db.projectMembers.find(pm => pm.projectId === req.params.id && pm.userId === userId);
  if (existing) return res.status(400).json({ error: 'User is already a member' });

  const member = { id: uuidv4(), projectId: req.params.id, userId, role: role || 'member', addedAt: new Date().toISOString() };
  db.projectMembers.push(member);
  writeDB(db);

  res.status(201).json({ ...member, user: { id: user.id, name: user.name, email: user.email } });
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', auth, requireAdmin, (req, res) => {
  const db = readDB();
  db.projectMembers = db.projectMembers.filter(
    pm => !(pm.projectId === req.params.id && pm.userId === req.params.userId)
  );
  writeDB(db);
  res.json({ message: 'Member removed' });
});

module.exports = router;
