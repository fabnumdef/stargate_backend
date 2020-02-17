import path from 'path';
import nconf from 'nconf';

nconf.argv()
  .env({
    separator: '__',
    lowerCase: true,
    parseValues: true,
  })
  .file({
    file: path.join(__dirname, '..', '..', 'config.json'),
  });

export default nconf;
