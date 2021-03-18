import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import {
  ROLE_ADMIN,
  ROLE_SUPERADMIN,
  ROLE_UNIT_CORRESPONDENT,
  ROLE_ACCESS_OFFICE,
  ROLE_SCREENING,
  ROLE_SECURITY_OFFICER,
  ROLE_HOST,
  ROLE_GATEKEEPER,
} from '../../src/models/rules';
import { NAVAL_BASE } from './campus';
import {
  UNIT_CIRI,
  UNIT_FUS,
  UNIT_SAILOR,
  UNIT_BBPD,
  UNIT_LASEM,
} from './unit';

export const SAMId = new mongoose.Types.ObjectId();
export const ADMId = new mongoose.Types.ObjectId();

export default async ({ log }) => {
  const users = [
    {
      _id: ADMId,
      firstname: 'Super',
      lastname: 'Admin',
      email: {
        original: 'super.admin@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_SUPERADMIN },
        { role: ROLE_ADMIN, campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'BA',
      lastname: 'BaseNavale',
      email: {
        original: 'ba.basenavale@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_ACCESS_OFFICE, campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Gendarme',
      lastname: 'BaseNavale',
      email: {
        original: 'gmd.basenavale@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_SCREENING, campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Gardien',
      lastname: 'BaseNavale',
      email: {
        original: 'grd.basenavale@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_GATEKEEPER, campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Demandeur',
      lastname: 'CIRI',
      email: {
        original: 'demandeur.ciri@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_HOST, units: [UNIT_CIRI], campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'CU',
      lastname: 'CIRI',
      email: {
        original: 'cu.ciri@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_UNIT_CORRESPONDENT, units: [UNIT_CIRI], campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'OS',
      lastname: 'CIRI',
      email: {
        original: 'os.ciri@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_SECURITY_OFFICER, units: [UNIT_CIRI], campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Demandeur',
      lastname: 'FUS',
      email: {
        original: 'demandeur.fus@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_HOST, units: [UNIT_FUS], campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'CU',
      lastname: 'FUS',
      email: {
        original: 'cu.fus@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_UNIT_CORRESPONDENT, units: [UNIT_FUS], campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'OS',
      lastname: 'FUS',
      email: {
        original: 'os.fus@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_SECURITY_OFFICER, units: [UNIT_FUS], campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Eddy',
      lastname: 'Moitout',
      email: {
        original: 'eddy.moitout@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_SCREENING, campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Michaël',
      lastname: 'Mcaradech',
      email: {
        original: 'michael.mcaradech@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_ACCESS_OFFICE, campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Oscar',
      lastname: 'Amel',
      email: {
        original: 'oscar.amel@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_HOST, units: [UNIT_SAILOR], campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Denis',
      lastname: 'Doiseau',
      email: {
        original: 'denis.doiseau@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_HOST, units: [UNIT_SAILOR], campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Anne',
      lastname: 'Onyme',
      email: {
        original: 'anne.onyme@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_HOST, units: [UNIT_SAILOR], campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Alain',
      lastname: 'Terieur',
      email: {
        original: 'alain.terieur@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_UNIT_CORRESPONDENT, units: [UNIT_SAILOR], campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Anna',
      lastname: 'Lyz',
      email: {
        original: 'anna.lyz@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_UNIT_CORRESPONDENT, units: [UNIT_SAILOR], campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Pat',
      lastname: 'Atatrak',
      email: {
        original: 'pat.atatrak@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_SECURITY_OFFICER, units: [UNIT_SAILOR], campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Alain',
      lastname: 'Die',
      email: {
        original: 'alain.die@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_HOST, units: [UNIT_BBPD], campuses: [NAVAL_BASE] },
      ],
    },
    {
      _id: SAMId,
      firstname: 'Sam',
      lastname: 'Soule',
      email: {
        original: 'sam.soule@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_UNIT_CORRESPONDENT, units: [UNIT_BBPD], campuses: [NAVAL_BASE] },
        { role: ROLE_SECURITY_OFFICER, units: [UNIT_BBPD], campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Jean',
      lastname: 'Tourloupe',
      email: {
        original: 'jean.tourloupe@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_HOST, units: [UNIT_LASEM], campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Jean',
      lastname: 'Sérien',
      email: {
        original: 'jean.serien@localhost',
      },
      password: nanoid(),
      roles: [
        { role: ROLE_UNIT_CORRESPONDENT, units: [UNIT_LASEM], campuses: [NAVAL_BASE] },
      ],
    },
  ];

  users.forEach((user) => log.info(`${user.email.original} password will be ${user.password}`));

  return users;
};
