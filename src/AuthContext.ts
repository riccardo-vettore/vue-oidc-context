import type {
    QuerySessionStatusArgs,
    RevokeTokensTypes,
    SessionStatus,
    SigninPopupArgs,
    SigninRedirectArgs,
    SigninResourceOwnerCredentialsArgs,
    SigninSilentArgs,
    SignoutPopupArgs,
    SignoutRedirectArgs,
    SignoutSilentArgs,
    UserManagerSettings,
} from 'oidc-client-ts';
import { User, UserManagerEvents } from 'oidc-client-ts';
import type { AuthState } from './AuthState.ts';
import type { Ref } from 'vue';

export interface userManagerContextResult extends AuthState {
    readonly settings: UserManagerSettings
    readonly events: UserManagerEvents

    clearStaleState(): Promise<void>

	removeUser(): Promise<void>

	signinPopup(args?: SigninPopupArgs): Promise<User>

    signinSilent(args?: SigninSilentArgs): Promise<User | null>

    signinRedirect(args?: SigninRedirectArgs): Promise<void>

    signinResourceOwnerCredentials(args: SigninResourceOwnerCredentialsArgs): Promise<User>

    signoutRedirect(args?: SignoutRedirectArgs): Promise<void>

    signoutPopup(args?: SignoutPopupArgs): Promise<void>

    signoutSilent(args?: SignoutSilentArgs): Promise<void>

    querySessionStatus(args?: QuerySessionStatusArgs): Promise<SessionStatus | null>

    revokeTokens(types?: RevokeTokensTypes): Promise<void>

    startSilentRenew(): void

    stopSilentRenew(): void
}

export type AuthContextProps = Ref<userManagerContextResult | AuthState>

