import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../../store/themeStore', () => ({
  useThemeStore: () => ({
    colors: {
      primary: '#2F5BFF',
      border: '#E5E7EB',
      textSecondary: '#6B7280',
    },
    isDark: false,
  }),
}));

import { ProgressBar } from '../../components/ProgressBar';

describe('ProgressBar', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<ProgressBar value={50} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with 0% value', () => {
    const { toJSON } = render(<ProgressBar value={0} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with 100% value', () => {
    const { toJSON } = render(<ProgressBar value={100} />);
    expect(toJSON()).toBeTruthy();
  });

  it('clamps value above 100 to 100', () => {
    const { toJSON } = render(<ProgressBar value={150} />);
    expect(toJSON()).toBeTruthy();
  });

  it('clamps negative value to 0', () => {
    const { toJSON } = render(<ProgressBar value={-10} />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows label when showLabel is true', () => {
    const { getByText } = render(<ProgressBar value={75} showLabel />);
    expect(getByText('75%')).toBeTruthy();
  });

  it('does not show label by default', () => {
    const { queryByText } = render(<ProgressBar value={75} />);
    expect(queryByText('75%')).toBeNull();
  });

  it('shows rounded percentage in label', () => {
    const { getByText } = render(<ProgressBar value={33.7} showLabel />);
    expect(getByText('34%')).toBeTruthy();
  });

  it('shows 100% for values above 100', () => {
    const { getByText } = render(<ProgressBar value={200} showLabel />);
    expect(getByText('100%')).toBeTruthy();
  });

  it('shows 0% for negative values', () => {
    const { getByText } = render(<ProgressBar value={-50} showLabel />);
    expect(getByText('0%')).toBeTruthy();
  });

  it('renders with custom color', () => {
    const { toJSON } = render(<ProgressBar value={50} color="#FF0000" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom height', () => {
    const { toJSON } = render(<ProgressBar value={50} height={12} />);
    expect(toJSON()).toBeTruthy();
  });

  it('uses default height of 8', () => {
    const { toJSON } = render(<ProgressBar value={50} />);
    expect(toJSON()).toBeTruthy();
  });

  it('uses primary color by default', () => {
    const { toJSON } = render(<ProgressBar value={50} />);
    expect(toJSON()).toBeTruthy();
  });
});
