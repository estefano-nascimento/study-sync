import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../store/themeStore', () => ({
  useThemeStore: () => ({
    colors: {
      primary: '#2F5BFF',
      border: '#E5E7EB',
      danger: '#EF4444',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      surface: '#FFFFFF',
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

import { EmptyState } from '../../components/EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    const { getByText } = render(
      <EmptyState title="Nenhuma tarefa" />
    );
    expect(getByText('Nenhuma tarefa')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(
      <EmptyState title="Vazio" subtitle="Crie uma nova tarefa" />
    );
    expect(getByText('Crie uma nova tarefa')).toBeTruthy();
  });

  it('does not render subtitle when not provided', () => {
    const { queryByText } = render(
      <EmptyState title="Vazio" />
    );
    expect(queryByText('Crie uma nova tarefa')).toBeNull();
  });

  it('renders action button when actionLabel and onAction are provided', () => {
    const mockAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="Vazio"
        actionLabel="Criar tarefa"
        onAction={mockAction}
      />
    );
    expect(getByText('Criar tarefa')).toBeTruthy();
  });

  it('calls onAction when button is pressed', () => {
    const mockAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="Vazio"
        actionLabel="Criar"
        onAction={mockAction}
      />
    );
    fireEvent.press(getByText('Criar'));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('does not render button when actionLabel is missing', () => {
    const mockAction = jest.fn();
    const { queryByText } = render(
      <EmptyState title="Vazio" onAction={mockAction} />
    );
    expect(queryByText('Criar')).toBeNull();
  });

  it('does not render button when onAction is missing', () => {
    const { queryByText } = render(
      <EmptyState title="Vazio" actionLabel="Criar" />
    );
    // The Button should not render since onAction is undefined
    // (both actionLabel AND onAction must be present)
    expect(queryByText('Criar')).toBeNull();
  });

  it('renders with custom icon', () => {
    const { toJSON } = render(
      <EmptyState title="Sem resultados" icon="search-outline" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with default icon (folder-open-outline)', () => {
    const { toJSON } = render(
      <EmptyState title="Vazio" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders all props together', () => {
    const mockAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="Nenhuma tarefa"
        subtitle="Comece adicionando uma"
        actionLabel="Nova tarefa"
        onAction={mockAction}
        icon="add-circle-outline"
      />
    );
    expect(getByText('Nenhuma tarefa')).toBeTruthy();
    expect(getByText('Comece adicionando uma')).toBeTruthy();
    expect(getByText('Nova tarefa')).toBeTruthy();
  });
});
