import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../../store/themeStore', () => ({
  useThemeStore: () => ({
    colors: {
      primary: '#2F5BFF',
      surface: '#FFFFFF',
      border: '#E5E7EB',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
    },
    isDark: false,
  }),
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
  shadows: { card: { shadowColor: '#000' } },
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(View, { testID: `icon-${props.name}`, ...props }),
  };
});

import { KpiCard } from '../../components/KpiCard';

describe('KpiCard', () => {
  it('renders title', () => {
    const { getByText } = render(
      <KpiCard title="Tarefas Hoje" value={5} icon="checkmark-circle" />
    );
    expect(getByText('Tarefas Hoje')).toBeTruthy();
  });

  it('renders numeric value', () => {
    const { getByText } = render(
      <KpiCard title="Tarefas" value={10} icon="checkmark-circle" />
    );
    expect(getByText('10')).toBeTruthy();
  });

  it('renders string value', () => {
    const { getByText } = render(
      <KpiCard title="Foco" value="2h30" icon="time-outline" />
    );
    expect(getByText('2h30')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(
      <KpiCard
        title="Alta Prioridade"
        value={3}
        icon="alert-circle"
        subtitle="Atencao"
      />
    );
    expect(getByText('Atencao')).toBeTruthy();
  });

  it('does not render subtitle when not provided', () => {
    const { queryByText } = render(
      <KpiCard title="Tarefas" value={5} icon="checkmark-circle" />
    );
    expect(queryByText('Atencao')).toBeNull();
  });

  it('renders with custom color', () => {
    const { getByText } = render(
      <KpiCard
        title="Perigo"
        value={1}
        icon="warning"
        color="#EF4444"
      />
    );
    expect(getByText('Perigo')).toBeTruthy();
  });

  it('uses primary color by default', () => {
    const { toJSON } = render(
      <KpiCard title="Default" value={0} icon="star" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders the icon wrapper', () => {
    const { toJSON } = render(
      <KpiCard title="Icon test" value={7} icon="flash" />
    );
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });

  it('renders with value 0', () => {
    const { getByText } = render(
      <KpiCard title="Nenhuma" value={0} icon="close-circle" />
    );
    expect(getByText('0')).toBeTruthy();
  });
});
