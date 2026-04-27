import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radii, shadows, spacing, typography } from '../../theme/tokens';

export default function SectionCard({ eyebrow, title, subtitle, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {(eyebrow || title || subtitle) ? (
        <View style={styles.header}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(202, 210, 197, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(82, 121, 111, 0.22)',
    gap: spacing.md,
    ...shadows.card,
  },
  header: {
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
  },
  title: {
    ...typography.sectionTitle,
    fontSize: 20,
  },
  subtitle: {
    ...typography.muted,
  },
});
