import dns from 'dns';
import util from 'util';
import mongoose from 'mongoose';
import orderBy from 'lodash.orderby';
import chunk from 'lodash.chunk';
import differenceWith from 'lodash/differenceWith';
import isEqual from 'lodash/isEqual';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { normalizeEmail } from 'validator';
import { DateTime } from 'luxon';
import { customAlphabet } from 'nanoid';
import config from '../services/config';
import { sendPasswordResetMail, sendUserCreationMail } from '../services/mail';

const SALT_WORK_FACTOR = 10;
const PASSWORD_TEST = /.{8,}/;
export const MODEL_NAME = 'User';
export const RESET_TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24;
const RESET_TOKEN_ALPHABET = '123456789abcdefghjkmnpqrstuvwxyz';

const resolveDNS = util.promisify(dns.resolve);
const { Schema } = mongoose;

const UserSchema = new Schema({
  firstname: String,
  lastname: String,
  password: {
    type: String,
    canEmit: false,
  },
  passwordExpiration: {
    type: Date,
  },
  email: {
    original: {
      type: String,
      // Non literal to respect max-length
      // eslint-disable-next-line security/detect-non-literal-regexp
      match: new RegExp(
        '^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}'
          + '[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$',
      ),
      required: true,
      maxlength: 256,
      validate: {
        async validator(v) {
          const whitelistedDomains = config.get('mail:whitelist_domains');
          if (![]
            .concat(whitelistedDomains)
            .reduce((acc, cur) => acc || v.endsWith(cur), false)) {
            return false;
          }
          const domain = v.split('@').pop();
          if (domain === 'localhost') {
            return true;
          }
          const addresses = await resolveDNS(domain, 'MX');
          return addresses && addresses.length > 0;
        },
        message({ value }) {
          const whitelistedDomains = config.get('mail:whitelist_domains');
          return `"${value}" should ends with ${whitelistedDomains.join(', ')}`;
        },
      },
    },
    canonical: {
      type: String,
      index: { unique: true },
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
  },
  gprd: {
    type: Date,
    validate: {
      validator(v) {
        return (!this.createdAt || (v >= this.createdAt)) && (v <= new Date());
      },
    },
  },
  roles: [{
    _id: false,
    role: { type: String, required: true },
    userInCharge: Schema.ObjectId,
    campuses: [{
      _id: { type: String, required: true, alias: 'id' },
      label: { type: String, required: true },
    }],
    units: [
      {
        _id: { type: Schema.ObjectId, required: true, alias: 'id' },
        label: { type: String, required: true },
      },
    ],
  }],
  tokens: [
    {
      _id: false,
      token: String,
      email: String,
      attempts: [
        {
          _id: false,
          date: Date,
        },
      ],
      expiration: Date,
    },
  ],
}, { timestamps: true });

UserSchema.pre('validate', function preValidate() {
  if (this.isModified('email.original')) {
    this.email.canonical = normalizeEmail(this.email.original);
  }
});

UserSchema.pre('save', function preSave(next) {
  if (this.isModified('email.canonical')) {
    this.email.confirmed = false;
  }

  if (!this.isModified('password') || !this.password) {
    next();
  }

  this.tokens = this.activeTokens;

  if (!PASSWORD_TEST.test(this.password)) {
    throw new Error('Password should match security criteria');
  }

  bcrypt
    .hash(this.password, SALT_WORK_FACTOR)
    .then((password) => {
      this.password = password;
      if (!this.isModified('passwordExpiration')) {
        this.passwordExpiration = DateTime.local().plus({ months: 4 }).toJSDate();
      }
      next();
    })
    .catch((err) => next(err));
});

UserSchema.virtual('activeTokens')
  .get(function getName() {
    const [firsts = []] = chunk(orderBy(
      this.tokens
        .filter((t) => t.attempts.length < 3 && t.expiration > new Date()),
      ['expiration'],
      ['desc'],
    ), 10);
    return firsts;
  });

UserSchema.methods.hasPasswordExpired = function hasPasswordExpired() {
  return this.passwordExpiration && this.passwordExpiration < new Date();
};
UserSchema.methods.emitJWT = function emitJWT(isRenewable = true) {
  const u = this.toObject();
  u.id = u._id;
  u.isRenewable = isRenewable;
  delete u._id;
  delete u.password;
  return jwt.sign(
    u,
    config.get('token:secret'),
    { expiresIn: parseInt(config.get('token:duration'), 10) },
  );
};

UserSchema.statics.findByEmail = function findByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return this.findOne({ 'email.canonical': normalizedEmail });
};

