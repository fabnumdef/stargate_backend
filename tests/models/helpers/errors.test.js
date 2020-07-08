import { APIError } from '../../../src/models/helpers/errors';

describe('APIError test', () => {
  test('addErrors', () => {
    const error = new APIError();
    error.addErrors(['foo']);
    expect(error.errors).toHaveLength(1);
  });
  test('addError', () => {
    const error = new APIError();
    error.addError('foo');
    expect(error.errors).toHaveLength(1);
  });
});
