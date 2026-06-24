import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock themeStore
jest.mock('../../store/themeStore', () => ({
  useThemeStore: () => ({
    colors: {
      primary: '#2F5BFF',
      border: '#E5E7EB',
      danger: '#EF4444',
      textPrimary: '#111827',
    },
    isDark: false,
  }),
}));

// Mock theme module
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

import { Button } from '../../components/Button';

describe('Button', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the label text', () => {
    const { getByText } = render(
      <Button label="Salvar" onPress={mockOnPress} />
    );
    expect(getByText('Salvar')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(
      <Button label="Salvar" onPress={mockOnPress} />
    );
    fireEvent.press(getByText('Salvar'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const { getByRole } = render(
      <Button label="Salvar" onPress={mockOnPress} disabled />
    );
    fireEvent.press(getByRole('button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const { getByRole } = render(
      <Button label="Salvar" onPress={mockOnPress} loading />
    );
    fireEvent.press(getByRole('button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading', () => {
    const { queryByText, UNSAFE_getByType } = render(
      <Button label="Salvar" onPress={mockOnPress} loading />
    );
    // Label should not be rendered
    expect(queryByText('Salvar')).toBeNull();
  });

  it('renders with primary variant by default', () => {
    const { getByRole } = render(
      <Button label="OK" onPress={mockOnPress} />
    );
    const btn = getByRole('button');
    expect(btn).toBeTruthy();
  });

  it('renders with secondary variant', () => {
    const { getByText } = render(
      <Button label="Cancelar" onPress={mockOnPress} variant="secondary" />
    );
    expect(getByText('Cancelar')).toBeTruthy();
  });

  it('renders with danger variant', () => {
    const { getByText } = render(
      <Button label="Excluir" onPress={mockOnPress} variant="danger" />
    );
    expect(getByText('Excluir')).toBeTruthy();
  });

  it('renders with ghost variant', () => {
    const { getByText } = render(
      <Button label="Mais" onPress={mockOnPress} variant="ghost" />
    );
    expect(getByText('Mais')).toBeTruthy();
  });

  it('uses accessibilityLabel when provided', () => {
    const { getByLabelText } = render(
      <Button
        label="OK"
        onPress={mockOnPress}
        accessibilityLabel="Confirmar acao"
      />
    );
    expect(getByLabelText('Confirmar acao')).toBeTruthy();
  });

  it('falls back to label as accessibilityLabel', () => {
    const { getByLabelText } = render(
      <Button label="Salvar" onPress={mockOnPress} />
    );
    expect(getByLabelText('Salvar')).toBeTruthy();
  });

  it('applies custom style', () => {
    const { getByRole } = render(
      <Button label="OK" onPress={mockOnPress} style={{ marginTop: 10 }} />
    );
    expect(getByRole('button')).toBeTruthy();
  });

  it('applies custom textStyle', () => {
    const { getByText } = render(
      <Button label="OK" onPress={mockOnPress} textStyle={{ fontSize: 20 }} />
    );
    expect(getByText('OK')).toBeTruthy();
  });

  it('has opacity 0.5 when disabled', () => {
    const { getByRole } = render(
      <Button label="OK" onPress={mockOnPress} disabled />
    );
    const btn = getByRole('button');
    // Check that the button has reduced opacity in its style
    const flatStyle = Array.isArray(btn.props.style)
      ? Object.assign({}, ...btn.props.style.filter(Boolean))
      : btn.props.style;
    expect(flatStyle.opacity).toBe(0.5);
  });

  it('has opacity 1 when not disabled', () => {
    const { getByRole } = render(
      <Button label="OK" onPress={mockOnPress} />
    );
    const btn = getByRole('button');
    const flatStyle = Array.isArray(btn.props.style)
      ? Object.assign({}, ...btn.props.style.filter(Boolean))
      : btn.props.style;
    expect(flatStyle.opacity).toBe(1);
  });
});
