import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Users, Trash2, X, ChevronLeft, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import './ProjectDetail.css';

const STATUSES = ['todo', 'in_progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

function TaskCard({ task, onUpdate, onDelete, isAdmin }) {
  const handleStatus = async (status) => {
    try {
      const res = await api.put(`/tasks/${task.id}`, { status });
      onUpdate(res.data);
    } catch {
      toast.error('Failed to update task');
    }
  };

  return (
    <div className="task-card">
      <div className="task-card-header">
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
        {isAdmin && (
          <button className="icon-btn danger" onClick={() => onDelete(task.id)}>
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <h4 className="task-card-title">{task.title}</h4>
      {task.description && <p className="task-card-desc">{task.description}</p>}
      <div className="task-card-footer">
        {task.assignee && (
          <div className="task-assignee">
            <div className="mini-avatar">{task.assignee.name[0].toUpperCase()}</div>
            <span>{task.assignee.name}</span>
          </div>
        )}
        {task.dueDate && (
          <span className="task-due-date">{format(new Date(task.dueDate), 'MMM d')}</span>
        )}
      </div>
      {(isAdmin || task.assignedTo) && (
        <select
          className="status-select"
          value={task.status}
          onChange={e => handleStatus(e.target.value)}
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      )}
    </div>
  );
}

function AddTaskModal({ projectId, members, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'medium', status: 'todo' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/tasks', { ...form, projectId });
      onCreated(res.data);
      toast.success('Task created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Task</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input placeholder="What needs to be done?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea rows={2} placeholder="Optional details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map(m => m.user && <option key={m.userId} value={m.userId}>{m.user.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, allUsers, existingIds, onClose, onAdded }) {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const available = allUsers.filter(u => !existingIds.includes(u.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    try {
      const res = await api.post(`/projects/${projectId}/members`, { userId });
      onAdded(res.data);
      toast.success('Member added!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Team Member</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select User</label>
            <select value={userId} onChange={e => setUserId(e.target.value)} required>
              <option value="">Choose a user...</option>
              {available.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          {available.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>All users are already members.</p>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !userId}>
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get('/users/all'),
    ]).then(([pRes, uRes]) => {
      setProject(pRes.data);
      setAllUsers(uRes.data);
      setLoading(false);
    }).catch(() => { toast.error('Project not found'); navigate('/projects'); });
  }, [id]);

  const handleTaskCreated = (task) => {
    setProject(p => ({ ...p, tasks: [task, ...p.tasks] }));
  };

  const handleTaskUpdate = (updated) => {
    setProject(p => ({ ...p, tasks: p.tasks.map(t => t.id === updated.id ? updated : t) }));
  };

  const handleTaskDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setProject(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== taskId) }));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  const handleMemberAdded = (member) => {
    setProject(p => ({ ...p, members: [...p.members, member] }));
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setProject(p => ({ ...p, members: p.members.filter(m => m.userId !== userId) }));
      toast.success('Member removed');
    } catch { toast.error('Failed to remove member'); }
  };

  if (loading) return <div className="loading-screen" style={{ height: '60vh' }}><div className="spinner" /></div>;
  if (!project) return null;

  const isAdmin = user?.role === 'admin';
  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = project.tasks?.filter(t => t.status === s) || [];
    return acc;
  }, {});

  const memberIds = project.members?.map(m => m.userId) || [];

  return (
    <div className="project-detail">
      <button className="back-btn" onClick={() => navigate('/projects')}>
        <ChevronLeft size={18} /> Projects
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAddTask(true)}>
            <Plus size={18} /> Add Task
          </button>
        )}
      </div>

      {/* Members */}
      <div className="card members-card">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} />
            <h3>Team Members ({project.members?.length})</h3>
          </div>
          {isAdmin && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAddMember(true)}>
              <UserPlus size={16} /> Add Member
            </button>
          )}
        </div>
        <div className="members-list">
          {project.members?.map(m => m.user && (
            <div key={m.id} className="member-item">
              <div className="member-avatar">{m.user.name[0].toUpperCase()}</div>
              <div>
                <div className="member-name">{m.user.name}</div>
                <div className="member-email">{m.user.email}</div>
              </div>
              <span className={`badge badge-${m.user.id === project.createdBy ? 'admin' : 'member'}`}>
                {m.user.id === project.createdBy ? 'admin' : 'member'}
              </span>
              {isAdmin && m.user.id !== user.id && (
                <button className="icon-btn danger" onClick={() => handleRemoveMember(m.userId)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {STATUSES.map(status => (
          <div key={status} className="kanban-column">
            <div className="kanban-header">
              <span className={`badge badge-${status === 'todo' ? 'todo' : status === 'in_progress' ? 'progress' : 'done'}`}>
                {STATUS_LABELS[status]}
              </span>
              <span className="kanban-count">{tasksByStatus[status].length}</span>
            </div>
            <div className="kanban-tasks">
              {tasksByStatus[status].map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={handleTaskUpdate}
                  onDelete={handleTaskDelete}
                  isAdmin={isAdmin}
                />
              ))}
              {tasksByStatus[status].length === 0 && (
                <div className="kanban-empty">No tasks here</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddTask && (
        <AddTaskModal
          projectId={id}
          members={project.members || []}
          onClose={() => setShowAddTask(false)}
          onCreated={handleTaskCreated}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          projectId={id}
          allUsers={allUsers}
          existingIds={memberIds}
          onClose={() => setShowAddMember(false)}
          onAdded={handleMemberAdded}
        />
      )}
    </div>
  );
}
