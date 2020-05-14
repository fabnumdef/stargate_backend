import { entsId, dwarfsId } from './unit';

export const MORIA = {
  label: 'Moria',
  campus: {
    _id: 'MIDDLE-EARTH',
    label: 'Middle-Earth',
  },
  unitInCharge: {
    _id: dwarfsId,
    label: 'Dwarfs',
  },
};

export const SHIRE = {
  label: 'Shire',
  campus: {
    _id: 'MIDDLE-EARTH',
    label: 'Middle-Earth',
  },
  unitInCharge: {
    _id: entsId,
    label: 'Ents',
  },
};

export const ROHAN = {
  label: 'Rohan',
  campus: {
    _id: 'MIDDLE-EARTH',
    label: 'Middle-Earth',
  },
  unitInCharge: {
    _id: dwarfsId,
    label: 'Dwarfs',
  },
};

export const GONDOR = {
  label: 'Gondor',
  campus: {
    _id: 'MIDDLE-EARTH',
    label: 'Middle-Earth',
  },
  unitInCharge: {
    _id: entsId,
    label: 'Ents',
  },
};

export default async () => [
  MORIA,
  SHIRE,
  ROHAN,
  GONDOR,
];
