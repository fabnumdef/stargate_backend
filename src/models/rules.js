import { rule } from 'graphql-shield';
export { allow } from 'graphql-shield';
export const ROLE_SUPERADMIN = 'ROLE_SUPERADMIN';
export const ROLE_ADMIN = 'ROLE_ADMIN';

export const isAuthenticated = rule()(async (parent, args, ctx, info) => {
    return !!ctx.user
});

export const isSuperAdmin = rule()(async (parent, args, ctx, info) => {
    return !!ctx.user.roles.find(({role}) => ROLE_SUPERADMIN === role);
});
