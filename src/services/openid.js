import { Issuer } from 'openid-client';

let openIDIssuer;

async function fetchOpenIDIssuer(config) {
  openIDIssuer = await Issuer.discover(config.discovery_url);
}

export function getOpenIDClient() {
  return openIDIssuer.Client();
}

export default fetchOpenIDIssuer;
