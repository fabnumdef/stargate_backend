import { DateTime } from 'luxon';
import Request, { createDummyRequest, generateDummyRequest } from './request';
import { createDummyUnit } from './unit';
import Campus, { generateDummyCampus } from './campus';
import Place, { generateDummyPlace } from './place';
import {
  WORKFLOW_BEHAVIOR_ADVISEMENT,
  WORKFLOW_BEHAVIOR_INFORMATION,
  WORKFLOW_BEHAVIOR_VALIDATION,
} from '../../src/models/unit';
import { ROLE_ADMIN } from '../../src/models/rules';
import { generateDummyUser } from './user';
import config from '../../src/services/config';
import { EVENT_REMOVE } from '../../src/models/request';

const DEFAULT_TIMEZONE = config.get('default_timezone');

describe('Ensure that ID is generated from elements', () => {
  it('Should generate an id if no one is provided', async () => {
    const owner = generateDummyUser();
    const campus = generateDummyCampus();
    const date = DateTime.local().setZone(DEFAULT_TIMEZONE).startOf('day');
    {
      const request = new Request(generateDummyRequest({ owner, campus }));
      await request.save();
      expect(request._id).toEqual(`${campus._id}${date.toFormat('yyyyLLdd')}-1`);
    }
    {
      const request = new Request(generateDummyRequest({ owner, campus }));
      await request.save();
      expect(request._id).toEqual(`${campus._id}${date.toFormat('yyyyLLdd')}-2`);
    }
  });
});

describe('Ensure that units can be cached from places', () => {
  it('Should growth units array when places are added then cache triggered', async () => {
    const campus = new Campus(generateDummyCampus());
    const unit1 = await createDummyUnit({
      campus,
      workflow: {
        steps: [
          {
            role: ROLE_ADMIN,
            behavior: WORKFLOW_BEHAVIOR_ADVISEMENT,
          },
          {
            role: ROLE_ADMIN,
            behavior: WORKFLOW_BEHAVIOR_INFORMATION,
          },
          {
            role: ROLE_ADMIN,
            behavior: WORKFLOW_BEHAVIOR_VALIDATION,
          },
          {
            role: ROLE_ADMIN,
            behavior: WORKFLOW_BEHAVIOR_VALIDATION,
          },
        ],
      },
    });
    const unit2 = await createDummyUnit({
      campus,
      workflow: {
        steps: [
          {
            role: ROLE_ADMIN,
            behavior: WORKFLOW_BEHAVIOR_VALIDATION,
          },
        ],
      },
    });
    const place1 = new Place(generateDummyPlace({ campus, unitInCharge: unit1 }));
    const place2 = new Place(generateDummyPlace({ campus, unitInCharge: unit1 }));
    const place3 = new Place(generateDummyPlace({ campus, unitInCharge: unit2 }));
    const request = new Request(generateDummyRequest({
      campus,
      places: [
        place1,
        place2,
        place3,
      ],
    }));
    await request.cacheUnitsFromPlaces(true);
    expect(request.units).toHaveLength(2);
  });
});

describe('Ensure that workflow is working', () => {
  it('Entity should be removed when state switch to removed', async () => {
    const campus = new Campus(generateDummyCampus());
    const owner = await generateDummyUser();
    const request = await createDummyRequest({ campus, owner });
    await request.stateMutation(EVENT_REMOVE);
    expect(await Request.findById(request._id)).toBeNull();
  });
});
