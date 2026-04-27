const mongoose = require('mongoose');
const User = require('../models/User');
const UserAccount = require('../models/UserAccount');

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fallbackDisplayName(legacyUser) {
  return (
    String(legacyUser?.name || '').trim() ||
    String(legacyUser?.username || '').trim() ||
    String(legacyUser?.email || '').split('@')[0] ||
    'Listener'
  );
}

async function recoverConflictingUserAccount(legacyUser, normalizedEmail, originalError) {
  let recoveredAccount = await UserAccount.findOne({ legacyUserId: legacyUser._id });

  if (!recoveredAccount && normalizedEmail) {
    recoveredAccount = await UserAccount.findOne({ email: normalizedEmail });
  }

  if (recoveredAccount) {
    let changed = false;

    if (!recoveredAccount.legacyUserId) {
      recoveredAccount.legacyUserId = legacyUser._id;
      changed = true;
    }
    if (!recoveredAccount.displayName) {
      recoveredAccount.displayName = fallbackDisplayName(legacyUser);
      changed = true;
    }
    if (!recoveredAccount.avatarUrl && legacyUser.profilePic) {
      recoveredAccount.avatarUrl = legacyUser.profilePic;
      changed = true;
    }
    if (!recoveredAccount.username && legacyUser.username) {
      recoveredAccount.username = legacyUser.username;
      changed = true;
    }

    if (changed) {
      try {
        await recoveredAccount.save();
      } catch (error) {
        if (error?.code !== 11000) {
          throw error;
        }
      }
    }

    return recoveredAccount;
  }

  throw originalError;
}

async function ensureUserAccountForLegacyUser(legacyUser) {
  if (!legacyUser) return null;

  const normalizedEmail = normalizeEmail(legacyUser.email);
  let account = await UserAccount.findOne({ legacyUserId: legacyUser._id });

  if (!account && normalizedEmail) {
    account = await UserAccount.findOne({ email: normalizedEmail });
  }

  if (!account) {
    account = new UserAccount({
      legacyUserId: legacyUser._id,
      username: legacyUser.username || undefined,
      displayName: fallbackDisplayName(legacyUser),
      email: normalizedEmail,
      avatarUrl: legacyUser.profilePic || '',
      createdAtLegacy: legacyUser.created_at || legacyUser.createdAt || null,
    });

    try {
      await account.save();
      return account;
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
      return recoverConflictingUserAccount(legacyUser, normalizedEmail, error);
    }
  }

  let changed = false;

  if (!account.legacyUserId || String(account.legacyUserId) !== String(legacyUser._id)) {
    account.legacyUserId = legacyUser._id;
    changed = true;
  }
  if (!account.email && normalizedEmail) {
    account.email = normalizedEmail;
    changed = true;
  }
  if (!account.username && legacyUser.username) {
    account.username = legacyUser.username;
    changed = true;
  }
  if (!account.displayName) {
    account.displayName = fallbackDisplayName(legacyUser);
    changed = true;
  }
  if (!account.avatarUrl && legacyUser.profilePic) {
    account.avatarUrl = legacyUser.profilePic;
    changed = true;
  }
  if (!account.createdAtLegacy && (legacyUser.created_at || legacyUser.createdAt)) {
    account.createdAtLegacy = legacyUser.created_at || legacyUser.createdAt;
    changed = true;
  }

  if (changed) {
    try {
      await account.save();
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
      account = await recoverConflictingUserAccount(legacyUser, normalizedEmail, error);
    }
  }

  return account;
}

async function findUserAccountByIdentifier(identifier) {
  const rawIdentifier = String(identifier || '').trim();
  if (!rawIdentifier) return null;

  if (mongoose.Types.ObjectId.isValid(rawIdentifier)) {
    const objectId = new mongoose.Types.ObjectId(rawIdentifier);

    let account = await UserAccount.findById(objectId);
    if (account) return account;

    account = await UserAccount.findOne({ legacyUserId: objectId });
    if (account) return account;

    const legacyUser = await User.findById(objectId);
    if (legacyUser) {
      return ensureUserAccountForLegacyUser(legacyUser);
    }
  }

  const normalizedEmail = normalizeEmail(rawIdentifier);
  if (normalizedEmail.includes('@')) {
    let account = await UserAccount.findOne({ email: normalizedEmail });
    if (account) return account;

    const legacyUser = await User.findOne({ email: normalizedEmail });
    if (legacyUser) {
      return ensureUserAccountForLegacyUser(legacyUser);
    }
  }

  const normalizedUsername = normalizeUsername(rawIdentifier);
  if (normalizedUsername) {
    let account = await UserAccount.findOne({ username: normalizedUsername });
    if (account) return account;

    const usernameRegex = new RegExp(`^${escapeRegex(rawIdentifier)}$`, 'i');
    const legacyUser = await User.findOne({ username: usernameRegex });
    if (legacyUser) {
      return ensureUserAccountForLegacyUser(legacyUser);
    }
  }

  return null;
}

