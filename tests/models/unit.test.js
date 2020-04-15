import { StateNode, interpret } from 'xstate';
import Unit, { generateDummyUnit } from './unit';
import { WORKFLOW_BEHAVIOR_VALIDATION } from '../../src/models/unit';

describe('Ensure that workflow is rightly generated for a unit', () => {
  it('Should fail if workflow is empty', async () => {
    const unit = new Unit(generateDummyUnit());
    expect(() => unit.buildWorkflow()).toThrow('at least one step');
  });

  it('Should fail if behavior value is not handled', async () => {
    const unit = new Unit(generateDummyUnit({
      workflow: {
        steps: [
          {
            behavior: 'FOO',
          },
        ],
      },
    }));
    expect(() => unit.buildWorkflow()).toThrow('Unexpected behavior');
  });

  it('Should return a valid state node', async () => {
    const unit = new Unit(generateDummyUnit({
      workflow: {
        steps: [
          {
            behavior: WORKFLOW_BEHAVIOR_VALIDATION,
          },
        ],
      },
    }));
    expect(unit.buildWorkflow()).toBeInstanceOf(StateNode);
  });

  it('Should be validable from start to end, manually', async () => {
    const unit = new Unit(generateDummyUnit({
      workflow: {
        steps: [
          {
            behavior: WORKFLOW_BEHAVIOR_VALIDATION,
          },
        ],
      },
    }));
    const state = unit.buildWorkflow();
    const service = interpret(state);
    service.start();
    unit.workflow.steps.forEach((step) => {
      expect(service.state.value).toBe(step._id.toString());
      service.send('VALIDATE');
    });
    service.stop();
    expect(service.state.value).toBe('final');
  });
});
