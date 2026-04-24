import { create } from 'zustand';
import { Task } from '../lib/types';
import { supabase } from '../lib/supabase';
import { startOfDay, endOfDay } from 'date-fns';

interface TaskState {
  tasks: Task[];
  todayTasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  fetchTodayTasks: () => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  todayTasks: [],
  loading: false,

  fetchTasks: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('tasks')
      .select('*, subjects(name, color), task_progress(percentage)')
      .neq('status', 'done')
      .order('criticality_score', { ascending: false });
    set({ tasks: (data as Task[]) || [], loading: false });
  },

  fetchTodayTasks: async () => {
    const now = new Date();
    const { data } = await supabase
      .from('tasks')
      .select('*, subjects(name, color), task_progress(percentage)')
      .gte('due_date', startOfDay(now).toISOString())
      .lte('due_date', endOfDay(now).toISOString())
      .neq('status', 'done')
      .order('criticality_score', { ascending: false });
    set({ todayTasks: (data as Task[]) || [] });
  },

  updateTaskStatus: async (taskId, status) => {
    await supabase.from('tasks').update({ status }).eq('id', taskId);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
      todayTasks: state.todayTasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    }));
  },
}));
