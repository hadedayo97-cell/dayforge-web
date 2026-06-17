import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/hooks/useAuth';
import { X, Target, AlertTriangle } from 'lucide-react';

interface GoalEditorModalProps {
  onClose: () => void;
  onSave: () => void;
}

export function GoalEditorModal({ onClose, onSave }: GoalEditorModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a goal title.');
      return;
    }

    setLoading(true);

    const newGoal = {
      user_id: user?.id,
      title: title.trim(),
      description: description.trim() || null,
      deadline: deadline || null,
      priority,
      progress_percent: 0,
      status: 'active'
    };

    try {
      const { error: insertError } = await supabase.from('goals').insert([newGoal]);
      if (insertError) {
        setError('Failed to save goal. Please try again.');
      } else {
        onSave();
        onClose();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={20} color="var(--primary-color)" />
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>New Goal</h3>
          </div>
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={onClose} 
            style={{ padding: '6px', border: 'none', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid var(--error-color)',
              borderRadius: '8px',
              color: 'var(--error-color)',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <label className="label" htmlFor="title">Goal Title</label>
            <input 
              type="text" 
              id="title" 
              className="input" 
              placeholder="e.g., Launch portfolio website"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="label" htmlFor="description">Description (Optional)</label>
            <textarea 
              id="description" 
              className="textarea" 
              placeholder="Brief details about what success looks like..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="priority">Priority</label>
              <select 
                id="priority" 
                className="select"
                value={priority}
                onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="deadline">Target Deadline</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date" 
                  id="deadline" 
                  className="input"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
