import mongoose from 'mongoose';
import {
  ciriId,
  fusId,
  sailorId,
  bbpdId,
  lasemId,
} from './unit';

export const PLACE_CIRI_Id = new mongoose.Types.ObjectId();
export const PLACE_FUS_Id = new mongoose.Types.ObjectId();
export const PLACE_BBPD_Id = new mongoose.Types.ObjectId();

export const PLACE_CIRI = {
  _id: PLACE_CIRI_Id,
  label: 'Lieu CIRI',
  campus: {
    _id: 'NAVAL-BASE',
    label: 'Base Navale',
  },
  unitInCharge: {
    _id: ciriId,
    label: 'CIRI',
  },
};

export const PLACE_FUS = {
  _id: PLACE_FUS_Id,
  label: 'Lieu FUS',
  campus: {
    _id: 'NAVAL-BASE',
    label: 'Base Navale',
  },
  unitInCharge: {
    _id: fusId,
    label: 'FUS',
  },
};

export const PLACE_SAILOR = {
  label: 'Lieu Marins-Pompiers',
  campus: {
    _id: 'NAVAL-BASE',
    label: 'Base Navale',
  },
  unitInCharge: {
    _id: sailorId,
    label: 'Marins-Pompiers',
  },
};

export const PLACE_BBPD = {
  _id: PLACE_BBPD_Id,
  label: 'Lieu BBPD',
  campus: {
    _id: 'NAVAL-BASE',
    label: 'Base Navale',
  },
  unitInCharge: {
    _id: bbpdId,
    label: 'BBPD Acanthe',
  },
};

export const PLACE_LASEM = {
  label: 'Lieu Lasem',
  campus: {
    _id: 'NAVAL-BASE',
    label: 'Base Navale',
  },
  unitInCharge: {
    _id: lasemId,
    label: 'Lasem',
  },
};

export const MILITARY_PORT = {
  label: 'Port Militaire',
  campus: {
    _id: 'NAVAL-BASE',
    label: 'Base Navale',
  },
  unitInCharge: {
    _id: null,
    label: null,
  },
};

export default async () => [
  PLACE_CIRI,
  PLACE_FUS,
  PLACE_SAILOR,
  PLACE_BBPD,
  PLACE_LASEM,
  MILITARY_PORT,
];
