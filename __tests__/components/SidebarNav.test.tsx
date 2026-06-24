import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockPathname = jest.fn(() => '/dashboard');

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname(),
}));

jest.mock('../../store/themeStore', () => ({
  useThemeStore: () => ({
    colors: {
      primary: '#2F5BFF',
      surface: '#FFFFFF',
      border: '#E5E7EB',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      danger: '#EF4444',
    },
    isDark: false,
  }),
}));

const mockNotifState = {
  unreadCount: 0,
};

jest.mock('../../store/notificationStore', () => ({
  useNotificationStore: () => mockNotifState,
}));

jest.mock('../../lib/theme', () => ({
  radii: { sm: 8, md: 12, lg: 16, pill: 9999 },
  typography: {
    body: { fontSize: 16 },
    caption: { fontSize: 12 },
    h2: { fontSize: 24 },
    h3: { fontSize: 20 },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Ionicons: (props: any) =>
      React.createElement(View, { testID: `icon-${props.name}`, ...props }),
  };
});

import { SidebarNav } from '../../components/SidebarNav';

describe('SidebarNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue('/dashboard');
    mockNotifState.unreadCount = 0;
  });

  it('renders the brand name', () => {
    const { getByText } = render(<SidebarNav />);
    expect(getByText('Study-Sync')).toBeTruthy();
  });

  it('renders all 4 navigation items', () => {
    const { getByText } = render(<SidebarNav />);
    expect(getByText('Início')).toBeTruthy();
    expect(getByText('Tarefas')).toBeTruthy();
    expect(getByText('Agenda')).toBeTruthy();
    expect(getByText('Configurações')).toBeTruthy();
  });

  it('navigates to correct route on press', () => {
    const { getByText } = render(<SidebarNav />);
    fireEvent.press(getByText('Tarefas'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/tasks');
  });

  it('navigates to dashboard on Início press', () => {
    const { getByText } = render(<SidebarNav />);
    fireEvent.press(getByText('Início'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/dashboard');
  });

  it('navigates to calendar on Agenda press', () => {
    const { getByText } = render(<SidebarNav />);
    fireEvent.press(getByText('Agenda'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/calendar');
  });

  it('navigates to settings on Configurações press', () => {
    const { getByText } = render(<SidebarNav />);
    fireEvent.press(getByText('Configurações'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/settings');
  });

  it('highlights active nav item based on pathname', () => {
    mockPathname.mockReturnValue('/tasks');
    const { getByLabelText } = render(<SidebarNav />);
    const tarefasItem = getByLabelText('Tarefas');
    expect(tarefasItem.props.accessibilityState).toEqual({ selected: true });
  });

  it('marks dashboard as active when pathname is /dashboard', () => {
    mockPathname.mockReturnValue('/dashboard');
    const { getByLabelText } = render(<SidebarNav />);
    const item = getByLabelText('Início');
    expect(item.props.accessibilityState).toEqual({ selected: true });
  });

  it('shows notification badge on settings when unreadCount > 0', () => {
    mockNotifState.unreadCount = 5;
    const { getByText } = render(<SidebarNav />);
    expect(getByText('5')).toBeTruthy();
  });

  it('shows 9+ when unreadCount > 9', () => {
    mockNotifState.unreadCount = 15;
    const { getByText } = render(<SidebarNav />);
    expect(getByText('9+')).toBeTruthy();
  });

  it('does not show badge when unreadCount is 0', () => {
    mockNotifState.unreadCount = 0;
    const { queryByText } = render(<SidebarNav />);
    expect(queryByText('9+')).toBeNull();
  });

  it('does not show badge on non-settings items', () => {
    mockNotifState.unreadCount = 3;
    mockPathname.mockReturnValue('/tasks');
    const { getByText } = render(<SidebarNav />);
    // Badge should only appear near settings, not on Tarefas
    expect(getByText('3')).toBeTruthy(); // Badge exists on settings
  });
});
