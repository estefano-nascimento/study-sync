import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Alert, Platform } from 'react-native';
import { TaskPriority, TaskStatus } from './types';

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) return 'Hoje';
  if (isTomorrow(d)) return 'Amanhã';
  return format(d, "d 'de' MMM", { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "d MMM, HH:mm", { locale: ptBR });
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { locale: ptBR, addSuffix: true });
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return isPast(new Date(dueDate));
}

export function priorityLabel(priority: TaskPriority): string {
  const map: Record<TaskPriority, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica',
  };
  return map[priority];
}

export function statusLabel(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    todo: 'A fazer',
    in_progress: 'Em andamento',
    review: 'Revisão',
    done: 'Concluída',
  };
  return map[status];
}

export function greetingByHour(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function timerFormat(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function crossAlert(
  title: string,
  message?: string,
  buttons?: { text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }[],
) {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message || ''}`);
      if (confirmed) {
        const action = buttons.find((b) => b.style !== 'cancel');
        action?.onPress?.();
      }
    } else {
      window.alert(`${title}${message ? `\n\n${message}` : ''}`);
      buttons?.[0]?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}
