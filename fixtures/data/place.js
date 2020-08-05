import {
  ciriId,
  fusId,
  sailorId,
  bbpdId,
  lasemId,
} from './unit';

export const PLACE_CIRI = {
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

export default async () => [
  PLACE_CIRI,
  PLACE_FUS,
  PLACE_SAILOR,
  PLACE_BBPD,
  PLACE_LASEM,
];
