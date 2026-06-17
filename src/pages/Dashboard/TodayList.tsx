import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/hooks/useAuth';
import { Trash2, Plus, Calendar, Target, Bell, Clock } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  goal_id?: string;
  due_date?: string;
}

interface Goal {
  id: string;
  title: string;
}

interface TodayListProps {
  tasks: Task[];
  goals: Goal[];
  onReload: () => void;
}

export function TodayList({ tasks, goals, onReload }: TodayListProps) {
  const { user } = useAuth();
  const [newTitle, setNewTitle] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [showReminderForTaskId, setShowReminderForTaskId] = useState<string | null>(null);
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [scheduledReminders, setScheduledReminders] = useState<Record<string, string>>({}); // maps task_id -> send_at

  const loadReminders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'scheduled');

    const remindersMap: Record<string, string> = {};
    (data ?? []).forEach((n: any) => {
      if (n.payload?.task_id) {
        remindersMap[n.payload.task_id] = n.send_at;
      }
    });
    setScheduledReminders(remindersMap);
  };

  useEffect(() => {
    loadReminders();
  }, [tasks, user]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask = {
      user_id: user?.id,
      title: newTitle.trim(),
      completed: false,
      goal_id: selectedGoalId || null,
      due_date: dueDate || null
    };

    const { error } = await supabase.from('tasks').insert([newTask]);
    if (!error) {
      setNewTitle('');
      setSelectedGoalId('');
      setIsAdding(false);
      onReload();

      // Recalculate goal progress if goal_id is set
      if (selectedGoalId) {
        updateGoalProgress(selectedGoalId);
      }
    }
  };

  const handleToggleTask = async (task: Task) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id);
    
    if (!error) {
      onReload();
      if (task.goal_id) {
        updateGoalProgress(task.goal_id);
      }
    }
  };

  const handleDeleteTask = async (task: Task) => {
    // Delete associated reminders first
    await handleCancelReminder(task.id);

    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (!error) {
      onReload();
      if (task.goal_id) {
        updateGoalProgress(task.goal_id);
      }
    }
  };

  const handleSetReminder = async (task: Task) => {
    if (!user || !reminderDateTime) return;

    const sendAt = new Date(reminderDateTime).toISOString();

    // Cancel existing reminder first
    await handleCancelReminder(task.id);

    const newReminder = {
      user_id: user.id,
      type: 'reminder',
      payload: {
        title: `Task Reminder: ${task.title}`,
        message: `This is your scheduled email reminder for: "${task.title}".`,
        task_id: task.id
      },
      send_at: sendAt,
      status: 'scheduled'
    };

    const { error } = await supabase.from('notifications').insert([newReminder]);
    if (!error) {
      setShowReminderForTaskId(null);
      loadReminders();
    }
  };

  const handleCancelReminder = async (taskId: string) => {
    if (!user) return;
    const { data: existingNotifs } = await supabase
      .from('notifications')
      .select('id, payload')
      .eq('user_id', user.id)
      .eq('status', 'scheduled');
    
    const notifToDelete = (existingNotifs ?? []).find(n => n.payload?.task_id === taskId);
    if (notifToDelete) {
      await supabase.from('notifications').delete().eq('id', notifToDelete.id);
    }
    loadReminders();
  };

  // Helper to compute and update goal progress when tasks change
  const updateGoalProgress = async (goalId: string) => {
    const { data: goalTasks } = await supabase.from('tasks').select('*').eq('goal_id', goalId);
    if (goalTasks) {
      const total = goalTasks.length;
      if (total === 0) return;
      const completed = goalTasks.filter((t: any) => t.completed).length;
      const percent = Math.round((completed / total) * 100);
      
      await supabase.from('goals').update({ progress_percent: percent }).eq('id', goalId);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>Today's Tasks</h3>
        <button 
          className="btn btn-primary btn-icon"
          onClick={() => setIsAdding(!isAdding)}
          style={{ width: '32px', height: '32px', borderRadius: '50%', marginLeft: 'auto' }}
        >
          <Plus size={16} />
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddTask} className="glass-panel" style={{
          padding: '20px', 
          marginBottom: '20px', 
          border: '1px dashed var(--border-color)',
          animation: 'slideUp 0.2s ease'
        }}>
          <div className="input-group" style={{ marginBottom: '12px' }}>
            <input 
              type="text" 
              className="input" 
              placeholder="What needs to be done?" 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="label" style={{ fontSize: '0.75rem' }}>Link to Goal</label>
              <select 
                className="select" 
                value={selectedGoalId} 
                onChange={e => setSelectedGoalId(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              >
                <option value="">None (General Task)</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>

            <div style={{ width: '150px' }}>
              <label className="label" style={{ fontSize: '0.75rem' }}>Due Date</label>
              <input 
                type="date" 
                className="input" 
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              Add Task
            </button>
          </div>
        </form>
      )}

      {tasks.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px', 
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--border-radius-sm)'
        }}>
          <CheckCircleIcon size={32} />
          <p style={{ fontSize: '0.95rem' }}>Your checklist is clean. Enjoy the flow!</p>
          <button className="btn btn-secondary" onClick={() => setIsAdding(true)} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            Add your first task
          </button>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
          {tasks.map(t => {
            const goal = goals.find(g => g.id === t.goal_id);
            const hasReminder = !!scheduledReminders[t.id];
            return (
              <li key={t.id} className="glass-panel" style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderLeft: t.completed ? '4px solid var(--success-color)' : '4px solid var(--primary-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <label className="checkbox-container">
                      <input 
                        type="checkbox" 
                        checked={t.completed} 
                        onChange={() => handleToggleTask(t)}
                      />
                      <span className="checkmark"></span>
                    </label>
                    
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ 
                        textDecoration: t.completed ? 'line-through' : 'none',
                        color: t.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                        fontWeight: 500,
                        fontSize: '0.95rem'
                      }}>{t.title}</span>
                      
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {goal && (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--accent-color)',
                            backgroundColor: 'var(--accent-glow)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Target size={10} />
                            {goal.title}
                          </span>
                        )}
                        {t.due_date && (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Calendar size={10} />
                            {t.due_date}
                          </span>
                        )}
                        {hasReminder && (
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--primary-color)',
                            backgroundColor: 'var(--primary-glow)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Clock size={10} />
                            Reminder: {new Date(scheduledReminders[t.id]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-secondary btn-icon" 
                      onClick={() => {
                        if (showReminderForTaskId === t.id) {
                          setShowReminderForTaskId(null);
                        } else {
                          setShowReminderForTaskId(t.id);
                          const baseDate = t.due_date ? new Date(t.due_date) : new Date();
                          if (t.due_date) {
                            baseDate.setHours(9, 0, 0, 0);
                          } else {
                            baseDate.setHours(baseDate.getHours() + 1, 0, 0, 0);
                          }
                          const tzOffset = baseDate.getTimezoneOffset() * 60000;
                          const localISODate = new Date(baseDate.getTime() - tzOffset).toISOString().slice(0, 16);
                          setReminderDateTime(localISODate);
                        }
                      }}
                      title={hasReminder ? "Edit Reminder" : "Set Reminder"}
                      style={{ 
                        color: hasReminder ? 'var(--primary-color)' : 'var(--text-secondary)', 
                        padding: '6px', 
                        border: 'none',
                        background: hasReminder ? 'var(--primary-glow)' : 'transparent',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Bell size={16} />
                    </button>

                    <button 
                      className="btn btn-secondary btn-icon" 
                      onClick={() => handleDeleteTask(t)}
                      style={{ color: 'var(--error-color)', padding: '6px', border: 'none', width: '32px', height: '32px', borderRadius: '50%' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {showReminderForTaskId === t.id && (
                  <div style={{
                    marginTop: '4px',
                    paddingTop: '12px',
                    borderTop: '1px dashed var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    animation: 'fadeIn 0.2s ease'
                  }}>
                    <label className="label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Set Email Reminder</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="datetime-local" 
                        className="input" 
                        value={reminderDateTime}
                        onChange={e => setReminderDateTime(e.target.value)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', flex: 1 }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={() => handleSetReminder(t)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        Save
                      </button>
                      {hasReminder && (
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => {
                            handleCancelReminder(t.id);
                            setShowReminderForTaskId(null);
                          }}
                          style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--error-color)' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CheckCircleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success-color)' }}>
      <circle cx="12" cy="12" r="10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
