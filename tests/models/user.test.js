import { nanoid } from 'nanoid';
// import '../helpers/configure';
import User, { createDummyUser, generateDummyUser } from './user';
import config from '../../src/services/config';
import { createDummyCampus } from './campus';
import { ROLE_ADMIN } from '../../src/models/rules';

describe('Ensure that original email is valid', () => {
  it('It should fail when domain not exists', async () => {
    const user = new User({
      email: {
        original: 'foo@not-existing-but-whitelisted.local',
      },
    });
    await expect(user.validate()).rejects.toThrow(
      'queryMx ESERVFAIL',
    );
  });

  it('It should fail when email syntax is not validating regex', async () => {
    const user = new User({
      email: {
        original: 'bad-syntax@@localhost',
      },
    });
    await expect(user.validate()).rejects.toThrow(
      'Path `email.original` is invalid',
    );
  });

  it('It should fail when domain is not in whitelist', async () => {
    config.set('mail:whitelist_domains', ['@not-existing-but-whitelisted.local']);
    const user = new User({
      email: {
        original: 'foo@not-whitelisted.local', // localhost will pass MX check, but fail if not whitelisted
      },
    });
    await expect(user.validate()).rejects.toThrow(
      'email.original: "foo@not-whitelisted.local" should ends with @not-existing-but-whitelisted.local',
    );
  });

  it('It should succeed when domain is in whitelist and existing', async () => {
    // Assume that "def.gouv.fr" will exist forever and will have well-defined DNS.
    config.set('mail:whitelist_domains', ['@def.gouv.fr']);
    const user = new User({
      email: {
        original: 'foo@def.gouv.fr',
      },
    });
    await expect(user.validate()).resolves.toBeUndefined();
  });
});

describe('Ensure that original rgpd is valid', () => {
  it('It can be undefined', async () => {
    const baseUser = generateDummyUser();
    const user = new User({
      ...baseUser,
    });
    await expect(user.validate()).resolves.toBeUndefined();
  });

  it('It should not be in future', async () => {
    const baseUser = generateDummyUser();
    const user = new User({
      ...baseUser,
      gprd: new Date(baseUser.createdAt.getTime() + 60 * 60 * 1000 * 5),
    });
    await expect(user.validate()).rejects.toThrow('Validator failed for path `gprd`');
  });
});

describe('Ensure that original password match security criteria', () => {
  it('It should pass when regex is validated', async () => {
    const baseUser = await createDummyUser();
    expect(baseUser).toBeDefined();
  });

  it('It should not pass when regex is not validated', async () => {
    const baseUser = generateDummyUser();
    const user = new User({
      ...baseUser,
      password: nanoid(5),
    });
    await expect(user.save()).rejects.toThrow('Password should match security criteria');
  });
});

describe('Test password comparaison', () => {
  it('It should pass when password match', async () => {
    const password = nanoid();
    const baseUser = await createDummyUser({ password });
    await expect(baseUser.comparePassword(password)).resolves.toBeTruthy();
  });

  it('It should fail when no password set', async () => {
    const baseUser = await createDummyUser({ password: undefined });
    expect(() => baseUser.comparePassword(nanoid())).toThrow('No password set');
  });

  it('It should fail when password don\'t match', async () => {
    const password = nanoid();
    const baseUser = await createDummyUser({ password });
    const badPassword = nanoid();
    await expect(baseUser.comparePassword(badPassword)).resolves.toBeFalsy();
  });
});

describe('Test accessible campuses', () => {
  it('Check empty user don\'t have any accessible campus', async () => {
    await createDummyCampus(); // Ensure that at least one campus exists.
    const baseUser = new User(generateDummyUser());
    await expect(baseUser.getCampusesAccessibles()).resolves.toHaveLength(0);
  });
  it('Check that user with configured right should have accessible campus', async () => {
    const campus = await createDummyCampus(); // Ensure that at least one campus exists.
    const baseUser = new User(generateDummyUser({
      roles: [{
        role: ROLE_ADMIN,
        campuses: [campus],
      }],
    }));
    await expect(baseUser.getCampusesAccessibles()).resolves.toHaveLength(1);
  });
});
