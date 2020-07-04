import { nanoid } from 'nanoid';
import {
  ROLE_ADMIN,
  ROLE_SUPERADMIN,
  ROLE_UNIT_CORRESPONDENT,
  ROLE_ACCESS_OFFICE,
  ROLE_SCREENING,
  ROLE_SECURITY_OFFICER,
  ROLE_HOST,
} from '../../src/models/rules';
import { MIDDLE_EARTH, MORDOR } from './campus';
import { DWARFS, ENTS } from './unit';

export default async ({ log }) => {
  const superAdminPassword = nanoid();
  const sauronPassword = nanoid();
  const bilboPassword = nanoid();
  const gimliPassword = nanoid();
  const userTestPassword = nanoid();

  log.info(`Super admin password will be ${superAdminPassword}`);
  log.info(`Sauron password will be ${sauronPassword}`);
  log.info(`Bilbo password will be ${bilboPassword}`);
  log.info(`Gimli password will be ${gimliPassword}`);
  // eslint-disable-next-line max-len
  log.info(`Dwarf CorresU, Dwarf OffiS, Dwarf Demandeur, Ent CorresU, Ent Offis, Crib Lage, Bureau Acc password will be ${userTestPassword}`);


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
        { role: ROLE_SECURITY_OFFICER, units: [ENTS], campuses: [MIDDLE_EARTH] },
        { role: ROLE_UNIT_CORRESPONDENT, units: [ENTS], campuses: [MIDDLE_EARTH] },
        { role: ROLE_ACCESS_OFFICE, campuses: [MIDDLE_EARTH] },
        { role: ROLE_SCREENING, campuses: [MIDDLE_EARTH] },
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
        { role: ROLE_ACCESS_OFFICE, campuses: [MIDDLE_EARTH] },
        { role: ROLE_SCREENING, campuses: [MIDDLE_EARTH] },
      ],
    },
    {
      firstname: 'Dwarf',
      lastname: 'CorresU',
      email: {
        original: 'dwarf.corresu@localhost',
      },
      password: userTestPassword,
      roles: [
        { role: ROLE_UNIT_CORRESPONDENT, units: [DWARFS], campuses: [MIDDLE_EARTH] },
      ],
    },
    {
      firstname: 'Dwarf',
      lastname: 'OffiS',
      email: {
        original: 'dwarf.offis@localhost',
      },
      password: userTestPassword,
      roles: [
        { role: ROLE_SECURITY_OFFICER, units: [DWARFS], campuses: [MIDDLE_EARTH] },
      ],
    },
    {
      firstname: 'Dwarf',
      lastname: 'Demandeur',
      email: {
        original: 'dwarf.demandeur@localhost',
      },
      password: userTestPassword,
      roles: [
        { role: ROLE_HOST, units: [DWARFS], campuses: [MIDDLE_EARTH] },
      ],
    },
    {
      firstname: 'Ent',
      lastname: 'CorresU',
      email: {
        original: 'ent.corresu@localhost',
      },
      password: userTestPassword,
      roles: [
        { role: ROLE_UNIT_CORRESPONDENT, units: [ENTS], campuses: [MIDDLE_EARTH] },
      ],
    },
    {
      firstname: 'Ent',
      lastname: 'OffiS',
      email: {
        original: 'ent.offis@localhost',
      },
      password: userTestPassword,
      roles: [
        { role: ROLE_SECURITY_OFFICER, units: [ENTS], campuses: [MIDDLE_EARTH] },
      ],
    },
    {
      firstname: 'Crib',
      lastname: 'Lage',
      email: {
        original: 'criblage@localhost',
      },
      password: userTestPassword,
      roles: [
        { role: ROLE_SCREENING, campuses: [MIDDLE_EARTH] },
      ],
    },
    {
      firstname: 'Bureau',
      lastname: 'Acc',
      email: {
        original: 'bureau.acc@localhost',
      },
      password: userTestPassword,
      roles: [
        { role: ROLE_ACCESS_OFFICE, campuses: [MIDDLE_EARTH] },
      ],
    },
  ];
};
