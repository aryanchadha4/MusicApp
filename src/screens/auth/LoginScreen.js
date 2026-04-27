import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await login(trimmedEmail, password);
      if (!result.success) {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch {
      setError('Login failed. Please try again.');
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
            <Text style={styles.eyebrow}>Welcome back</Text>
            <Text style={styles.title}>Listen diary</Text>
            <Text style={styles.copy}>
              Pick up where you left off and keep tracking the albums and songs shaping your week.
            </Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.foregroundMuted}
                value={email}
                onChangeText={(value) => {
                  if (error) setError('');
                  setEmail(value);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.foregroundMuted}
                value={password}
                onChangeText={(value) => {
                  if (error) setError('');
                  setPassword(value);
                }}
                secureTextEntry
                autoCapitalize="none"
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Logging in...' : 'Log in'}
                </Text>
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>New here? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                  <Text style={styles.footerLink}>Create account</Text>
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
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
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
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
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

export default LoginScreen; 