UserSchema.methods.comparePassword = function comparePassword(password) {
  if (!this.password) {
    throw new Error('No password set');
  }
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.compareResetToken = async function compareResetToken(token, email) {
  const tokenRow = this.activeTokens
    .filter((t) => !!t.email)
    .find((t) => t.email === email);

  if (!tokenRow) {
    return false;
  }

  if (token.toLowerCase() !== tokenRow.token) {
    tokenRow.attempts = tokenRow.attempts || [];
    tokenRow.attempts.push({ date: new Date() });
    await this.save();
    return false;
  }

  this.email.confirmed = true;
  await this.save();

  return true;
};

UserSchema.methods.getCampusesAccessibles = async function getCampusesAccessibles() {
  const campuses = this.roles
    .map((r) => r.campuses)
    .reduce((a, b) => a.concat(b), []);
  const Campus = mongoose.model('Campus');
  return Campus.find({ _id: { $in: campuses.map(({ _id }) => _id) } });
};

UserSchema.methods.diffRoles = function diffRoles(roles = []) {
  const expandRoles = (...array) => array
    .reduce(
      (acc, { role, campuses = [] }) => acc
        .concat(campuses.length > 0 ? campuses.map((campus) => ({ role, campus })) : [{ role }]),
      [],
    )
    .map(({ role, campus }) => ({
      role, campus: !campus ? null : { id: campus.id, name: campus.name },
    }));
  const userRoles = expandRoles(...this.roles.toObject({ virtuals: true }));
  const paramRoles = expandRoles(...roles);
  return {
    revoked: differenceWith(userRoles, paramRoles, isEqual),
    added: differenceWith(paramRoles, userRoles, isEqual),
  };
};

UserSchema.methods.setFromGraphQLSchema = function setFromGraphQLSchema(data) {
  const filteredData = data;
  if (data.email) {
    filteredData.email = {
      original: data.email,
    };
  }

  if (data.password) {
    filteredData.password = data.password;
  }

  if (data.roles) {
    filteredData.roles = {
      role: data.roles.role,
      units: data.roles.unit ? [data.roles.unit] : [],
      campuses: data.roles.campus ? [data.roles.campus] : [],
    };
  }

  this.set(filteredData);
};

UserSchema.methods.addUserRole = async function addUserRole(data) {
  let roles;
  const hasRole = this.roles.find((r) => r.role === data.role);
  if (hasRole) {
    roles = this.roles.toObject().map((r) => {
      if (r.role === data.role) {
        return {
          ...r,
          units: [...r.units, data.unit],
        };
      }
      return r;
    });
  } else {
    roles = [
      ...this.roles,
      {
        role: data.role,
        units: data.unit ? [data.unit] : [],
        campuses: data.campus ? [data.campus] : [],
      },
    ];
  }
  this.set({ roles });
  return this.save();
};

UserSchema.methods.deleteUserRole = async function deleteUserRole(data) {
  let roles;
  const hasManyUnit = data.unit && this.roles.find((r) => r.role === data.role).units.length > 1;
  if (hasManyUnit) {
    roles = this.roles.toObject().map((r) => {
      if (r.role === data.role) {
        return {
          ...r,
          units: r.units.filter((u) => u._id.toString() !== data.unit.id),
        };
      }
      return r;
    });
  } else {
    roles = this.roles.toObject().filter((r) => r.role !== data.role);
  }
  this.set({ roles });
  return this.save();
};

UserSchema.methods.getResetTokenUrl = function getResetTokenUrl(token) {
  const email = encodeURIComponent(this.email.canonical);
  return `${config.get('website_url')}/reset-pass?email=${email}&token=${token}`;
};

UserSchema.methods.sendResetPasswordMail = async function sendResetPasswordMail(token) {
  const resetTokenUrl = this.getResetTokenUrl(token);
  await sendPasswordResetMail(this.email.canonical,
    { data: { token, resetTokenUrl, ...this.toObject({ virtuals: true }) } });
};

UserSchema.methods.sendCreateUserMail = async function sendCreateUserMail(token) {
  const resetTokenUrl = this.getResetTokenUrl(token);
  await sendUserCreationMail(this.email.canonical,
    { data: { token, resetTokenUrl, ...this.toObject({ virtuals: true }) } });
};

UserSchema.methods.generateResetToken = async function generateResetToken({ email = null }) {
  const expiration = new Date();
  expiration.setSeconds(expiration.getSeconds() + RESET_TOKEN_EXPIRATION_SECONDS);
  const nanoidToken = customAlphabet(RESET_TOKEN_ALPHABET, 6);

  const token = {
    expiration,
    email,
    token: nanoidToken(),
  };
  this.tokens.unshift(token);
  return token;
};

export default mongoose.model(MODEL_NAME, UserSchema);
