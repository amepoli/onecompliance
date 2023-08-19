import { AuthStateType } from "../types";

export interface OCAuthState {
    state: AuthStateType;
    user?: any;
    session?: any;
}