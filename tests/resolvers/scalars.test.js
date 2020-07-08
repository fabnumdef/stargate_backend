import { Kind } from 'graphql/language';
import { v4 as uuidv4 } from 'uuid';
import { UUIDV4, ProtocolLessURL } from '../../src/resolvers/scalars';

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
      ).toThrow('Can only validate strings as URLs but got a: BooleanValue');
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
});
