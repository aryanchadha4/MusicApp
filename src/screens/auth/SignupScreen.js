import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

const SignupScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signup } = useAuth();

  const handleSignup = async () => {
    const email = form.email.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    setError('');
    setSuccess('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await signup({ email, password });
      if (result.success) {
        setSuccess('Account created. Redirecting to login...');
        setTimeout(() => navigation.navigate('Login'), 900);
      } else {
        setError(result.error || 'Create account failed. Please try again.');
      }
    } catch {
      setError('Create account failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>Create account</Text>
            <Text style={styles.title}>Start your diary</Text>
            <Text style={styles.copy}>
              Create a secure account with your email and password. You can fill in the rest of your profile later.
            </Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.foregroundMuted}
                value={form.email}
                onChangeText={(text) => {
                  if (error) setError('');
                  setForm((current) => ({ ...current, email: text }));
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.foregroundMuted}
                value={form.password}
                onChangeText={(text) => {
                  if (error) setError('');
                  setForm((current) => ({ ...current, password: text }));
                }}
                secureTextEntry
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor={colors.foregroundMuted}
                value={form.confirmPassword}
                onChangeText={(text) => {
                  if (error) setError('');
                  setForm((current) => ({ ...current, confirmPassword: text }));
                }}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.hint}>Use at least 8 characters.</Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {success ? <Text style={styles.successText}>{success}</Text> : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSignup}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creating account...' : 'Create account'}
                </Text>
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Log in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  content: {
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.mist,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 20,
    shadowColor: '#1f2d23',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 12,
    textAlign: 'center',
  },
  copy: {
    fontSize: 15,
    color: colors.foregroundMuted,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 420,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontSize: 16,
  },
  hint: {
    color: colors.foregroundMuted,
    fontSize: 13,
    marginBottom: 15,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginTop: -4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 74, 74, 0.35)',
    backgroundColor: 'rgba(139, 74, 74, 0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  successText: {
    color: colors.accentHover,
    fontSize: 14,
    marginTop: -4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(82, 121, 111, 0.4)',
    backgroundColor: 'rgba(82, 121, 111, 0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: colors.foregroundMuted,
    fontSize: 14,
  },
  footerLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SignupScreen; 