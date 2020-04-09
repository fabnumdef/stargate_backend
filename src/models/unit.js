import mongoose from 'mongoose';
import { createMachine } from 'xstate';

const { Schema } = mongoose;
export const MODEL_NAME = 'Unit';

// Validation is a blocking step
export const WORKFLOW_BEHAVIOR_VALIDATION = 'Validation';
// Information is a non-blocking step
export const WORKFLOW_BEHAVIOR_INFORMATION = 'Information';

const UnitSchema = new Schema({
  label: { type: String, required: true },
  campus: {
    _id: String,
    label: String,
    timezone: String,
  },
  workflow: {
    steps: [
      {
        role: String,
        behavior: {
          type: String,
          enum: [WORKFLOW_BEHAVIOR_VALIDATION, WORKFLOW_BEHAVIOR_INFORMATION],
        },
      },
    ],
  },
}, { timestamps: true });

UnitSchema.methods.buildWorkflow = function buildWorkflow() {
  if (this.workflow.steps.length < 1) {
    throw new Error('To build workflow, software needs at least one step.');
  }
  return createMachine({
    id: `unit-${this._id}`,
    initial: this.workflow.steps[0]._id.toString(),
    context: {},
    states: {
      ...this.workflow.steps.map((step, index, steps) => {
        switch (step.behavior) {
          case WORKFLOW_BEHAVIOR_VALIDATION:
          case WORKFLOW_BEHAVIOR_INFORMATION:
            return {
              [step._id.toString()]: {
                on: { VALIDATE: steps[index + 1] ? steps[index + 1]._id.toString() : 'final' },
              },
            };
          default:
            throw new Error('Unexpected behavior value');
        }
      }).reduce(Object.assign, {}),
      final: {
        type: 'final',
      },
    },
  });
};

export default mongoose.model(MODEL_NAME, UnitSchema, 'units');
