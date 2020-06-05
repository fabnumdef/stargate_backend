import { nanoid } from 'nanoid';
import {
  ROLE_ADMIN,
  ROLE_SUPERADMIN,
  ROLE_UNIT_CORRESPONDENT,
  ROLE_ACCESS_OFFICE,
  ROLE_SCREENING,
  ROLE_SECURITY_OFFICER,
} from '../../src/models/rules';
import { MIDDLE_EARTH, MORDOR } from './campus';
import { DWARFS } from './unit';

export default async ({ log }) => {
  const superAdminPassword = nanoid();
  const sauronPassword = nanoid();
  const bilboPassword = nanoid();
  const gimliPassword = nanoid();

  log.info(`Super admin password will be ${superAdminPassword}`);
  log.info(`Sauron password will be ${sauronPassword}`);
  log.info(`Bilbo password will be ${bilboPassword}`);
  log.info(`Gimli password will be ${gimliPassword}`);

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
    {
      firstname: 'Gimli',
      lastname: 'Beard',
      email: {
        original: 'gimli@localhost',
      },
      password: gimliPassword,
      roles: [
        { role: ROLE_ADMIN, units: [DWARFS], campuses: [MIDDLE_EARTH] },
        { role: ROLE_SECURITY_OFFICER, units: [DWARFS], campuses: [MIDDLE_EARTH] },
        { role: ROLE_UNIT_CORRESPONDENT, units: [DWARFS], campuses: [MIDDLE_EARTH] },
        { role: ROLE_ACCESS_OFFICE, units: [DWARFS], campuses: [MIDDLE_EARTH] },
        { role: ROLE_SCREENING, units: [DWARFS], campuses: [MIDDLE_EARTH] },
      ],
    },
  ];
};
