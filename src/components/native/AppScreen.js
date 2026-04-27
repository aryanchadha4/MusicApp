import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { radii, shadows, spacing, typography } from '../../theme/tokens';

export default function AppScreen({
  eyebrow,
  title,
  subtitle,
  children,
  scroll = true,
  contentContainerStyle,
  headerAccessory = null,
  refreshControl,
}) {
  const body = (
    <>
      <View style={styles.headerCard}>
        <View style={styles.headerCopy}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {headerAccessory ? <View style={styles.headerAccessory}>{headerAccessory}</View> : null}
      </View>
      {children}
    </>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.staticContent, contentContainerStyle]}>{body}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + 40,
    gap: spacing.lg,
  },
  staticContent: {
    flex: 1,
  },
  headerCard: {
    padding: spacing.lg,
    borderRadius: 24,
    backgroundColor: 'rgba(202, 210, 197, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(82, 121, 111, 0.24)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    ...shadows.card,
  },
  headerCopy: {
    flex: 1,
  },
  headerAccessory: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
  },
  title: {
    ...typography.title,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.muted,
    marginTop: spacing.sm,
  },
});
