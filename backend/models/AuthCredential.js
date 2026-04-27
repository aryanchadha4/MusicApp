const mongoose = require('mongoose');
const { ObjectId, applyStandardJson } = require('./schemaUtils');

const authCredentialSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: 'UserAccount', required: true, index: true },
    provider: {
      type: String,
      enum: ['local', 'apple', 'google'],
      default: 'local',
      required: true,
    },
    loginIdentifier: { type: String, trim: true, lowercase: true, sparse: true },
    providerSubject: { type: String, trim: true, default: '' },
    passwordHash: { type: String, default: '', select: false },
    emailVerifiedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    createdAtLegacy: { type: Date, default: null },
  },
  {
    collection: 'auth_credentials',
    timestamps: true,
  }
);

authCredentialSchema.index({ userId: 1, provider: 1 }, { unique: true });
authCredentialSchema.index(
  { provider: 1, loginIdentifier: 1 },
  {
    unique: true,
    partialFilterExpression: { loginIdentifier: { $type: 'string', $ne: '' } },
  }
);
authCredentialSchema.index(
  { provider: 1, providerSubject: 1 },
  {
    unique: true,
    partialFilterExpression: { providerSubject: { $type: 'string', $ne: '' } },
  }
);

authCredentialSchema.pre('validate', function normalizeCredentialFields(next) {
  if (this.loginIdentifier) {
    this.loginIdentifier = String(this.loginIdentifier).trim().toLowerCase();
  }
  if (this.providerSubject) {
    this.providerSubject = String(this.providerSubject).trim();
  }
  next();
});

applyStandardJson(authCredentialSchema);

module.exports = mongoose.model('AuthCredential', authCredentialSchema);
