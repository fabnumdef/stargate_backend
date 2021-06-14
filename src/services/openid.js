import { Issuer } from 'openid-client';
import config from './config';

let openIDIssuer;

async function fetchOpenIDIssuer({ discovery_url: url }) {
  if (url) {
    openIDIssuer = await Issuer.discover(url);
  }
}

export function getOpenIDClient() {
  if (!openIDIssuer) {
    throw new Error('openIDIssuer is null');
  }
  return new openIDIssuer.Client(
    {
      client_id: config.get('openid:client_id'),
      client_secret: config.get('openid:client_secret'),
    },
  );
}

export default fetchOpenIDIssuer;
