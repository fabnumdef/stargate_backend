import {
  DateTimeResolver,
  EmailAddressResolver,
  URLResolver,
} from 'graphql-scalars';
import { Kind, GraphQLError, GraphQLScalarType } from 'graphql';

export const DateTime = DateTimeResolver;
export const EmailAddress = EmailAddressResolver;
export const URL = URLResolver;
// @todo: Add some specific logics
export const ProtocolLessURL = new GraphQLScalarType({
  name: 'ProtocolLessURL',
  description: 'Like URL Scalar, but without scheme',
  serialize(value) {
    return value;
  },
  parseValue: (value) => value,
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as URLs but got a: ${ast.kind}`,
      );
    }
    return ast.value.toString();
  },
});

// @todo: Add some specific logics
export const UUIDV4 = new GraphQLScalarType({
  name: 'UUIDV4',
  description: 'UUID v4 (cryptographic random)',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as URLs but got a: ${ast.kind}`,
      );
    }
    return ast.value.toString();
  },
});
