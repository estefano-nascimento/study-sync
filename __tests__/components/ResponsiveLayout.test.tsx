import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('../../store/themeStore', () => ({
  useThemeStore: () => ({
    colors: {
      background: '#F9FAFB',
      surface: '#FFFFFF',
      border: '#E5E7EB',
    },
    isDark: false,
  }),
}));

// Mock useWindowDimensions at the react-native level
let mockWidth = 375;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: mockWidth, height: 812 }),
}));

import { ResponsiveLayout } from '../../components/ResponsiveLayout';

describe('ResponsiveLayout', () => {
  beforeEach(() => {
    mockWidth = 375;
  });

  it('renders only children on narrow screen (mobile)', () => {
    mockWidth = 375;
    const { getByText, queryByText } = render(
      <ResponsiveLayout sidebar={<Text>Sidebar</Text>}>
        <Text>Conteudo</Text>
      </ResponsiveLayout>
    );
    expect(getByText('Conteudo')).toBeTruthy();
    expect(queryByText('Sidebar')).toBeNull();
  });

  it('renders sidebar + children on wide screen (tablet/desktop)', () => {
    mockWidth = 1024;
    const { getByText } = render(
      <ResponsiveLayout sidebar={<Text>Menu lateral</Text>}>
        <Text>Conteudo principal</Text>
      </ResponsiveLayout>
    );
    expect(getByText('Menu lateral')).toBeTruthy();
    expect(getByText('Conteudo principal')).toBeTruthy();
  });

  it('treats 768px as wide (boundary)', () => {
    mockWidth = 768;
    const { getByText } = render(
      <ResponsiveLayout sidebar={<Text>Sidebar</Text>}>
        <Text>Content</Text>
      </ResponsiveLayout>
    );
    expect(getByText('Sidebar')).toBeTruthy();
    expect(getByText('Content')).toBeTruthy();
  });

  it('treats 767px as narrow (below boundary)', () => {
    mockWidth = 767;
    const { queryByText, getByText } = render(
      <ResponsiveLayout sidebar={<Text>Sidebar</Text>}>
        <Text>Content</Text>
      </ResponsiveLayout>
    );
    expect(getByText('Content')).toBeTruthy();
    expect(queryByText('Sidebar')).toBeNull();
  });

  it('renders on very wide screen', () => {
    mockWidth = 1920;
    const { getByText } = render(
      <ResponsiveLayout sidebar={<Text>Nav</Text>}>
        <Text>Main</Text>
      </ResponsiveLayout>
    );
    expect(getByText('Nav')).toBeTruthy();
    expect(getByText('Main')).toBeTruthy();
  });
});
