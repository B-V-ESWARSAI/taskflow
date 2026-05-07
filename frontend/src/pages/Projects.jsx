import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Users, CheckSquare, AlertTriangle, Trash2, X } from 'lucide-react';
import './Projects.css';

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/projects', form);
      onCreated(res.data);
      toast.success('Project created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input
              placeholder="e.g. Website Redesign"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api.get('/projects').then(res => {
      setProjects(res.data);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(p => p.filter(x => x.id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  if (loading) return <div className="loading-screen" style={{ height: '60vh' }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} projects total</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state card">
          <FolderKanban size={48} />
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
              <Plus size={18} /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <Link to={`/projects/${project.id}`} key={project.id} className="project-card card">
              <div className="project-card-header">
                <div className="project-icon">
                  <FolderKanban size={20} />
                </div>
                <span className={`badge ${project.status === 'active' ? 'badge-done' : 'badge-todo'}`}>
                  {project.status}
                </span>
                {user?.role === 'admin' && (
                  <button className="btn btn-danger btn-sm" onClick={e => handleDelete(project.id, e)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <h3 className="project-name">{project.name}</h3>
              {project.description && (
                <p className="project-desc">{project.description}</p>
              )}

              <div className="project-stats">
                <span><Users size={14} /> {project.memberCount} members</span>
                <span><CheckSquare size={14} /> {project.completedCount}/{project.taskCount} done</span>
                {project.overdueCount > 0 && (
                  <span className="overdue-stat"><AlertTriangle size={14} /> {project.overdueCount} overdue</span>
                )}
              </div>

              {project.taskCount > 0 && (
                <div className="project-progress">
                  <div
                    className="project-progress-fill"
                    style={{ width: `${(project.completedCount / project.taskCount) * 100}%` }}
                  />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={p => setProjects(prev => [p, ...prev])}
        />
      )}
    </div>
  );
}
