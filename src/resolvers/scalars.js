import {
  DateTimeResolver,
  EmailAddressResolver,
  URLResolver,
  ObjectIDResolver,
} from 'graphql-scalars';
import { Kind, GraphQLError, GraphQLScalarType } from 'graphql';

/**
 * Scalar resolver of DateTime
 *
 * @type {GraphQLScalarType}
 */
export const DateTime = DateTimeResolver;

/**
 * Scalar resolver of Email
 *
 * @type {GraphQLScalarType}
 */
export const EmailAddress = EmailAddressResolver;

/**
 * Scalar resolver of URL
 *
 * @type {GraphQLScalarType}
 */
export const URL = URLResolver;

/**
 * Scalar resolver of ObjectID
 *
 * @type {GraphQLScalarType}
 */
export const ObjectID = ObjectIDResolver;

/**
 * This method will return an error if the value is not a string or seems to be a wrong URL
 *
 * @param {any} value value to parse
 * @returns {string} validated value
 */
const validateProtocolLessURL = (value) => {
  const PROTOCOL_LESS_URL_REGEX = /^\/\/[^ "]+$/i;

  if (typeof value !== 'string') {
    throw new TypeError(`Value is not string: ${value}`);
  }

  if (!PROTOCOL_LESS_URL_REGEX.test(value)) {
    throw new TypeError(`Value is not a valid protocol-less URL: ${value}`);
  }

  return value;
};

/**
 * Scalar resolver of Protocol-less URL
 *
 * @type {GraphQLScalarType}
 */
export const ProtocolLessURL = new GraphQLScalarType({
  name: 'ProtocolLessURL',
  description: 'Like URL Scalar, but without scheme part',
  serialize: validateProtocolLessURL,
  parseValue: validateProtocolLessURL,
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as URLs but got a: ${ast.kind}`,
      );
    }
    return validateProtocolLessURL(ast.value);
  },
});

/**
 * This method will return an error if the value is not a string or seems to be a wrong UUIDv4
 *
 * @param {any} value value to parse
 * @returns {string} validated value
 */
const validateUUID = (value) => {
  const UUIDV4_REGEX = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

  if (typeof value !== 'string') {
    throw new TypeError(`Value is not string: ${value}`);
  }

  if (!UUIDV4_REGEX.test(value)) {
    throw new TypeError(`Value is not a valid UUID v4: ${value}`);
  }

  return value;
};

/**
 * Scalar resolver of UUIDv4
 *
 * @type {GraphQLScalarType}
 */
export const UUIDV4 = new GraphQLScalarType({
  name: 'UUIDV4',
  description: 'UUID v4, compliant with RFC 4122 (cryptographic random)',
  serialize: validateUUID,
  parseValue: validateUUID,
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as UUID but got a: ${ast.kind}`,
      );
    }
    return validateUUID(ast.value);
  },
});

/**
 * This method will return an error if the value is not a string or seems to be a wrong JWT
 *
 * @param {any} value value to parse
 * @returns {string} validated value
 */
const validateJWT = (value) => {
  const JWT_REGEX = /^[0-9a-zA-Z+/=_-]+\.[0-9a-zA-Z+/=_-]+\.[0-9a-zA-Z+/=_-]+$/;

  if (typeof value !== 'string') {
    throw new TypeError(`Value is not string: ${value}`);
  }

  if (!JWT_REGEX.test(value)) {
    throw new TypeError(`Value is not a valid JWT : ${value}`);
  }

  return value;
};

/**
 * Scalar resolver of JWT
 *
 * @type {GraphQLScalarType}
 */
export const JWT = new GraphQLScalarType({
  name: 'JWT',
  description: 'A valid JWT is a base64 encoded string. '
      + 'It contain 3 parts of base64 content, separated by dots : header, payload (here user data) and sign.',
  serialize: validateJWT,
  parseValue: validateJWT,
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as JWT but got a: ${ast.kind}`,
      );
    }
    return validateJWT(ast.value);
  },
});
