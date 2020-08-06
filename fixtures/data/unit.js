import mongoose from 'mongoose';
import {
  WORKFLOW_BEHAVIOR_ADVISEMENT,
  WORKFLOW_BEHAVIOR_VALIDATION,
} from '../../src/models/unit';
import {
  ROLE_SECURITY_OFFICER,
  ROLE_UNIT_CORRESPONDENT,
  ROLE_SCREENING,
  ROLE_ACCESS_OFFICE,
} from '../../src/models/rules';

export const ciriId = new mongoose.Types.ObjectId();
export const fusId = new mongoose.Types.ObjectId();
export const sailorId = new mongoose.Types.ObjectId();
export const bbpdId = new mongoose.Types.ObjectId();
export const lasemId = new mongoose.Types.ObjectId();

export const UNIT_CIRI = {
  _id: ciriId,
  label: 'CIRI',
  trigram: 'CIR',
  campus: {
    _id: 'NAVAL-BASE',
    label: 'Base Navale',
  },
  workflow: {
    steps: [
      {
        role: ROLE_UNIT_CORRESPONDENT,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
      {
        role: ROLE_SCREENING,
        behavior: WORKFLOW_BEHAVIOR_ADVISEMENT,
      },
      {
        role: ROLE_SECURITY_OFFICER,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
      {
        role: ROLE_ACCESS_OFFICE,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
    ],
  },
};

export const UNIT_FUS = {
  _id: fusId,
  label: 'FUS',
  trigram: 'FUS',
  campus: {
    _id: 'NAVAL-BASE',
    label: 'Base Navale',
  },
  workflow: {
    steps: [
      {
        role: ROLE_UNIT_CORRESPONDENT,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
      {
        role: ROLE_SCREENING,
        behavior: WORKFLOW_BEHAVIOR_ADVISEMENT,
      },
      {
        role: ROLE_SECURITY_OFFICER,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
      {
        role: ROLE_ACCESS_OFFICE,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
    ],
  },
};

export const UNIT_SAILOR = {
  _id: sailorId,
  label: 'Marins-Pompiers',
  trigram: 'MPO',
  campus: {
    _id: 'NAVAL-BASE',
    label: 'Base Navale',
  },
  workflow: {
    steps: [
      {
        role: ROLE_UNIT_CORRESPONDENT,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
      {
        role: ROLE_SCREENING,
        behavior: WORKFLOW_BEHAVIOR_ADVISEMENT,
      },
      {
        role: ROLE_SECURITY_OFFICER,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
      {
        role: ROLE_ACCESS_OFFICE,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
    ],
  },
};

export const UNIT_BBPD = {
  _id: bbpdId,
  label: 'BBPD Acanthe',
  trigram: 'BB',
  campus: {
    _id: 'NAVAL-BASE',
    label: 'Base Navale',
  },
  workflow: {
    steps: [
      {
        role: ROLE_UNIT_CORRESPONDENT,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
      {
        role: ROLE_SCREENING,
        behavior: WORKFLOW_BEHAVIOR_ADVISEMENT,
      },
      {
        role: ROLE_SECURITY_OFFICER,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
      {
        role: ROLE_ACCESS_OFFICE,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
    ],
  },
};

export const UNIT_LASEM = {
  _id: lasemId,
  label: 'Lasem',
  trigram: 'LSM',
  campus: {
    _id: 'NAVAL-BASE',
    label: 'Base Navale',
  },
  workflow: {
    steps: [
      {
        role: ROLE_UNIT_CORRESPONDENT,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
      {
        role: ROLE_SCREENING,
        behavior: WORKFLOW_BEHAVIOR_ADVISEMENT,
      },
      {
        role: ROLE_ACCESS_OFFICE,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
    ],
  },
};

export default async () => [
  UNIT_CIRI,
  UNIT_FUS,
  UNIT_SAILOR,
  UNIT_BBPD,
  UNIT_LASEM,
];
