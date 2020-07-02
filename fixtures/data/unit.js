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

export const orcsId = new mongoose.Types.ObjectId();
export const trollsId = new mongoose.Types.ObjectId();
export const entsId = new mongoose.Types.ObjectId();
export const dwarfsId = new mongoose.Types.ObjectId();

export const ORCS = {
  _id: orcsId,
  label: 'Orcs',
  campus: {
    _id: 'MORDOR',
    label: 'Mordor',
  },
};

export const TROLLS = {
  _id: trollsId,
  label: 'Trolls',
  campus: {
    _id: 'MORDOR',
    label: 'Mordor',
  },
};

export const ENTS = {
  _id: entsId,
  label: 'Ents',
  campus: {
    _id: 'MIDDLE-EARTH',
    label: 'Middle-Earth',
  },
  workflow: {
    steps: [
      {
        role: ROLE_SCREENING,
        behavior: WORKFLOW_BEHAVIOR_ADVISEMENT,
      },
      {
        role: ROLE_UNIT_CORRESPONDENT,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
      {
        role: ROLE_ACCESS_OFFICE,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
    ],
  },
};

export const DWARFS = {
  _id: dwarfsId,
  label: 'Dwarfs',
  campus: {
    _id: 'MIDDLE-EARTH',
    label: 'Middle-Earth',
  },
  workflow: {
    steps: [
      {
        role: ROLE_SECURITY_OFFICER,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
      {
        role: ROLE_SCREENING,
        behavior: WORKFLOW_BEHAVIOR_ADVISEMENT,
      },
      {
        role: ROLE_UNIT_CORRESPONDENT,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
      {
        role: ROLE_ACCESS_OFFICE,
        behavior: WORKFLOW_BEHAVIOR_VALIDATION,
      },
    ],
  },
};

export default async () => [
  ORCS,
  TROLLS,
  ENTS,
  DWARFS,
];
