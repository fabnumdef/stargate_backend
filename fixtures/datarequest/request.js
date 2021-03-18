import queryFactory, { gql } from '../../tests/helpers/apollo-query';
import { EVENT_CANCEL, EVENT_CREATE, STATE_CREATED } from '../../src/models/request';

import {
    UNIT_CIRI,
    UNIT_FUS,
    UNIT_SAILOR,
    UNIT_BBPD,
    UNIT_LASEM,
} from '../data/unit';

import {
    PLACE_CIRI,
    PLACE_FUS,
    PLACE_BBPD,
} from '../data/place';

import {
    NAVAL_BASE,
} from '../data/campus';

import {
    SAMId,
} from '../data/user';

export const requestToBeCreated01_id = 'NAVAL-BASE20210308-13'

export const ownerSAM01 = {
    _id: SAMId,
    unit: UNIT_BBPD,
    email: {
      original: 'sam.soule@localhost',
      canonical: 'sam.soule@localhost',
    },
    firstname: 'Sam',
    lastname: 'Soule',
}

export const requestToBeCreated01 = {
    _id: requestToBeCreated01_id,
    object: 'PROFESSIONAL',
    reason: 'mon motif',
    from: '2024-02-26T11:30:19.422Z',
    to: '2024-02-27T11:30:19.422Z',
    campus: NAVAL_BASE,
    owner: ownerSAM01,
    referent: null,
    places:[PLACE_CIRI, PLACE_BBPD],
    units:[UNIT_CIRI, UNIT_BBPD],
}

export default async () => [
    requestToBeCreated01,
];
