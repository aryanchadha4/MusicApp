import { useCallback, useEffect, useState } from 'react';
import { profileClient } from '../../lib/api';

export function useProfileResource({ id, email, enabled = true }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!enabled || (!id && !email)) {
      setProfile(null);
      setLoading(false);
      setError('');
      return null;
    }

    setLoading(true);
    setError('');

    try {
      const nextProfile = id
        ? await profileClient.getProfileById(id)
        : await profileClient.getProfileByEmail(email);
      setProfile(nextProfile);
      return nextProfile;
    } catch (err) {
      setProfile(null);
      setError(err.message || 'Failed to load profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, [email, enabled, id]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    profile,
    setProfile,
    loading,
    error,
    reload: load,
  };
}
