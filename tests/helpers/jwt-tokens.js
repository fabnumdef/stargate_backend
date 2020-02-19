import User from "../models/user";
import {ROLE_SUPERADMIN} from "../../src/models/rules";

export const generateRoleJWTHeader = (role) => {
    const user = new User({
        roles: [{
            role,
        }],
    });
    const token = user.emitJWT();
    return ['Authorization', `Bearer ${token}`];
};

export const generateSuperAdminJWTHeader = (...params) => generateRoleJWTHeader(ROLE_SUPERADMIN, ...params);
export const generateAnonymousJWTHeader = () => ['Authorization', null];