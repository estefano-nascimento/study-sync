import {
  lightColors,
  darkColors,
  typography,
  spacing,
  radii,
  shadows,
} from '../../lib/theme';

describe('lightColors', () => {
  it('defines all required color keys', () => {
    expect(lightColors).toHaveProperty('background');
    expect(lightColors).toHaveProperty('surface');
    expect(lightColors).toHaveProperty('primary');
    expect(lightColors).toHaveProperty('accent');
    expect(lightColors).toHaveProperty('textPrimary');
    expect(lightColors).toHaveProperty('textSecondary');
    expect(lightColors).toHaveProperty('success');
    expect(lightColors).toHaveProperty('warning');
    expect(lightColors).toHaveProperty('danger');
    expect(lightColors).toHaveProperty('border');
  });

  it('has correct hex color values', () => {
    expect(lightColors.background).toBe('#F7F9FC');
    expect(lightColors.surface).toBe('#FFFFFF');
    expect(lightColors.primary).toBe('#2F5BFF');
    expect(lightColors.accent).toBe('#19C2C9');
    expect(lightColors.textPrimary).toBe('#1E2430');
    expect(lightColors.textSecondary).toBe('#667085');
    expect(lightColors.success).toBe('#22C55E');
    expect(lightColors.warning).toBe('#F59E0B');
    expect(lightColors.danger).toBe('#EF4444');
    expect(lightColors.border).toBe('#E5E7EB');
  });

  it('has all values as strings', () => {
    Object.values(lightColors).forEach((value) => {
      expect(typeof value).toBe('string');
    });
  });

  it('has all values as valid hex colors', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    Object.values(lightColors).forEach((value) => {
      expect(value).toMatch(hexRegex);
    });
  });
});

describe('darkColors', () => {
  it('defines all required color keys', () => {
    expect(darkColors).toHaveProperty('background');
    expect(darkColors).toHaveProperty('surface');
    expect(darkColors).toHaveProperty('primary');
    expect(darkColors).toHaveProperty('accent');
    expect(darkColors).toHaveProperty('textPrimary');
    expect(darkColors).toHaveProperty('textSecondary');
    expect(darkColors).toHaveProperty('success');
    expect(darkColors).toHaveProperty('warning');
    expect(darkColors).toHaveProperty('danger');
    expect(darkColors).toHaveProperty('border');
  });

  it('has correct hex color values', () => {
    expect(darkColors.background).toBe('#0F172A');
    expect(darkColors.surface).toBe('#1E293B');
    expect(darkColors.primary).toBe('#5B8CFF');
    expect(darkColors.accent).toBe('#22D3EE');
    expect(darkColors.textPrimary).toBe('#E5E7EB');
    expect(darkColors.textSecondary).toBe('#94A3B8');
    expect(darkColors.success).toBe('#4ADE80');
    expect(darkColors.warning).toBe('#FBBF24');
    expect(darkColors.danger).toBe('#F87171');
    expect(darkColors.border).toBe('#334155');
  });

  it('has all values as valid hex colors', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    Object.values(darkColors).forEach((value) => {
      expect(value).toMatch(hexRegex);
    });
  });

  it('has the same keys as lightColors', () => {
    const lightKeys = Object.keys(lightColors).sort();
    const darkKeys = Object.keys(darkColors).sort();
    expect(darkKeys).toEqual(lightKeys);
  });
});

