import { ciriId, fusId } from './unit';

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

export default async () => [
  PLACE_CIRI,
  PLACE_FUS,
];
