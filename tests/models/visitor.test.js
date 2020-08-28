import Visitor, { generateDummyVisitor } from './visitor';
import { createDummyUnit } from './unit';
import Campus, { generateDummyCampus } from './campus';
import Place, { generateDummyPlace } from './place';
import Request, { generateDummyRequest } from './request';
import {
  WORKFLOW_BEHAVIOR_ADVISEMENT,
  WORKFLOW_BEHAVIOR_INFORMATION,
  WORKFLOW_BEHAVIOR_VALIDATION, WORKFLOW_DECISION_ACCEPTED,
} from '../../src/models/unit';
import { ROLE_ACCESS_OFFICE, ROLE_ADMIN, ROLE_OBSERVER } from '../../src/models/rules';
import { generateDummyUser } from './user';
import { EVENT_CREATE, STATE_ACCEPTED, STATE_CREATED } from '../../src/models/request';

describe('Ensure that workflow is rightly generated for a visitor', () => {
  it('We should be able to change state', async () => {
    const campus = new Campus(generateDummyCampus());
    const unit1 = await createDummyUnit({
      campus,
      workflow: {
        steps: [
          {
            role: ROLE_ADMIN,
            behavior: WORKFLOW_BEHAVIOR_VALIDATION,
          },
          {
            role: ROLE_ACCESS_OFFICE,
            behavior: WORKFLOW_BEHAVIOR_VALIDATION,
          },
          {
            role: ROLE_OBSERVER,
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
    expect(() => visitor.validateStep(unit2._id.toString(), unit2.workflow.steps[0].role, WORKFLOW_DECISION_ACCEPTED))
      .toThrow('Visitor cannot be validated while in status "DRAFTED"');
    visitor.status = STATE_CREATED;
    visitor.validateStep(unit2._id.toString(), unit2.workflow.steps[0].role, WORKFLOW_DECISION_ACCEPTED);
    expect(visitor.request.units[1].workflow.steps[0].state.value).toEqual(WORKFLOW_DECISION_ACCEPTED);
    expect(() => visitor.validateStep(unit2._id.toString(), unit2.workflow.steps[0].role, WORKFLOW_DECISION_ACCEPTED))
      .toThrow(`Step "${visitor.request.units[1].workflow.steps[0]._id}" already validated`);
    expect(() => visitor.validateStep(unit1._id.toString(), unit1.workflow.steps[2].role, WORKFLOW_DECISION_ACCEPTED))
      .toThrow(`Previous step of "${visitor.request.units[0].workflow.steps[2]._id}" not yet validated`);
  });

  it('We should not be able to change to invalid state', async () => {
    const campus = new Campus(generateDummyCampus());
    {
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
        status: STATE_CREATED,
      }));
      const DECISION = 'DECISION';
      expect(() => visitor.validateStep(unit1._id.toString(), unit1.workflow.steps[0].role, DECISION))
        .toThrow(`Validation behavior cannot accept "${DECISION}" decision.`);
    }
    {
      const unit1 = await createDummyUnit({
        campus,
        workflow: {
          steps: [
            {
              role: ROLE_ADMIN,
              behavior: WORKFLOW_BEHAVIOR_INFORMATION,
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
        status: STATE_CREATED,
      }));
      const DECISION = 'DECISION';
      expect(() => visitor.validateStep(unit1._id.toString(), unit1.workflow.steps[0].role, DECISION))
        .toThrow(`Information behavior cannot accept "${DECISION}" decision.`);
    }
    {
      const unit1 = await createDummyUnit({
        campus,
        workflow: {
          steps: [
            {
              role: ROLE_ADMIN,
              behavior: WORKFLOW_BEHAVIOR_ADVISEMENT,
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
        status: STATE_CREATED,
      }));
      const DECISION = 'DECISION';
      expect(() => visitor.validateStep(unit1._id.toString(), unit1.workflow.steps[0].role, DECISION))
        .toThrow(`Advisement behavior cannot accept "${DECISION}" decision.`);
    }
  });
});

describe('Ensure that workflow is working', () => {
  it('When every units reach final state, switch global state', async () => {
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
      places: [place1],
    }));
    await request.cacheUnitsFromPlaces(true);
    const visitor = new Visitor(generateDummyVisitor({
      request,
      firstname: 'Foo',
      birthLastname: 'Bar',
      usageLastname: 'Bar',
      birthday: new Date('1970-01-01'),
      birthdayPlace: 'Paris',
      status: STATE_CREATED,
    }));
    visitor.validateStep(unit1._id.toString(), unit1.workflow.steps[0].role, WORKFLOW_DECISION_ACCEPTED);
    expect(visitor.request.units[0].workflow.steps[0].state.value).toEqual(WORKFLOW_DECISION_ACCEPTED);
    expect(visitor.status).toEqual(STATE_ACCEPTED);
  });

  it('When a visitor request reach final state, trigger request compute', async () => {
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
      places: [place1],
      owner: generateDummyUser(),
    }));
    await request.cacheUnitsFromPlaces(true);
    request.stateMutation(EVENT_CREATE);
    await request.save();
    const visitor = new Visitor(generateDummyVisitor({
      request,
      firstname: 'Foo',
      birthLastname: 'Bar',
      usageLastname: 'Bar',
      birthday: new Date('1970-01-01'),
      birthdayPlace: 'Paris',
      status: STATE_CREATED,
    }));
    visitor.validateStep(unit1._id.toString(), unit1.workflow.steps[0].role, WORKFLOW_DECISION_ACCEPTED);
    expect(visitor.request.units[0].workflow.steps[0].state.value).toEqual(WORKFLOW_DECISION_ACCEPTED);
    expect(visitor.status).toEqual(STATE_ACCEPTED);
    await visitor.save();
    const refreshedRequest = await Request.findById(request._id);
    expect(refreshedRequest.status).toEqual(STATE_ACCEPTED);
  });
});
