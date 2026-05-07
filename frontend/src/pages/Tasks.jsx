import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { CheckSquare, Calendar, Filter } from 'lucide-react';
import { format, isPast } from 'date-fns';
import './Tasks.css';

const FILTERS = ['all', 'todo', 'in_progress', 'done', 'overdue'];

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/tasks').then(res => {
      setTasks(res.data);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = async (taskId, status) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status });
      setTasks(t => t.map(x => x.id === taskId ? res.data : x));
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const filtered = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done';
    return t.status === filter;
  });

  if (loading) return <div className="loading-screen" style={{ height: '60vh' }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">{tasks.length} total tasks</p>
        </div>
      </div>

      <div className="filter-bar">
        <Filter size={16} style={{ color: 'var(--text-muted)' }} />
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <CheckSquare size={48} />
          <h3>No tasks found</h3>
          <p>Tasks assigned to you will appear here</p>
        </div>
      ) : (
        <div className="tasks-table card">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
                return (
                  <tr key={task.id} className={isOverdue ? 'overdue-row' : ''}>
                    <td>
                      <div className="task-cell">
                        <span className="task-cell-title">{task.title}</span>
                        {task.description && <span className="task-cell-desc">{task.description}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="project-chip">{task.project?.name || '—'}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    </td>
                    <td>
                      {task.dueDate ? (
                        <span className={`due-cell ${isOverdue ? 'overdue' : ''}`}>
                          <Calendar size={13} />
                          {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <select
                        className="status-select-inline"
                        value={task.status}
                        onChange={e => handleStatusChange(task.id, e.target.value)}
                        disabled={user?.role !== 'admin' && task.assignedTo !== user?.id}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
