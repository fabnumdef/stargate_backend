import mongoose from 'mongoose';
import Visitor, { generateDummyVisitor } from './visitor';
import { createDummyUnit } from './unit';
import Campus, { generateDummyCampus } from './campus';
import Place, { generateDummyPlace } from './place';
import Request, { generateDummyRequest } from './request';
import {
  WORKFLOW_BEHAVIOR_ADVISEMENT,
  WORKFLOW_BEHAVIOR_INFORMATION,
  WORKFLOW_BEHAVIOR_VALIDATION,
} from '../../src/models/unit';
import { ROLE_ADMIN } from '../../src/models/rules';

describe('Ensure that workflow is rightly generated for a visitor', () => {
  it('StateMachine should be truthy', async () => {
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
    const visitor = new Visitor(generateDummyVisitor({
      request,
      firstname: 'Foo',
      birthLastname: 'Bar',
      usageLastname: 'Bar',
      birthday: new Date('1970-01-01'),
      birthdayPlace: 'Paris',
    }));
    expect(visitor.stateMachine).toBeTruthy();
  });

  it('We should be able to change state', async () => {
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
    const visitor = new Visitor(generateDummyVisitor({
      request,
      firstname: 'Foo',
      birthLastname: 'Bar',
      usageLastname: 'Bar',
      birthday: new Date('1970-01-01'),
      birthdayPlace: 'Paris',
      stateValue: {
        validation: {
          [`U${unit2._id}`]: 'accepted',
          [`U${unit1._id}`]: `U${unit1._id}S${unit1.workflow.steps[0]._id}`,
        },
      },
    }));
    visitor.stateMutation(unit2._id, unit2.workflow.steps[0]._id, 'accept');
    expect(visitor.stateMachine).toBeTruthy();
  });

  it('You cannot call stateMutation without expected number of parameters ', async () => {
    const campus = new Campus(generateDummyCampus());
    const unit1 = await createDummyUnit({
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
    const request = new Request(generateDummyRequest({
      campus,
      places: [
        place1,
      ],
    }));
    await request.cacheUnitsFromPlaces(true);
    const visitor = new Visitor(generateDummyVisitor({
      request,
      firstname: 'Foo',
      birthLastname: 'Bar',
      usageLastname: 'Bar',
      birthday: new Date('1970-01-01'),
      birthdayPlace: 'Paris',
    }));

    expect(() => visitor.stateMutation(unit1._id, unit1.workflow.steps[0]._id))
      .toThrow('You should pass 1 or 3 parameters');
  });

  it('getStep should never throw, but return null', async () => {
    // When no unit at all
    {
      const campus = new Campus(generateDummyCampus());
      const request = new Request(generateDummyRequest({
        campus,
      }));
      const visitor = new Visitor(generateDummyVisitor({
        request,
      }));
      expect(visitor.getStep(new mongoose.Types.ObjectId(), ROLE_ADMIN)).toBeNull();
    }
    // When no steps in unit
    {
      const campus = new Campus(generateDummyCampus());
      const unit1 = await createDummyUnit({
        campus,
      });
      const place1 = new Place(generateDummyPlace({ campus, unitInCharge: unit1 }));
      const request = new Request(generateDummyRequest({
        campus,
        places: [place1],
      }));
      const visitor = new Visitor(generateDummyVisitor({
        request,
      }));

      expect(visitor.getStep(unit1._id, ROLE_ADMIN)).toBeNull();
    }
  });
});
