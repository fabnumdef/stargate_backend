import { nanoid } from 'nanoid';
import { ROLE_ADMIN, ROLE_SUPERADMIN } from '../../src/models/rules';
import { MIDDLE_EARTH, MORDOR } from './campus';

export default async ({ log }) => {
  const superAdminPassword = nanoid();
  const sauronPassword = nanoid();
  const bilboPassword = nanoid();

  log.info(`Super admin password will be ${superAdminPassword}`);
  log.info(`Sauron password will be ${sauronPassword}`);
  log.info(`Bilbo password will be ${bilboPassword}`);

  return [
    {
      firstname: 'Super',
      lastname: 'Admin',
      email: {
        original: 'super.admin@localhost',
      },
      password: superAdminPassword,
      roles: [
        { role: ROLE_SUPERADMIN },
      ],
    },
    {
      firstname: 'Sauron',
      lastname: 'Mordor',
      email: {
        original: 'sauron.mordor@localhost',
      },
      password: sauronPassword,
      roles: [
        { role: ROLE_ADMIN, campuses: [MORDOR] },
      ],
    },
    {
      firstname: 'Bilbo',
      lastname: 'Hobbit',
      email: {
        original: 'bilbo.hobbit@localhost',
      },
      password: bilboPassword,
      roles: [
        { role: ROLE_ADMIN, campuses: [MIDDLE_EARTH] },
      ],
    },
  ];
};
