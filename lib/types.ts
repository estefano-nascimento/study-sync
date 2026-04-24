export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type SessionType = 'pomodoro' | 'deep_work' | 'review' | 'group';
export type EventType = 'class' | 'exam' | 'meeting' | 'deadline';
export type GroupRole = 'owner' | 'admin' | 'member' | 'viewer';
export type NotificationType =
  | 'task_due'
  | 'task_overdue'
  | 'reschedule_suggestion'
  | 'group_progress'
  | 'member_focus'
  | 'meeting_suggestion'
  | 'task_unlocked';

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email: string;
  course: string | null;
  semester: number | null;
  timezone: string;
  xp: number;
  level: number;
  study_goal_minutes: number;
  pomodoro_duration: number;
  theme: 'light' | 'dark' | 'system';
  last_active_at: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  user_profiles?: UserProfile;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  group_id: string | null;
  user_id: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  criticality_score: number;
  due_date: string | null;
  estimated_minutes: number | null;
  subject_id: string | null;
  group_id: string | null;
  parent_task_id: string | null;
  created_by: string;
  created_at: string;
  subjects?: Subject;
  groups?: Group;
  task_progress?: TaskProgress[];
  task_comments?: TaskComment[];
  study_sessions?: StudySession[];
  task_assignments?: TaskAssignment[];
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  assigned_at: string;
  user_profiles?: UserProfile;
}

export interface TaskProgress {
  id: string;
  task_id: string;
  user_id: string;
  percentage: number;
  time_spent_minutes: number;
  notes: string | null;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_profiles?: UserProfile;
}

export interface StudySession {
  id: string;
  user_id: string;
  task_id: string | null;
  session_type: SessionType;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  focus_score: number | null;
  distractions: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  starts_at: string;
  ends_at: string;
  group_id: string | null;
  created_by: string;
  color: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  action_url: string | null;
  read: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  condition_type: string;
  condition_value: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievements?: Achievement;
}

export interface SmartRescheduleLog {
  id: string;
  task_id: string;
  user_id: string;
  triggered_by: string;
  original_due_date: string;
  new_due_date: string;
  reason: string;
  accepted: boolean;
  created_at: string;
}

export interface UserAvailability {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}
