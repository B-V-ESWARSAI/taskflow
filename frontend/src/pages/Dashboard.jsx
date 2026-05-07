import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Clock, AlertTriangle, BarChart3, ArrowRight, Calendar } from 'lucide-react';
import { format, isPast } from 'date-fns';
import './Dashboard.css';

function StatCard({ icon, label, value, color, delay }) {
  return (
    <div className="stat-card card" style={{ animationDelay: `${delay}s`, borderTop: `3px solid ${color}` }}>
      <div className="stat-icon" style={{ color, background: `${color}20` }}>{icon}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function statusBadge(task) {
  if (task.status === 'done') return <span className="badge badge-done">Done</span>;
  if (task.dueDate && isPast(new Date(task.dueDate))) return <span className="badge badge-overdue">Overdue</span>;
  if (task.status === 'in_progress') return <span className="badge badge-progress">In Progress</span>;
  return <span className="badge badge-todo">To Do</span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard').then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen" style={{ height: '60vh' }}><div className="spinner" /></div>;

  const stats = data?.stats || {};

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name} 👋</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<BarChart3 size={22} />} label="Total Tasks" value={stats.total ?? 0} color="var(--accent-light)" delay={0} />
        <StatCard icon={<Clock size={22} />} label="In Progress" value={stats.inProgress ?? 0} color="var(--warning)" delay={0.1} />
        <StatCard icon={<CheckSquare size={22} />} label="Completed" value={stats.done ?? 0} color="var(--success)" delay={0.2} />
        <StatCard icon={<AlertTriangle size={22} />} label="Overdue" value={stats.overdue ?? 0} color="var(--danger)" delay={0.3} />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="section-header">
            <h3>Recent Tasks</h3>
            <Link to="/tasks" className="see-all">See all <ArrowRight size={14} /></Link>
          </div>
          {data?.recentTasks?.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <CheckSquare size={40} />
              <h3>No tasks yet</h3>
            </div>
          ) : (
            <div className="task-list">
              {data?.recentTasks?.map(task => (
                <div key={task.id} className="task-row">
                  <div className="task-info">
                    <span className="task-title">{task.title}</span>
                    <span className="task-project">{task.project?.name}</span>
                  </div>
                  <div className="task-meta">
                    {task.dueDate && (
                      <span className="task-due">
                        <Calendar size={12} />
                        {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    )}
                    {statusBadge(task)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <h3>Overdue Tasks</h3>
            <span className="badge badge-overdue">{data?.overdueTasks?.length ?? 0}</span>
          </div>
          {data?.overdueTasks?.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <CheckSquare size={40} />
              <h3>All caught up! 🎉</h3>
              <p>No overdue tasks</p>
            </div>
          ) : (
            <div className="task-list">
              {data?.overdueTasks?.map(task => (
                <div key={task.id} className="task-row overdue">
                  <div className="task-info">
                    <span className="task-title">{task.title}</span>
                    <span className="task-project">{task.project?.name}</span>
                  </div>
                  <span className="task-due overdue-text">
                    <Calendar size={12} />
                    {format(new Date(task.dueDate), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="progress-card card">
        <h3>Task Breakdown</h3>
        <div className="progress-bar-container">
          <div className="progress-bar">
            {stats.total > 0 && <>
              <div className="progress-segment todo" style={{ width: `${(stats.todo / stats.total) * 100}%` }} title={`To Do: ${stats.todo}`} />
              <div className="progress-segment progress" style={{ width: `${(stats.inProgress / stats.total) * 100}%` }} title={`In Progress: ${stats.inProgress}`} />
              <div className="progress-segment done" style={{ width: `${(stats.done / stats.total) * 100}%` }} title={`Done: ${stats.done}`} />
            </>}
          </div>
          <div className="progress-legend">
            <span><span className="dot todo-dot" /> To Do ({stats.todo ?? 0})</span>
            <span><span className="dot progress-dot" /> In Progress ({stats.inProgress ?? 0})</span>
            <span><span className="dot done-dot" /> Done ({stats.done ?? 0})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
