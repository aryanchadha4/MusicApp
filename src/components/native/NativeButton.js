import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/tokens';

export default function NativeButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        (disabled || loading) && styles.disabled,
        pressed && !(disabled || loading) ? styles.pressed : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'secondary' || variant === 'ghost' ? colors.foreground : colors.mist} />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'secondary' && styles.secondaryText,
            variant === 'ghost' && styles.ghostText,
            variant === 'danger' && styles.dangerText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  secondary: {
    backgroundColor: 'rgba(82, 121, 111, 0.2)',
  },
  ghost: {
    backgroundColor: 'rgba(202, 210, 197, 0.72)',
  },
  danger: {
    backgroundColor: 'rgba(139, 74, 74, 0.12)',
    borderColor: 'rgba(139, 74, 74, 0.28)',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    color: colors.mist,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryText: {
    color: colors.foreground,
  },
  ghostText: {
    color: colors.accent,
  },
  dangerText: {
    color: colors.danger,
  },
});
