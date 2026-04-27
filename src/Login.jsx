import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, TextField } from './lib/platform/web/ui';

const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await onLogin?.(email, password);
      if (result && result.success === false) {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card" as="section">
        <p className="auth-eyebrow">Welcome back</p>
        <h2>Log in to your diary</h2>
        <p className="auth-copy">
          Pick up where you left off and keep tracking the albums and songs shaping your week.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Email"
            id="login-email"
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
            id="login-password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />

          {error ? (
            <div className="auth-error" role="alert">
              {error}
            </div>
          ) : null}

          <Button className="auth-submit" variant="primary" block type="submit" loading={loading} disabled={loading}>
            Log in
          </Button>
        </form>

        <p className="auth-footer">
          New here?{' '}
          <Link className="auth-link" to="/signup">
            Create account
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Login;
