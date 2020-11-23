import { rule } from 'graphql-shield';

export { allow } from 'graphql-shield';
export const ROLE_SUPERADMIN = 'ROLE_SUPERADMIN';
export const ROLE_ADMIN = 'ROLE_ADMIN';
export const ROLE_UNIT_CORRESPONDENT = 'ROLE_UNIT_CORRESPONDENT';
export const ROLE_SECURITY_OFFICER = 'ROLE_SECURITY_OFFICER';
export const ROLE_ACCESS_OFFICE = 'ROLE_ACCESS_OFFICE';
export const ROLE_SCREENING = 'ROLE_SCREENING';
export const ROLE_HOST = 'ROLE_HOST';
export const ROLE_OBSERVER = 'ROLE_OBSERVER';
export const ROLE_GATEKEEPER = 'ROLE_GATEKEEPER';

export const isAuthenticated = rule()(async (parent, args, ctx) => !!ctx.user);

export const isSuperAdmin = rule()(
  async (parent, args, ctx) => !!ctx.user.roles.find(({ role }) => ROLE_SUPERADMIN === role),
);

export const isAdmin = rule()(
  // @todo: Check campus too
  async (parent, args, ctx) => !!ctx.user.roles.find(({ role }) => ROLE_ADMIN === role),
);

export const isUnitCorrespondent = rule()(
  async (parent, args, ctx) => !!ctx.user.roles.find(({ role }) => ROLE_UNIT_CORRESPONDENT === role),
);

export const canHandleRequest = rule()(
  async (parent, args, ctx) => !!ctx.user.roles.find(({ role }) => [
    ROLE_UNIT_CORRESPONDENT,
    ROLE_SECURITY_OFFICER,
    ROLE_ACCESS_OFFICE,
    ROLE_HOST,
  ].includes(role)),
);

export const canHandleVisitor = rule()(
  async (parent, args, ctx) => !!ctx.user.roles.find(({ role }) => [
    ROLE_UNIT_CORRESPONDENT,
    ROLE_SECURITY_OFFICER,
    ROLE_ACCESS_OFFICE,
    ROLE_SCREENING,
    ROLE_OBSERVER,
  ].includes(role)),
);
