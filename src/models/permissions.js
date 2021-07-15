import { shield, or } from 'graphql-shield';
import {
  isAuthenticated,
  isSuperAdmin,
  isAdmin,
  allow,
  canHandleRequest,
  canHandleVisitor,
  isUnitCorrespondent,
} from './rules';

export default shield({
  Query: {
    listCampuses: isSuperAdmin,
    getCampus: isAuthenticated,
    getUser: or(isAdmin, isSuperAdmin, isUnitCorrespondent),
    me: isAuthenticated,
    listUsers: or(isUnitCorrespondent, isAdmin, isSuperAdmin),
    findUser: or(isAdmin, isSuperAdmin, isUnitCorrespondent),
    '*': isSuperAdmin,
  },
  Mutation: {
    login: allow,
    resetPassword: allow,
    sendResetPassword: allow,
    jwtRefresh: isAuthenticated,
    openIDRequest: allow,
    openIDLogin: allow,
    createUser: or(isAdmin, isSuperAdmin, isUnitCorrespondent),
    editUser: or(isAdmin, isSuperAdmin, isUnitCorrespondent),
    addUserRole: or(isAdmin, isSuperAdmin, isUnitCorrespondent),
    deleteUserRole: or(isAdmin, isSuperAdmin, isUnitCorrespondent),
    deleteUser: or(isAdmin, isSuperAdmin, isUnitCorrespondent),
    mutateCampus: or(isAdmin, isSuperAdmin, canHandleRequest, canHandleVisitor),
    editCampus: or(isAdmin, isSuperAdmin),
    editMe: isAuthenticated,
    '*': isSuperAdmin,
  },
  CampusMutation: {
    createRequest: or(canHandleRequest, isAdmin),
    editRequest: or(canHandleRequest, isAdmin),
    deleteRequest: or(canHandleRequest, isAdmin),
    mutateRequest: or(canHandleRequest, canHandleVisitor, isAdmin),
    shiftRequest: or(canHandleRequest, isAdmin),
    createPlace: or(isAdmin, isSuperAdmin),
    editPlace: or(isAdmin, isSuperAdmin),
    deletePlace: or(isAdmin, isSuperAdmin),
    generateCSVExportLink: or(canHandleRequest, isAdmin),
    '*': isSuperAdmin,
  },
  RequestMutation: {
    createVisitor: or(canHandleRequest, isAdmin),
    editVisitor: or(canHandleRequest, isAdmin),
    deleteVisitor: or(canHandleRequest, isAdmin),
  },
}, {
  allowExternalErrors: true,
});
