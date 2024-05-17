import type {
    UserManagerSettings, SessionStatus,
    SigninPopupArgs, SigninSilentArgs, SigninRedirectArgs,
    SignoutRedirectArgs, SignoutPopupArgs, QuerySessionStatusArgs,
    RevokeTokensTypes, SignoutSilentArgs, SigninResourceOwnerCredentialsArgs,
} from "oidc-client-ts";
import { UserManagerEvents, User } from "oidc-client-ts";
import type { AuthState } from "./AuthState.ts";
import type { Ref } from "vue";
import type { UseMemoizeReturn } from "@vueuse/core";

export interface userManagerContextResult {
    readonly settings: UserManagerSettings;
    readonly events: UserManagerEvents;
    clearStaleState(): Promise<void>;
    signinPopup(args?: SigninPopupArgs): Promise<User>;
    signinSilent(args?: SigninSilentArgs): Promise<User | null>;
    signinRedirect(args?: SigninRedirectArgs): Promise<void>;
    signinResourceOwnerCredentials(args: SigninResourceOwnerCredentialsArgs): Promise<User>;
    signoutRedirect(args?: SignoutRedirectArgs): Promise<void>;
    signoutPopup(args?: SignoutPopupArgs): Promise<void>;
    signoutSilent(args?: SignoutSilentArgs): Promise<void>;
    querySessionStatus(args?: QuerySessionStatusArgs): Promise<SessionStatus | null>;
    revokeTokens(types?: RevokeTokensTypes): Promise<void>;
    startSilentRenew(): void;
    stopSilentRenew(): void;
}

/**
 * @public
 */
export interface AuthContextProps {
    /**
     * UserManager functions. See [UserManager](https://github.com/authts/oidc-client-ts) for more details.
     */
    state: Ref<AuthState>,
    userManagerContext: UseMemoizeReturn<userManagerContextResult, []>
    removeUser: UseMemoizeReturn<Promise<void>, []>
}

