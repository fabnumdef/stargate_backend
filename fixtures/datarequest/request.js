import {
  UNIT_CIRI,
  UNIT_BBPD,
} from '../data/unit';

import {
  PLACE_CIRI,
  PLACE_BBPD,
} from '../data/place';

import {
  NAVAL_BASE,
} from '../data/campus';

import {
  SAMId,
} from '../data/user';

export const REQUEST01_ID = 'NAVAL-BASE20210308-13';

export const ownerSAM01 = {
  _id: SAMId,
  unit: UNIT_BBPD,
  email: {
    original: 'sam.soule@localhost',
    canonical: 'sam.soule@localhost',
  },
  firstname: 'Sam',
  lastname: 'Soule',
};

export const REQUEST01 = {
  _id: REQUEST01_ID,
  object: 'PROFESSIONAL',
  reason: 'mon motif',
  from: '2024-02-26T11:30:19.422Z',
  to: '2024-02-27T11:30:19.422Z',
  campus: NAVAL_BASE,
  owner: ownerSAM01,
  referent: null,
  places: [PLACE_CIRI, PLACE_BBPD],
  units: [UNIT_CIRI, UNIT_BBPD],
};

export default async () => [
  REQUEST01,
];
