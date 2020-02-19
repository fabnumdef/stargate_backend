import mongoose from 'mongoose';
import orderBy from 'lodash/orderBy';
import chunk from 'lodash/chunk';
import differenceWith from 'lodash/differenceWith';
import isEqual from 'lodash/isEqual';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { normalizeEmail }  from 'validator';
import nanoid from 'nanoid/generate';
import {DateTime} from 'luxon';
import config from '../services/config';

const SALT_WORK_FACTOR = 10;
const RESET_TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24;
const RESET_TOKEN_ALPHABET = '123456789abcdefghjkmnpqrstuvwxyz';
const PASSWORD_TEST = /.{8,}/;
export const MODEL_NAME = 'User';

const { Schema } = mongoose;
const whitelistedDomains = config.get('mail:whitelist_domains');

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
      required: true,
      validate: {
        validator(v) {
          return [].concat(whitelistedDomains).reduce((acc, cur) => acc || v.endsWith(cur), false);
        },
        message({ value }) {
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
    }
  },
  gprd: {
    type: Date,
    validate: {
      validator(v) {
        return (!this.createdAt || (v >= this.createdAt)) && (v <= new Date());
      },
    },
  },
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

UserSchema.virtual('name')
  .get(function getName() {
    return `${this.firstname || ''} ${this.lastname || ''}`;
  })
  .set(function setName(name) {
    if (!this.firstname && !this.lastname) {
      [this.firstname, this.lastname = ''] = name.split(' ') || [name];
    }
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
UserSchema.methods.hasPasswordExpired = function() {
  return this.passwordExpiration && this.passwordExpiration < new Date()
}
UserSchema.methods.emitJWT = function emitJWT() {
  const u = this.toObject();
  u.id = u._id;
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
  return this.findOne({'email.canonical': normalizedEmail});
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

  this.email_confirmed = true;
  await this.save();

  return true;
};

UserSchema.methods.confirmEmail = async function confirmEmail(token) {
  const { email } = this;
  const tokenRow = this.activeTokens
    .filter((t) => !!t.email)
    .find((t) => t.email === email);

  if (!tokenRow) {
    return false;
  }

  if (token.toLowerCase() !== tokenRow.token) {
    tokenRow.attempts = tokenRow.attempts || [];
    tokenRow.attempts.push({ date: new Date() });
    return false;
  }

  this.email_confirmed = true;
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

UserSchema.methods.generateResetToken = async function generateResetToken({ email = null, phone = null }) {
  const expiration = new Date();
  expiration.setSeconds(expiration.getSeconds() + RESET_TOKEN_EXPIRATION_SECONDS);
  const token = {
    expiration,
    email,
    phone,
    token: nanoid(RESET_TOKEN_ALPHABET, 6),
  };
  this.tokens.unshift(token);
  return token;
};

UserSchema.methods.setFromGraphQLSchema = function(data) {
  if (data.email) {
    data.email = {
      original: data.email,
    };
  }
  this.set(data);
};

export default mongoose.model(MODEL_NAME, UserSchema);
