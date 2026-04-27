const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { resolveAuthContext } = require('../services/accountService');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';

function getAuthToken(req) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return '';
  return token.trim();
}

async function requireAuth(req, res, next) {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const { legacyUser, userAccount } = await resolveAuthContext(payload);
    const user = legacyUser || (payload.userId ? await User.findById(payload.userId) : null);

    if (!user && !userAccount) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    req.auth = payload;
    req.user = user;
    req.userAccount = userAccount;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid session' });
  }
}

module.exports = {
  requireAuth,
  getAuthToken,
};
