import User from '../models/user';
import OpenIDRequest from '../models/openid-request';
import { getOpenIDClient } from '../services/openid';
import config from '../services/config';

export const Mutation = {
  async login(_, { email, password, token }) {
    const user = await User.findByEmail(email);

    if (!password && !token) {
      throw new Error('To generate a JWT, password or token are required.');
    }

    if (!user
            || (password && !(await user.comparePassword(password)))
    ) {
      throw new Error(`Email "${email}" and password do not match.`);
    }

    if ((token && !(await user.compareResetToken(token, email)))) {
      throw new Error('Expired link');
    }

    if (user.hasPasswordExpired()) {
      throw new Error('Password expired');
    }

    return { user, isRenewable: !!password };
  },

  async jwtRefresh(_, args, ctx) {
    if (!ctx.user.isRenewable) {
      throw new Error('Token not renewable');
    }
    const user = await User.findById(ctx.user.id);
    if (!user) {
      throw new Error('User not found');
    }

    return { user };
  },

  async openIDRequest(_, { redirectURI }) {
    const request = new OpenIDRequest({ redirectURI });
    await request.save();
    const responseType = 'code';
    const clientID = config.get('openid:client_id');
    const openIDServer = config.get('openid:discovery_url');

    return {
      state: request.requestToken,
      redirectURI,
      responseType,
      clientID,
      openIDServer,
      URL: `${config.get('openid:discovery_url')}/protocol/openid-connect/auth?`
      + `client_id=${clientID}&response_type=${responseType}&state=${request.requestToken}`
      + `&redirect_uri=${encodeURIComponent(redirectURI)}`,
    };
  },
  async openIDLogin(_, { authorizationCode, state, redirectURI }) {
    const client = getOpenIDClient();
    const request = await OpenIDRequest.findOneByState(state, redirectURI);
    if (!request) {
      throw new Error('openID request not found');
    }
    const tokenSet = await client.grant({
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: redirectURI,
    });

    const type = 'access_token';
    const { email } = await client.introspect(tokenSet[type], type);

    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('This user is not allowed to authenticate through openid');
    }

    return { user, isRenewable: true };
  },
};

export const RequestableTokens = {
  async jwt({ user, isRenewable }) {
    return user.emitJWT(isRenewable);
  },
};
