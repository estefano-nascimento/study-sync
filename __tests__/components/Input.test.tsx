import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../store/themeStore', () => ({
  useThemeStore: () => ({
    colors: {
      surface: '#FFFFFF',
      border: '#E5E7EB',
      danger: '#EF4444',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
    },
    isDark: false,
  }),
}));

jest.mock('../../lib/theme', () => ({
  radii: { sm: 8, md: 12, lg: 16, pill: 9999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  typography: {
    body: { fontSize: 16 },
    caption: { fontSize: 12 },
  },
}));

import { Input } from '../../components/Input';

describe('Input', () => {
  it('renders without label or error', () => {
    const { toJSON } = render(<Input placeholder="Digite aqui" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with a label', () => {
    const { getByText } = render(
      <Input label="E-mail" placeholder="seu@email.com" />
    );
    expect(getByText('E-mail')).toBeTruthy();
  });

  it('does not render label when not provided', () => {
    const { queryByText } = render(<Input placeholder="Sem label" />);
    // No label text should be present
    expect(queryByText('E-mail')).toBeNull();
  });

  it('renders error message', () => {
    const { getByText } = render(
      <Input label="Senha" error="Senha muito curta" />
    );
    expect(getByText('Senha muito curta')).toBeTruthy();
  });

  it('does not render error when not provided', () => {
    const { queryByText } = render(
      <Input label="Nome" />
    );
    expect(queryByText('Senha muito curta')).toBeNull();
  });

  it('handles text changes', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Digite" onChangeText={onChangeText} />
    );
    fireEvent.changeText(getByPlaceholderText('Digite'), 'Teste');
    expect(onChangeText).toHaveBeenCalledWith('Teste');
  });

  it('passes through TextInput props (secureTextEntry)', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Senha" secureTextEntry />
    );
    const input = getByPlaceholderText('Senha');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('passes through TextInput props (keyboardType)', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="E-mail" keyboardType="email-address" />
    );
    const input = getByPlaceholderText('E-mail');
    expect(input.props.keyboardType).toBe('email-address');
  });

  it('applies border color from danger when error exists', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Teste" error="Erro" />
    );
    const input = getByPlaceholderText('Teste');
    const flatStyle = Array.isArray(input.props.style)
      ? Object.assign({}, ...input.props.style.filter(Boolean))
      : input.props.style;
    expect(flatStyle.borderColor).toBe('#EF4444');
  });

  it('applies border color from border when no error', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Teste" />
    );
    const input = getByPlaceholderText('Teste');
    const flatStyle = Array.isArray(input.props.style)
      ? Object.assign({}, ...input.props.style.filter(Boolean))
      : input.props.style;
    expect(flatStyle.borderColor).toBe('#E5E7EB');
  });

  it('applies custom style', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Styled" style={{ height: 60 }} />
    );
    expect(getByPlaceholderText('Styled')).toBeTruthy();
  });

  it('renders with both label and error simultaneously', () => {
    const { getByText } = render(
      <Input label="Campo" error="Obrigatorio" />
    );
    expect(getByText('Campo')).toBeTruthy();
    expect(getByText('Obrigatorio')).toBeTruthy();
  });
});
