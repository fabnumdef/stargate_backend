import Campus, { generateDummyCampus } from './campus';

describe('Ensure that timezone exists', () => {
  it('Should fail validation is timezone don\'t exists', async () => {
    const timezone = 'foo/bar';
    const campus = new Campus(generateDummyCampus({ timezone }));
    await expect(campus.validate()).rejects.toThrow(`"${timezone}" seems to don't be a valid timezone`);
  });
});
