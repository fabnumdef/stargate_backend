import mongoose from 'mongoose';

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
};

export const DWARFS = {
  _id: dwarfsId,
  label: 'Dwarfs',
  campus: {
    _id: 'MIDDLE-EARTH',
    label: 'Middle-Earth',
  },
};


export default async () => [
  ORCS,
  TROLLS,
  ENTS,
  DWARFS,
];
