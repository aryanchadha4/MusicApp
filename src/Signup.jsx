import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, TextField } from './lib/platform/web/ui';
import { authClient } from './lib/api';

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (error) {
      setError('');
    }
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      await authClient.signup({ email, password });
      setSuccess('Account created. Redirecting to login...');
      window.setTimeout(() => navigate('/login'), 900);
    } catch (submitError) {
      setError(submitError.message || 'Create account failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card" as="section">
        <p className="auth-eyebrow">Create account</p>
        <h2>Start your diary</h2>
        <p className="auth-copy">
          Create a secure account with your email and password. You can fill in the rest of your profile later.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Email"
            id="signup-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          <TextField
            label="Password"
            id="signup-password"
            name="password"
            type="password"
            placeholder="Create a password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />

          <TextField
            label="Confirm password"
            id="signup-confirm-password"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />

          <p className="auth-hint">Use at least 8 characters.</p>

          {error ? (
            <div className="auth-error" role="alert">
              {error}
            </div>
          ) : null}

          {success ? <div className="auth-success">{success}</div> : null}

          <Button className="auth-submit" variant="primary" block type="submit" loading={loading} disabled={loading}>
            Create account
          </Button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link className="auth-link" to="/login">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Signup;
