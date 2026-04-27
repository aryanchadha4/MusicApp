import { colors } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 22,
  pill: 999,
};

export const typography = {
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.foreground,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.foreground,
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.foregroundMuted,
  },
};

export const shadows = {
  card: {
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
};

export const surfaces = {
  shell: {
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: 'rgba(202, 210, 197, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(82, 121, 111, 0.22)',
    borderRadius: radii.lg,
  },
  softCard: {
    backgroundColor: 'rgba(202, 210, 197, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(82, 121, 111, 0.18)',
    borderRadius: radii.md,
  },
};
