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
import { NAVAL_BASE } from './campus';
import { UNIT_CIRI, UNIT_FUS } from './unit';

export default async ({ log }) => {
  const superAdminPassword = nanoid();
  const accessOfficePassword = nanoid();
  const screeningPassword = nanoid();
  const hostCiriPassword = nanoid();
  const cuCiriPassword = nanoid();
  const osCiriPassword = nanoid();
  const hostFusPassword = nanoid();
  const cuFusPassword = nanoid();
  const osFusPassword = nanoid();

  log.info(`Super admin password will be ${superAdminPassword}`);
  log.info(`ba.basenavale@localhost password will be ${accessOfficePassword}`);
  log.info(`gmd.basenavale@localhost will be ${screeningPassword}`);
  log.info(`demandeur.ciri@localhost password will be ${hostCiriPassword}`);
  log.info(`cu.ciri@localhost will be ${cuCiriPassword}`);
  log.info(`os.ciri@localhost password will be ${osCiriPassword}`);
  log.info(`demandeur.fus@localhost password will be ${hostFusPassword}`);
  log.info(`cu.fuq@localhost password will be ${cuFusPassword}`);
  log.info(`os.fus@localhost password will be ${osFusPassword}`);
  // eslint-disable-next-line max-len

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
        { role: ROLE_ADMIN, campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'BA',
      lastname: 'BaseNavale',
      email: {
        original: 'ba.basenavale@localhost',
      },
      password: accessOfficePassword,
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
      password: screeningPassword,
      roles: [
        { role: ROLE_SCREENING, campuses: [NAVAL_BASE] },
      ],
    },
    {
      firstname: 'Demandeur',
      lastname: 'CIRI',
      email: {
        original: 'demandeur.ciri@localhost',
      },
      password: hostCiriPassword,
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
      password: cuCiriPassword,
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
      password: osCiriPassword,
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
      password: hostFusPassword,
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
      password: cuFusPassword,
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
      password: osFusPassword,
      roles: [
        { role: ROLE_SECURITY_OFFICER, units: [UNIT_FUS], campuses: [NAVAL_BASE] },
      ],
    },
  ];
};
