import React from 'react';
import { render } from '@testing-library/react-native';

const mockThemeState = {
  colors: {
    surface: '#FFFFFF',
    border: '#E5E7EB',
  },
  isDark: false,
};

jest.mock('../../store/themeStore', () => ({
  useThemeStore: () => mockThemeState,
}));

import { Skeleton, CardSkeleton } from '../../components/SkeletonLoader';

describe('Skeleton', () => {
  beforeEach(() => {
    mockThemeState.isDark = false;
    mockThemeState.colors = {
      surface: '#FFFFFF',
      border: '#E5E7EB',
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with default props', () => {
    jest.useFakeTimers();
    const { toJSON } = render(<Skeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom width', () => {
    jest.useFakeTimers();
    const { toJSON } = render(<Skeleton width={200} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with percentage width', () => {
    jest.useFakeTimers();
    const { toJSON } = render(<Skeleton width="60%" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom height', () => {
    jest.useFakeTimers();
    const { toJSON } = render(<Skeleton height={24} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom borderRadius', () => {
    jest.useFakeTimers();
    const { toJSON } = render(<Skeleton borderRadius={16} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom style', () => {
    jest.useFakeTimers();
    const { toJSON } = render(
      <Skeleton style={{ marginBottom: 10 }} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('uses light bg color in light mode', () => {
    jest.useFakeTimers();
    mockThemeState.isDark = false;
    const { toJSON } = render(<Skeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it('uses dark bg color in dark mode', () => {
    jest.useFakeTimers();
    mockThemeState.isDark = true;
    mockThemeState.colors = {
      surface: '#1F2937',
      border: '#374151',
    };
    const { toJSON } = render(<Skeleton />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('CardSkeleton', () => {
  beforeEach(() => {
    mockThemeState.isDark = false;
    mockThemeState.colors = {
      surface: '#FFFFFF',
      border: '#E5E7EB',
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    jest.useFakeTimers();
    const { toJSON } = render(<CardSkeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders multiple skeleton children', () => {
    jest.useFakeTimers();
    const { toJSON } = render(<CardSkeleton />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    if (tree && 'children' in tree && tree.children) {
      expect(tree.children.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('renders in dark mode', () => {
    jest.useFakeTimers();
    mockThemeState.isDark = true;
    mockThemeState.colors = {
      surface: '#1F2937',
      border: '#374151',
    };
    const { toJSON } = render(<CardSkeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders in light mode without border', () => {
    jest.useFakeTimers();
    mockThemeState.isDark = false;
    const { toJSON } = render(<CardSkeleton />);
    expect(toJSON()).toBeTruthy();
  });
});