describe('typography', () => {
  it('defines all heading and body styles', () => {
    expect(typography).toHaveProperty('h1');
    expect(typography).toHaveProperty('h2');
    expect(typography).toHaveProperty('h3');
    expect(typography).toHaveProperty('body');
    expect(typography).toHaveProperty('caption');
    expect(typography).toHaveProperty('timer');
  });

  it('has correct h1 values', () => {
    expect(typography.h1.fontSize).toBe(28);
    expect(typography.h1.fontWeight).toBe('700');
  });

  it('has correct h2 values', () => {
    expect(typography.h2.fontSize).toBe(22);
    expect(typography.h2.fontWeight).toBe('600');
  });

  it('has correct h3 values', () => {
    expect(typography.h3.fontSize).toBe(18);
    expect(typography.h3.fontWeight).toBe('600');
  });

  it('has correct body values', () => {
    expect(typography.body.fontSize).toBe(16);
    expect(typography.body.fontWeight).toBe('400');
  });

  it('has correct caption values', () => {
    expect(typography.caption.fontSize).toBe(13);
    expect(typography.caption.fontWeight).toBe('400');
  });

  it('has correct timer values', () => {
    expect(typography.timer.fontSize).toBe(72);
    expect(typography.timer.fontWeight).toBe('700');
  });

  it('headings have larger font size than body', () => {
    expect(typography.h1.fontSize).toBeGreaterThan(typography.body.fontSize);
    expect(typography.h2.fontSize).toBeGreaterThan(typography.body.fontSize);
    expect(typography.h3.fontSize).toBeGreaterThan(typography.body.fontSize);
  });

  it('caption is smaller than body', () => {
    expect(typography.caption.fontSize).toBeLessThan(typography.body.fontSize);
  });

  it('heading sizes are in descending order', () => {
    expect(typography.h1.fontSize).toBeGreaterThan(typography.h2.fontSize);
    expect(typography.h2.fontSize).toBeGreaterThan(typography.h3.fontSize);
  });
});

describe('spacing', () => {
  it('defines all spacing levels', () => {
    expect(spacing).toHaveProperty('xs');
    expect(spacing).toHaveProperty('sm');
    expect(spacing).toHaveProperty('md');
    expect(spacing).toHaveProperty('lg');
    expect(spacing).toHaveProperty('xl');
    expect(spacing).toHaveProperty('xxl');
  });

  it('has correct values', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(16);
    expect(spacing.lg).toBe(24);
    expect(spacing.xl).toBe(32);
    expect(spacing.xxl).toBe(48);
  });

  it('spacing values increase monotonically', () => {
    const values = [spacing.xs, spacing.sm, spacing.md, spacing.lg, spacing.xl, spacing.xxl];
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it('all spacing values are positive numbers', () => {
    Object.values(spacing).forEach((value) => {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });
  });
});

describe('radii', () => {
  it('defines all radius levels', () => {
    expect(radii).toHaveProperty('sm');
    expect(radii).toHaveProperty('md');
    expect(radii).toHaveProperty('lg');
    expect(radii).toHaveProperty('pill');
  });

  it('has correct values', () => {
    expect(radii.sm).toBe(8);
    expect(radii.md).toBe(12);
    expect(radii.lg).toBe(16);
    expect(radii.pill).toBe(999);
  });

  it('sm < md < lg < pill', () => {
    expect(radii.sm).toBeLessThan(radii.md);
    expect(radii.md).toBeLessThan(radii.lg);
    expect(radii.lg).toBeLessThan(radii.pill);
  });
});

describe('shadows', () => {
  it('defines card shadow', () => {
    expect(shadows).toHaveProperty('card');
  });

  it('card shadow has all required properties', () => {
    expect(shadows.card).toHaveProperty('shadowColor');
    expect(shadows.card).toHaveProperty('shadowOffset');
    expect(shadows.card).toHaveProperty('shadowOpacity');
    expect(shadows.card).toHaveProperty('shadowRadius');
    expect(shadows.card).toHaveProperty('elevation');
  });

  it('card shadow has correct values', () => {
    expect(shadows.card.shadowColor).toBe('#000');
    expect(shadows.card.shadowOffset).toEqual({ width: 0, height: 2 });
    expect(shadows.card.shadowOpacity).toBe(0.06);
    expect(shadows.card.shadowRadius).toBe(8);
    expect(shadows.card.elevation).toBe(3);
  });
});
