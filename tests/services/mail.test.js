import { prepareSendMailFromTemplate } from '../../src/services/mail';

describe('Mail service test', () => {
  describe('prepareSendMailFromTemplate', () => {
    test('Branch "no template found"', async () => {
      await expect(async () => {
        const template = prepareSendMailFromTemplate('foo', 'Subject');
        return template('foo@localhost', { lang: 'zh' });
      }).rejects.toThrow('No mail template found');
    });
  });
});
