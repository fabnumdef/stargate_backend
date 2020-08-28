import request from 'supertest';
import app from '../../src/app';

it('Test to export list visitors in a campus', async () => {
  const result = await request(app.callback()).get('/');
  expect(result.text).toContain('OK - ');
});
