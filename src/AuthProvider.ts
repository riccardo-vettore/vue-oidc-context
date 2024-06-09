import { User, UserManager, UserManagerSettings } from "oidc-client-ts"

/**
 * @public
 */
export interface AuthProviderBaseProps {

    /**
     * On sign in callback hook. Can be a async function.
     * Here you can remove the code and state parameters from the url when you are redirected from the authorize page.
     *
     * ```jsx
     * const onSigninCallback = (_user: User | void): void => {
     *     window.history.replaceState(
     *         {},
     *         document.title,
     *         window.location.pathname
     *     )
     * }
     * ```
     */
    onSigninCallback?: (user: User | void) => Promise<void> | void

    /**
     * By default, if the page url has code/state params, this provider will call automatically the `userManager.signinCallback`.
     * In some cases the code might be for something else (another OAuth SDK perhaps). In these
     * instances you can instruct the client to ignore them.
     *
     * ```jsx
     * <AuthProvider
     *   :skip-signin-callback={window.location.pathname === "/stripe-oauth-callback"}
     * >
     * ```
     */
    skipSigninCallback?: boolean

    /**
     * Match the redirect uri used for logout (e.g. `post_logout_redirect_uri`)
     * This provider will then call automatically the `userManager.signoutCallback`.
     *
     * HINT:
     * Do not call `userManager.signoutRedirect()` within a Vue watch, otherwise the
     * logout might be unsuccessful.
     *
     * ```jsx
     * <AuthProvider
     *   :match-signout-callback="(args) => {
     *     window &&
     *     (window.location.href === args.post_logout_redirect_uri)
     *   }"
     * ```
     */
    matchSignoutCallback?: (args: UserManagerSettings) => boolean

    /**
     * On sign out callback hook. Can be a async function.
     * Here you can change the url after the user is signed out.
     * When using this, specifying `matchSignoutCallback` is required.
     *
     * ```jsx
     * const onSignoutCallback = (): void => {
     *     // go to home after logout
     *     window.location.pathname = ""
     * }
     * ```
     */
    onSignoutCallback?: () => Promise<void> | void

    /**
     * On remove user hook. Can be a async function.
     * Here you can change the url after the user is removed.
     *
     * ```jsx
     * const onRemoveUser = (): void => {
     *     // go to home after logout
     *     window.location.pathname = ""
     * }
     * ```
     */
    onRemoveUser?: () => Promise<void> | void
}


/**
 * This interface (default) is used to pass `UserManagerSettings` together with `AuthProvider` properties to the provider.
 *
 * @public
 */
export interface AuthProviderNoUserManagerProps extends AuthProviderBaseProps, UserManagerSettings {
    /**
     * Prevent this property.
     */
    userManager?: never
}

/**
 * This interface is used to pass directly a `UserManager` instance together with `AuthProvider` properties to the provider.
 *
 * @public
 */
export interface AuthProviderUserManagerProps extends AuthProviderBaseProps {
    /**
     * Allow passing a custom UserManager instance.
     */
    userManager?: UserManager
}

export type AuthProviderProps = AuthProviderNoUserManagerProps | AuthProviderUserManagerProps
