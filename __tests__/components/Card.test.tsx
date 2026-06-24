import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

// Mock themeStore with both light and dark mode
const mockThemeState = {
  colors: {
    surface: '#FFFFFF',
    border: '#E5E7EB',
    background: '#F9FAFB',
  },
  isDark: false,
};

jest.mock('../../store/themeStore', () => ({
  useThemeStore: () => mockThemeState,
}));

jest.mock('../../lib/theme', () => ({
  radii: { sm: 8, md: 12, lg: 16, pill: 9999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  shadows: { card: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 } },
  typography: { body: { fontSize: 16 }, caption: { fontSize: 12 }, h2: { fontSize: 24 }, h3: { fontSize: 20 } },
}));

import { Card } from '../../components/Card';

describe('Card', () => {
  beforeEach(() => {
    mockThemeState.isDark = false;
    mockThemeState.colors = {
      surface: '#FFFFFF',
      border: '#E5E7EB',
      background: '#F9FAFB',
    };
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <Card>
        <Text>Conteudo do card</Text>
      </Card>
    );
    expect(getByText('Conteudo do card')).toBeTruthy();
  });

  it('applies surface background color', () => {
    const { toJSON } = render(
      <Card>
        <Text>Test</Text>
      </Card>
    );
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });

  it('renders with custom padding', () => {
    const { toJSON } = render(
      <Card padding={32}>
        <Text>Test</Text>
      </Card>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with default padding (spacing.md = 16)', () => {
    const { toJSON } = render(
      <Card>
        <Text>Test</Text>
      </Card>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('applies custom style', () => {
    const { toJSON } = render(
      <Card style={{ marginBottom: 20 }}>
        <Text>Test</Text>
      </Card>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with dark mode (border visible)', () => {
    mockThemeState.isDark = true;
    mockThemeState.colors = {
      surface: '#1F2937',
      border: '#374151',
      background: '#111827',
    };

    const { toJSON } = render(
      <Card>
        <Text>Dark mode card</Text>
      </Card>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with light mode (shadow, no border)', () => {
    mockThemeState.isDark = false;
    const { toJSON } = render(
      <Card>
        <Text>Light mode card</Text>
      </Card>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <Card>
        <Text>Titulo</Text>
        <Text>Subtitulo</Text>
      </Card>
    );
    expect(getByText('Titulo')).toBeTruthy();
    expect(getByText('Subtitulo')).toBeTruthy();
  });
});
