import {
  formatMinutes,
  isOverdue,
  priorityLabel,
  statusLabel,
  timerFormat,
  formatDate,
  formatDateTime,
  greetingByHour,
  crossAlert,
} from '../../lib/utils';
import { Alert, Platform } from 'react-native';

// Ensure Alert.alert is a jest mock
jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

describe('formatMinutes', () => {
  it('returns "0min" for 0 minutes', () => {
    expect(formatMinutes(0)).toBe('0min');
  });

  it('returns "30min" for 30 minutes', () => {
    expect(formatMinutes(30)).toBe('30min');
  });

  it('returns "59min" for 59 minutes', () => {
    expect(formatMinutes(59)).toBe('59min');
  });

  it('returns "1h" for 60 minutes', () => {
    expect(formatMinutes(60)).toBe('1h');
  });

  it('returns "1h 30min" for 90 minutes', () => {
    expect(formatMinutes(90)).toBe('1h 30min');
  });

  it('returns "2h" for 120 minutes', () => {
    expect(formatMinutes(120)).toBe('2h');
  });

  it('returns "2h 15min" for 135 minutes', () => {
    expect(formatMinutes(135)).toBe('2h 15min');
  });
});

describe('isOverdue', () => {
  it('returns false for null', () => {
    expect(isOverdue(null)).toBe(false);
  });

  it('returns false for a future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    expect(isOverdue(future.toISOString())).toBe(false);
  });

  it('returns true for a past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 7);
    expect(isOverdue(past.toISOString())).toBe(true);
  });
});

describe('priorityLabel', () => {
  it('returns "Baixa" for low', () => {
    expect(priorityLabel('low')).toBe('Baixa');
  });

  it('returns "Média" for medium', () => {
    expect(priorityLabel('medium')).toBe('Média');
  });

  it('returns "Alta" for high', () => {
    expect(priorityLabel('high')).toBe('Alta');
  });

  it('returns "Crítica" for critical', () => {
    expect(priorityLabel('critical')).toBe('Crítica');
  });
});

describe('statusLabel', () => {
  it('returns "A fazer" for todo', () => {
    expect(statusLabel('todo')).toBe('A fazer');
  });

  it('returns "Em andamento" for in_progress', () => {
    expect(statusLabel('in_progress')).toBe('Em andamento');
  });

  it('returns "Revisão" for review', () => {
    expect(statusLabel('review')).toBe('Revisão');
  });

  it('returns "Concluída" for done', () => {
    expect(statusLabel('done')).toBe('Concluída');
  });
});

describe('timerFormat', () => {
  it('returns "00:00" for 0 seconds', () => {
    expect(timerFormat(0)).toBe('00:00');
  });

  it('returns "01:01" for 61 seconds', () => {
    expect(timerFormat(61)).toBe('01:01');
  });

  it('returns "59:59" for 3599 seconds', () => {
    expect(timerFormat(3599)).toBe('59:59');
  });

  it('returns "00:09" for 9 seconds', () => {
    expect(timerFormat(9)).toBe('00:09');
  });

  it('returns "10:00" for 600 seconds', () => {
    expect(timerFormat(600)).toBe('10:00');
  });

  it('returns "25:00" for 1500 seconds (pomodoro)', () => {
    expect(timerFormat(1500)).toBe('25:00');
  });
});

