import Request, { generateDummyRequest } from './request';
import { createDummyUnit } from './unit';
import Campus, { generateDummyCampus } from './campus';
import Place, { generateDummyPlace } from './place';
import {
  WORKFLOW_BEHAVIOR_ADVISEMENT,
  WORKFLOW_BEHAVIOR_INFORMATION,
  WORKFLOW_BEHAVIOR_VALIDATION,
} from '../../src/models/unit';
import { ROLE_ADMIN } from '../../src/models/rules';

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
      campus: {
        _id: String,
        label: String,
      },
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
