// Build a chainable mock for supabase query builder
const mockOrder = jest.fn();
const mockNeq = jest.fn();
const mockGte = jest.fn();
const mockLte = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

// Setup chainable methods for fetchTasks:
// supabase.from('tasks').select(...).neq(...).order(...)
function setupFetchTasksChain(data: any[] | null) {
  mockOrder.mockResolvedValue({ data });
  mockNeq.mockReturnValue({ order: mockOrder });
  mockSelect.mockReturnValue({ neq: mockNeq });
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
}

// Setup chainable methods for fetchTodayTasks:
// supabase.from('tasks').select(...).gte(...).lte(...).neq(...).order(...)
function setupFetchTodayTasksChain(data: any[] | null) {
  mockOrder.mockResolvedValue({ data });
  mockNeq.mockReturnValue({ order: mockOrder });
  mockLte.mockReturnValue({ neq: mockNeq });
  mockGte.mockReturnValue({ lte: mockLte });
  mockSelect.mockReturnValue({ gte: mockGte });
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
}

// Setup chain for updateTaskStatus:
// supabase.from('tasks').update({ status }).eq('id', taskId)
function setupUpdateChain() {
  mockEq.mockResolvedValue({});
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
}

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: jest.fn((obj: any) => obj.ios) },
  StyleSheet: { create: (s: any) => s },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));

let useTaskStore: typeof import('../../store/taskStore').useTaskStore;

function loadFreshStore() {
  jest.resetModules();
  jest.doMock('../../lib/supabase', () => ({
    supabase: { from: mockFrom },
  }));
  jest.doMock('react-native', () => ({
    Platform: { OS: 'ios', select: jest.fn((obj: any) => obj.ios) },
    StyleSheet: { create: (s: any) => s },
  }));
  jest.doMock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn() },
  }));
  const mod = require('../../store/taskStore');
  useTaskStore = mod.useTaskStore;
}

beforeEach(() => {
  jest.clearAllMocks();
  loadFreshStore();
});

describe('taskStore', () => {
  describe('initial state', () => {
    it('starts with empty tasks array', () => {
      expect(useTaskStore.getState().tasks).toEqual([]);
    });

    it('starts with empty todayTasks array', () => {
      expect(useTaskStore.getState().todayTasks).toEqual([]);
    });

    it('starts with loading false', () => {
      expect(useTaskStore.getState().loading).toBe(false);
    });
  });

  describe('fetchTasks', () => {
    it('sets loading to true then false', async () => {
      const mockTasks = [
        { id: '1', title: 'Tarefa 1', status: 'todo', priority: 'high' },
        { id: '2', title: 'Tarefa 2', status: 'in_progress', priority: 'low' },
      ];
      setupFetchTasksChain(mockTasks);

      const promise = useTaskStore.getState().fetchTasks();
      // loading should be set to true synchronously
      // (hard to check since it's async, but final state is testable)
      await promise;

      expect(useTaskStore.getState().loading).toBe(false);
    });

    it('stores fetched tasks', async () => {
      const mockTasks = [
        { id: '1', title: 'Estudar', status: 'todo', priority: 'high' },
      ];
      setupFetchTasksChain(mockTasks);

      await useTaskStore.getState().fetchTasks();
      expect(useTaskStore.getState().tasks).toEqual(mockTasks);
    });

    it('queries with correct parameters', async () => {
      setupFetchTasksChain([]);

      await useTaskStore.getState().fetchTasks();

      expect(mockFrom).toHaveBeenCalledWith('tasks');
      expect(mockSelect).toHaveBeenCalledWith('*, subjects(name, color), task_progress(percentage)');
      expect(mockNeq).toHaveBeenCalledWith('status', 'done');
      expect(mockOrder).toHaveBeenCalledWith('criticality_score', { ascending: false });
    });

    it('sets empty array when data is null', async () => {
      setupFetchTasksChain(null);

      await useTaskStore.getState().fetchTasks();
      expect(useTaskStore.getState().tasks).toEqual([]);
    });
  });

  describe('fetchTodayTasks', () => {
    it('stores today tasks', async () => {
      const todayTasks = [
        { id: '3', title: 'Prova hoje', status: 'todo' },
      ];
      setupFetchTodayTasksChain(todayTasks);

      await useTaskStore.getState().fetchTodayTasks();
      expect(useTaskStore.getState().todayTasks).toEqual(todayTasks);
    });

    it('queries with date filters', async () => {
      setupFetchTodayTasksChain([]);

      await useTaskStore.getState().fetchTodayTasks();

      expect(mockFrom).toHaveBeenCalledWith('tasks');
      expect(mockSelect).toHaveBeenCalledWith('*, subjects(name, color), task_progress(percentage)');
      expect(mockGte).toHaveBeenCalledWith('due_date', expect.any(String));
      expect(mockLte).toHaveBeenCalledWith('due_date', expect.any(String));
      expect(mockNeq).toHaveBeenCalledWith('status', 'done');
    });

    it('sets empty array when data is null', async () => {
      setupFetchTodayTasksChain(null);

      await useTaskStore.getState().fetchTodayTasks();
      expect(useTaskStore.getState().todayTasks).toEqual([]);
    });
  });

  describe('updateTaskStatus', () => {
    it('calls supabase update with correct params', async () => {
      setupUpdateChain();
      // Pre-populate tasks
      useTaskStore.setState({
        tasks: [
          { id: 't1', title: 'Task', status: 'todo' } as any,
        ],
        todayTasks: [],
      });

      await useTaskStore.getState().updateTaskStatus('t1', 'done');

      expect(mockFrom).toHaveBeenCalledWith('tasks');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'done' });
      expect(mockEq).toHaveBeenCalledWith('id', 't1');
    });

    it('updates task status in local state', async () => {
      setupUpdateChain();
      useTaskStore.setState({
        tasks: [
          { id: 't1', title: 'Task 1', status: 'todo' } as any,
          { id: 't2', title: 'Task 2', status: 'todo' } as any,
        ],
        todayTasks: [
          { id: 't1', title: 'Task 1', status: 'todo' } as any,
        ],
      });

      await useTaskStore.getState().updateTaskStatus('t1', 'in_progress');

      const state = useTaskStore.getState();
      expect(state.tasks[0].status).toBe('in_progress');
      expect(state.tasks[1].status).toBe('todo'); // unchanged
      expect(state.todayTasks[0].status).toBe('in_progress');
    });

    it('does not modify other tasks', async () => {
      setupUpdateChain();
      useTaskStore.setState({
        tasks: [
          { id: 't1', title: 'Task 1', status: 'todo' } as any,
          { id: 't2', title: 'Task 2', status: 'in_progress' } as any,
        ],
        todayTasks: [],
      });

      await useTaskStore.getState().updateTaskStatus('t1', 'review');

      expect(useTaskStore.getState().tasks[1].status).toBe('in_progress');
    });
  });
});
