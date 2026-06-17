import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/hooks/useAuth';
import { TodayList } from './TodayList';
import { GoalEditorModal } from '../Goal/GoalEditorModal';
import { Target, Award, Plus, Calendar } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [streak, setStreak] = useState(0);

  const loadData = async () => {
    if (!user) return;

    const { data: t } = await supabase.from('tasks').select('*').eq('user_id', user.id);
    const { data: g } = await supabase.from('goals').select('*').eq('user_id', user.id);
    setTasks(t ?? []);
    setGoals(g ?? []);
    calculateStreak(t ?? []);
  };

  const calculateStreak = (allTasks: any[]) => {
    // Simple mock logic for consistency streak: counts number of completed tasks
    const completedCount = allTasks.filter(t => t.completed).length;
    setStreak(completedCount > 0 ? Math.min(completedCount + 2, 7) : 0);
  };

  useEffect(() => {
    if (!user) return;

    loadData();

    const taskSub = supabase.channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadData();
      })
      .subscribe();

    const goalSub = supabase.channel('public:goals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(taskSub);
      supabase.removeChannel(goalSub);
    };
  }, [user?.id]);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Upper overview stats bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Streak card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            color: 'var(--accent-color)',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Award size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Consistency Streak</p>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{streak} Days</h4>
          </div>
        </div>

        {/* Goals Progress Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'var(--primary-glow)',
            color: 'var(--primary-color)',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Target size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Active Goals</p>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {goals.filter(g => g.status === 'active').length} Active
            </h4>
          </div>
        </div>

        {/* Completed tasks Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--success-color)',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Tasks Completed</p>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {tasks.filter(t => t.completed).length} / {tasks.length}
            </h4>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Tasks, Right Goals */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }} className="dashboard-grid">
        <TodayList
          tasks={tasks.filter(t => {
            const today = new Date().toISOString().split('T')[0];
            return !t.due_date || t.due_date === today;
          })}
          goals={goals}
          onReload={loadData}
        />

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Goals Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>Active Goals</h3>
              <button 
                className="btn btn-secondary btn-icon" 
                onClick={() => setShowGoalEditor(true)}
                title="Create new goal"
                style={{ width: '28px', height: '28px', padding: 0 }}
              >
                <Plus size={14} />
              </button>
            </div>

            {goals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '0.9rem', marginBottom: '12px' }}>No goals defined yet.</p>
                <button className="btn btn-secondary" onClick={() => setShowGoalEditor(true)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  Create Goal
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {goals.map(g => (
                  <div key={g.id} className="glass-panel" style={{ 
                    padding: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{g.title}</span>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        fontWeight: '700',
                        color: g.priority === 'high' ? 'var(--error-color)' : g.priority === 'medium' ? 'var(--warning-color)' : 'var(--text-secondary)',
                        backgroundColor: g.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : g.priority === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)'
                      }}>{g.priority}</span>
                    </div>

                    {g.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        {g.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        flex: 1,
                        height: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${g.progress_percent || 0}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--primary-color), var(--success-color))',
                          borderRadius: '4px',
                          transition: 'width var(--transition-normal)'
                        }}></div>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, width: '32px', textAlign: 'right' }}>
                        {g.progress_percent || 0}%
                      </span>
                    </div>

                    {g.deadline && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <Calendar size={12} />
                        <span>Deadline: {g.deadline}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {showGoalEditor && (
        <GoalEditorModal 
          onClose={() => setShowGoalEditor(false)} 
          onSave={loadData}
        />
      )}
    </div>
  );
}
