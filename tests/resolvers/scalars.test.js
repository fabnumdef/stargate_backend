import { Kind } from 'graphql/language';
import { v4 as uuidv4 } from 'uuid';
import { UUIDV4, ProtocolLessURL, JWT } from '../../src/resolvers/scalars';

describe('Scalars test', () => {
  describe('UUIDV4', () => {
    test('serialize', () => {
      const uuid = uuidv4();
      expect(UUIDV4.serialize(uuid)).toBe(
        uuid,
      );
    });
    test('parseValue', () => {
      const uuid = uuidv4();
      expect(UUIDV4.parseValue(uuid)).toBe(
        uuid,
      );
      expect(
        () => UUIDV4.parseValue(true),
      ).toThrow('Value is not string');
      expect(
        () => UUIDV4.parseValue('FOOBAR'),
      ).toThrow('Value is not a valid');
    });
    test('parseLiteral', () => {
      const uuid = uuidv4();
      expect(
        UUIDV4.parseLiteral(
          { value: uuid, kind: Kind.STRING },
          {},
        ),
      ).toBe(uuid);
      expect(
        () => UUIDV4.parseLiteral(
          { value: true, kind: Kind.BOOLEAN },
          {},
        ),
      ).toThrow('Can only validate strings as UUID but got a: BooleanValue');
    });
  });
  describe('ProtocolLessURL', () => {
    test('serialize', () => {
      const url = '//localhost/foo/bar';
      expect(ProtocolLessURL.serialize(url)).toBe(
        url,
      );
    });
    test('parseValue', () => {
      const url = '//localhost/foo/bar';
      expect(ProtocolLessURL.parseValue(url)).toBe(
        url,
      );
      expect(
        () => ProtocolLessURL.parseValue(true),
      ).toThrow('Value is not string');
      expect(
        () => ProtocolLessURL.parseValue('FOOBAR'),
      ).toThrow('Value is not a valid');
    });
    test('parseLiteral', () => {
      const url = '//localhost/foo/bar';
      expect(
        ProtocolLessURL.parseLiteral(
          { value: url, kind: Kind.STRING },
          {},
        ),
      ).toBe(url);
      expect(
        () => ProtocolLessURL.parseLiteral(
          { value: true, kind: Kind.BOOLEAN },
          {},
        ),
      ).toThrow('Can only validate strings as URLs but got a: BooleanValue');
    });
  });
  describe('JWT', () => {
    const fakeJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.'
        + 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.'
        + 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    test('serialize', () => {
      expect(JWT.serialize(fakeJWT)).toBe(
        fakeJWT,
      );
    });
    test('parseValue', () => {
      expect(JWT.parseValue(fakeJWT)).toBe(
        fakeJWT,
      );
      expect(
        () => JWT.parseValue(true),
      ).toThrow('Value is not string');
      expect(
        () => JWT.parseValue('FOOBAR'),
      ).toThrow('Value is not a valid');
    });
    test('parseLiteral', () => {
      expect(
        JWT.parseLiteral(
          { value: fakeJWT, kind: Kind.STRING },
          {},
        ),
      ).toBe(fakeJWT);
      expect(
        () => JWT.parseLiteral(
          { value: true, kind: Kind.BOOLEAN },
          {},
        ),
      ).toThrow('Can only validate strings as JWT but got a: BooleanValue');
    });
  });
});
