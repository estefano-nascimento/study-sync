import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../../store/themeStore', () => ({
  useThemeStore: () => ({
    colors: {
      primary: '#2F5BFF',
      danger: '#EF4444',
      warning: '#F59E0B',
      success: '#10B981',
      accent: '#8B5CF6',
      border: '#E5E7EB',
      textSecondary: '#6B7280',
    },
    isDark: false,
  }),
}));

jest.mock('../../lib/theme', () => ({
  radii: { sm: 8, md: 12, lg: 16, pill: 9999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
}));

import { StatusChip } from '../../components/StatusChip';

describe('StatusChip', () => {
  it('renders label text', () => {
    const { getByText } = render(<StatusChip label="Critico" />);
    expect(getByText('Critico')).toBeTruthy();
  });

  it('renders with critical variant', () => {
    const { getByText } = render(
      <StatusChip label="Critico" variant="critical" />
    );
    const text = getByText('Critico');
    const flatStyle = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style.filter(Boolean))
      : text.props.style;
    expect(flatStyle.color).toBe('#EF4444');
  });

  it('renders with today variant', () => {
    const { getByText } = render(
      <StatusChip label="Hoje" variant="today" />
    );
    const text = getByText('Hoje');
    const flatStyle = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style.filter(Boolean))
      : text.props.style;
    expect(flatStyle.color).toBe('#2F5BFF');
  });

  it('renders with overdue variant', () => {
    const { getByText } = render(
      <StatusChip label="Atrasado" variant="overdue" />
    );
    const text = getByText('Atrasado');
    const flatStyle = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style.filter(Boolean))
      : text.props.style;
    expect(flatStyle.color).toBe('#F59E0B');
  });

  it('renders with done variant', () => {
    const { getByText } = render(
      <StatusChip label="Concluido" variant="done" />
    );
    const text = getByText('Concluido');
    const flatStyle = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style.filter(Boolean))
      : text.props.style;
    expect(flatStyle.color).toBe('#10B981');
  });

  it('renders with in_progress variant', () => {
    const { getByText } = render(
      <StatusChip label="Em andamento" variant="in_progress" />
    );
    const text = getByText('Em andamento');
    const flatStyle = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style.filter(Boolean))
      : text.props.style;
    expect(flatStyle.color).toBe('#8B5CF6');
  });

  it('renders with default variant', () => {
    const { getByText } = render(
      <StatusChip label="Padrao" variant="default" />
    );
    const text = getByText('Padrao');
    const flatStyle = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style.filter(Boolean))
      : text.props.style;
    expect(flatStyle.color).toBe('#6B7280');
  });

  it('uses default variant when none specified', () => {
    const { getByText } = render(
      <StatusChip label="Sem variante" />
    );
    const text = getByText('Sem variante');
    const flatStyle = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style.filter(Boolean))
      : text.props.style;
    expect(flatStyle.color).toBe('#6B7280');
  });

  it('uses custom color when provided', () => {
    const { getByText } = render(
      <StatusChip label="Custom" color="#FF00FF" />
    );
    const text = getByText('Custom');
    const flatStyle = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style.filter(Boolean))
      : text.props.style;
    expect(flatStyle.color).toBe('#FF00FF');
  });

  it('custom color overrides variant color', () => {
    const { getByText } = render(
      <StatusChip label="Override" variant="critical" color="#00FF00" />
    );
    const text = getByText('Override');
    const flatStyle = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style.filter(Boolean))
      : text.props.style;
    expect(flatStyle.color).toBe('#00FF00');
  });
});