describe('formatDate', () => {
  it('returns "Hoje" for today', () => {
    const today = new Date();
    expect(formatDate(today)).toBe('Hoje');
  });

  it('returns "Amanhã" for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(formatDate(tomorrow)).toBe('Amanhã');
  });

  it('returns formatted date for other days', () => {
    // Use a fixed date far enough away to not be today or tomorrow
    const date = new Date(2025, 0, 15); // Jan 15, 2025
    const result = formatDate(date);
    // Should contain "15" and "jan" (Portuguese abbreviation)
    expect(result).toMatch(/15/);
    expect(result.toLowerCase()).toMatch(/jan/);
  });

  it('accepts string dates', () => {
    const result = formatDate('2025-01-15T10:00:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatDateTime', () => {
  it('returns formatted date and time', () => {
    const date = new Date(2025, 2, 10, 14, 30); // Mar 10 2025, 14:30
    const result = formatDateTime(date);
    expect(result).toMatch(/10/);
    expect(result).toMatch(/14:30/);
  });

  it('accepts string dates', () => {
    const result = formatDateTime('2025-06-15T09:00:00');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('greetingByHour', () => {
  it('returns "Bom dia" before noon', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2025, 5, 15, 9, 0, 0));
    expect(greetingByHour()).toBe('Bom dia');
    jest.useRealTimers();
  });

  it('returns "Boa tarde" between noon and 6pm', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2025, 5, 15, 14, 0, 0));
    expect(greetingByHour()).toBe('Boa tarde');
    jest.useRealTimers();
  });

  it('returns "Boa noite" after 6pm', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2025, 5, 15, 20, 0, 0));
    expect(greetingByHour()).toBe('Boa noite');
    jest.useRealTimers();
  });

  it('returns "Bom dia" at midnight', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2025, 5, 15, 0, 0, 0));
    expect(greetingByHour()).toBe('Bom dia');
    jest.useRealTimers();
  });

  it('returns "Boa tarde" at exactly noon', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2025, 5, 15, 12, 0, 0));
    expect(greetingByHour()).toBe('Boa tarde');
    jest.useRealTimers();
  });

  it('returns "Boa noite" at exactly 6pm', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2025, 5, 15, 18, 0, 0));
    expect(greetingByHour()).toBe('Boa noite');
    jest.useRealTimers();
  });
});

describe('crossAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls Alert.alert on native platform', () => {
    (Platform as any).OS = 'ios';
    crossAlert('Title', 'Message');
    expect(Alert.alert).toHaveBeenCalledWith('Title', 'Message', undefined);
  });

  it('calls Alert.alert with buttons on native platform', () => {
    (Platform as any).OS = 'android';
    const buttons = [
      { text: 'Cancel', style: 'cancel' as const },
      { text: 'OK', onPress: jest.fn() },
    ];
    crossAlert('Title', 'Message', buttons);
    expect(Alert.alert).toHaveBeenCalledWith('Title', 'Message', buttons);
  });

  it('calls window.confirm on web with multiple buttons', () => {
    (Platform as any).OS = 'web';
    const onPress = jest.fn();
    const buttons = [
      { text: 'Cancel', style: 'cancel' as const },
      { text: 'Delete', style: 'destructive' as const, onPress },
    ];

    const confirmMock = jest.fn(() => true);
    (globalThis as any).window = { confirm: confirmMock, alert: jest.fn() };

    crossAlert('Delete?', 'Are you sure?', buttons);
    expect(confirmMock).toHaveBeenCalled();
    expect(onPress).toHaveBeenCalled();

    delete (globalThis as any).window;
  });

  it('calls window.alert on web with single or no buttons', () => {
    (Platform as any).OS = 'web';
    const onPress = jest.fn();
    const buttons = [{ text: 'OK', onPress }];

    const alertMock = jest.fn();
    (globalThis as any).window = { alert: alertMock, confirm: jest.fn() };

    crossAlert('Notice', 'Something happened', buttons);
    expect(alertMock).toHaveBeenCalled();
    expect(onPress).toHaveBeenCalled();

    delete (globalThis as any).window;
  });

  it('does not call action when confirm returns false on web', () => {
    (Platform as any).OS = 'web';
    const onPress = jest.fn();
    const buttons = [
      { text: 'Cancel', style: 'cancel' as const },
      { text: 'Confirm', onPress },
    ];

    const confirmMock = jest.fn(() => false);
    (globalThis as any).window = { confirm: confirmMock, alert: jest.fn() };

    crossAlert('Confirm?', 'Proceed?', buttons);
    expect(confirmMock).toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();

    delete (globalThis as any).window;
  });
});
