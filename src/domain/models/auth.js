export function buildAuthUser(source) {
  if (!source) return null;

  return {
    id: String(source.id || source._id || ''),
    username: String(source.username || ''),
    email: String(source.email || ''),
  };
}

export function hasAuthUser(user) {
  return Boolean(user?.id && user?.email);
}
