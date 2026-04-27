import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radii, spacing, typography } from '../../theme/tokens';

export default function MetricGrid({ items = [] }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.label} style={styles.card}>
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    minWidth: '47%',
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(202, 210, 197, 0.54)',
    borderWidth: 1,
    borderColor: 'rgba(82, 121, 111, 0.22)',
  },
  value: {
    ...typography.sectionTitle,
    fontSize: 22,
  },
  label: {
    marginTop: spacing.xs,
    ...typography.eyebrow,
    color: colors.foregroundMuted,
    letterSpacing: 0.8,
  },
});