async function searchUserAccountsByQuery(query, options = {}) {
  const rawQuery = String(query || '').trim();
  if (!rawQuery) return [];

  const {
    excludeAccountId = null,
    excludeLegacyUserId = null,
    limit = 20,
  } = options;
  const excludedAccountKey = String(excludeAccountId || '');

  const escapedQuery = escapeRegex(rawQuery);
  const regex = new RegExp(escapedQuery, 'i');

  const accountFilter = {
    $or: [{ username: regex }, { displayName: regex }, { email: regex }],
  };

  if (excludeAccountId && mongoose.Types.ObjectId.isValid(String(excludeAccountId))) {
    accountFilter._id = { $ne: new mongoose.Types.ObjectId(String(excludeAccountId)) };
  }

  const legacyFilter = {
    $or: [{ username: regex }, { name: regex }, { email: regex }],
  };

  if (excludeLegacyUserId && mongoose.Types.ObjectId.isValid(String(excludeLegacyUserId))) {
    legacyFilter._id = { $ne: new mongoose.Types.ObjectId(String(excludeLegacyUserId)) };
  }

  const [accountMatches, legacyMatches] = await Promise.all([
    UserAccount.find(accountFilter)
      .sort({ username: 1, displayName: 1, email: 1 })
      .limit(limit)
      .lean(),
    User.find(legacyFilter)
      .sort({ username: 1, name: 1, email: 1 })
      .limit(limit)
      .select('_id username name email profilePic created_at createdAt'),
  ]);

  const ensuredLegacyAccounts = await Promise.all(
    legacyMatches.map((legacyUser) => ensureUserAccountForLegacyUser(legacyUser))
  );

  const mergedAccounts = new Map();
  [...accountMatches, ...ensuredLegacyAccounts.filter(Boolean)].forEach((account) => {
    const key = String(account?._id || account?.id || '');
    if (!key || mergedAccounts.has(key)) return;
    mergedAccounts.set(key, account);
  });

  return [...mergedAccounts.values()]
    .filter((account) => String(account?._id || account?.id || '') !== excludedAccountKey)
    .sort((left, right) => {
      const leftKey = `${left.username || ''} ${left.displayName || left.name || ''} ${left.email || ''}`;
      const rightKey = `${right.username || ''} ${right.displayName || right.name || ''} ${right.email || ''}`;
      return leftKey.localeCompare(rightKey, undefined, { sensitivity: 'base' });
    })
    .slice(0, limit);
}

async function resolveAuthContext(payload) {
  let legacyUser = null;
  let userAccount = null;
  const normalizedEmail = normalizeEmail(payload?.email);

  if (payload?.accountId) {
    userAccount = await UserAccount.findById(payload.accountId);
  }

  if (!userAccount && payload?.userId) {
    legacyUser = await User.findById(payload.userId);
  }

  if (!userAccount && !legacyUser && payload?.userId) {
    userAccount = await UserAccount.findById(payload.userId);
  }

  if (!legacyUser && normalizedEmail) {
    legacyUser = await User.findOne({ email: normalizedEmail });
  }

  if (legacyUser && !userAccount) {
    userAccount = await ensureUserAccountForLegacyUser(legacyUser);
  }

  if (!userAccount && normalizedEmail) {
    userAccount = await UserAccount.findOne({ email: normalizedEmail });
  }

  if (!legacyUser && userAccount?.legacyUserId) {
    legacyUser = await User.findById(userAccount.legacyUserId);
  }

  return {
    legacyUser,
    userAccount,
  };
}

module.exports = {
  ensureUserAccountForLegacyUser,
  findUserAccountByIdentifier,
  normalizeEmail,
  normalizeUsername,
  resolveAuthContext,
  searchUserAccountsByQuery,
};
