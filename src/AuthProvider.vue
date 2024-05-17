<script setup lang="ts">

import {
  ProcessResourceOwnerPasswordCredentialsArgs,
  User,
  UserManager,
  UserManagerEvents,
  UserManagerSettings
} from "oidc-client-ts";
import { provide, ref, watch } from "vue";
import { useMemoize } from "@vueuse/core";
import { reducer, useReducer } from "./reducer.ts";
import { initialAuthState } from "./AuthState.ts";
import { hasAuthParams, signinError, signoutError } from "./utils.ts";
import type { AuthContextProps, userManagerContextResult } from "./AuthContext.ts";

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
  onSigninCallback?: (user: User | void) => Promise<void> | void;

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
  skipSigninCallback?: boolean;

  /**
   * Match the redirect uri used for logout (e.g. `post_logout_redirect_uri`)
   * This provider will then call automatically the `userManager.signoutCallback`.
   *
   * HINT:
   * Do not call `userManager.signoutRedirect()` within a `React.useEffect`, otherwise the
   * logout might be unsuccessful.
   *
   * ```jsx
   * <AuthProvider
   *   :match-signout-callback="(args) => {
   *     window &&
   *     (window.location.href === args.post_logout_redirect_uri);
   *   }"
   * ```
   */
  matchSignoutCallback?: (args: UserManagerSettings) => boolean;

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
  onSignoutCallback?: () => Promise<void> | void;

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
  onRemoveUser?: () => Promise<void> | void;
}

/**
 * This interface (default) is used to pass `UserManagerSettings` together with `AuthProvider` properties to the provider.
 *
 * @public
 */
export interface AuthProviderNoUserManagerProps extends AuthProviderBaseProps,  /* @vue-ignore */  UserManagerSettings {
  /**
   * Prevent this property.
   */
  userManager?: never;
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
  userManager?: UserManager;
}

export type AuthProviderProps = AuthProviderNoUserManagerProps | AuthProviderUserManagerProps;

const {
  onSigninCallback: onSigninCallbackProp,
  skipSigninCallback: skipSigninCallbackProp,
  matchSignoutCallback: matchSignoutCallbackProp,
  onSignoutCallback: onSignoutCallbackProp,
  onRemoveUser,
  userManager: userManagerProp = null,
  ...userManagerSettings
} = defineProps<AuthProviderProps>()

defineOptions({
  inheritAttrs: false
})

const UserManagerImpl =
    typeof window === "undefined" ? null : UserManager;

const userManagerContextKeys = [
  "clearStaleState",
  "querySessionStatus",
  "revokeTokens",
  "startSilentRenew",
  "stopSilentRenew",
] as const;
const navigatorKeys = [
  "signinPopup",
  "signinSilent",
  "signinRedirect",
  "signinResourceOwnerCredentials",
  "signoutPopup",
  "signoutRedirect",
  "signoutSilent",
] as const;
const unsupportedEnvironment = (fnName: string) => () => {
  throw new Error(
      `UserManager#${fnName} was called from an unsupported context. If this is a server-rendered page, defer this call with useEffect() or pass a custom UserManager implementation.`,
  );
};

const userManager = ref(
    userManagerProp ??
    (
        UserManagerImpl
            ? new UserManagerImpl(userManagerSettings as UserManagerSettings)
            : (
                {settings: userManagerSettings} as UserManager
            )
    )
)

const onSigninCallback = ref(onSigninCallbackProp)
const skipSigninCallback = ref(skipSigninCallbackProp)
const onSignoutCallback = ref(onSignoutCallbackProp)
const matchSignoutCallback = ref(matchSignoutCallbackProp)

const {state, dispatch} = useReducer(reducer, initialAuthState);

const userManagerContext = useMemoize<userManagerContextResult, []>(
    () =>
        Object.assign(
            {
              settings: userManager.value.settings,
              events: userManager.value.events,
            } as {
              readonly settings: UserManagerSettings;
              readonly events: UserManagerEvents;
            },
            Object.fromEntries(
                userManagerContextKeys.map((key) => [
                  key,
                  userManager.value[key]?.bind(userManager.value) ??
                  unsupportedEnvironment(key),
                ]),
            ) as Pick<UserManager, typeof userManagerContextKeys[number]>,
            Object.fromEntries(
                navigatorKeys.map((key) => [
                  key,
                  userManager.value[key]
                      ? async (args: ProcessResourceOwnerPasswordCredentialsArgs & never[]) => {
                        dispatch({
                          type: "NAVIGATOR_INIT",
                          method: key,
                        });
                        try {
                          return await userManager.value[key](args);
                        } catch (error) {
                          dispatch({type: "ERROR", error: error as Error});
                          return null;
                        } finally {
                          dispatch({type: "NAVIGATOR_CLOSE"});
                        }
                      }
                      : unsupportedEnvironment(key),
                ]),
            ) as Pick<UserManager, typeof navigatorKeys[number]>,
        )
);
userManagerContext()
const didInitialize = ref(false);

watch([userManager, skipSigninCallback, onSigninCallback, onSignoutCallback, matchSignoutCallback], () => {
  if (!userManager.value || didInitialize.value) {
    return;
  }
  didInitialize.value = true;

  void (
      async (): Promise<void> => {
        // sign-in
        let user: User | void | null = null;
        try {
          // check if returning back from authority server
          if (hasAuthParams() && !skipSigninCallback.value) {
            user = await userManager.value.signinCallback();
            onSigninCallback.value && await onSigninCallback.value(user);
          }
          user = !user ? await userManager.value.getUser() : user;
          dispatch({type: "INITIALISED", user});
        } catch (error) {
          dispatch({type: "ERROR", error: signinError(error)});
        }

        // sign-out
        try {
          if (matchSignoutCallback.value
              && matchSignoutCallback.value(userManager.value.settings as UserManagerSettings)) {
            await userManager.value.signoutCallback();
            onSignoutCallback.value && (
                await onSignoutCallback.value()
            );
          }
        } catch (error) {
          dispatch({type: "ERROR", error: signoutError(error)});
        }
      }
  )();
}, {immediate: true});

// register to userManager events
watch(userManager, () => {
  if (!userManager.value) return undefined;
  // event UserLoaded (e.g. initial load, silent renew success)
  const handleUserLoaded = (user: User) => {
    dispatch({type: "USER_LOADED", user});
  };
  userManager.value.events.addUserLoaded(handleUserLoaded);

  // event UserUnloaded (e.g. userManager.removeUser)
  const handleUserUnloaded = () => {
    dispatch({type: "USER_UNLOADED"});
  };
  userManager.value.events.addUserUnloaded(handleUserUnloaded);

  // event UserSignedOut (e.g. user was signed out in background (checkSessionIFrame option))
  const handleUserSignedOut = () => {
    dispatch({type: "USER_SIGNED_OUT"});
  };
  userManager.value.events.addUserSignedOut(handleUserSignedOut);

  // event SilentRenewError (silent renew error)
  const handleSilentRenewError = (error: Error) => {
    dispatch({type: "ERROR", error});
  };
  userManager.value.events.addSilentRenewError(handleSilentRenewError);

  return () => {
    userManager.value.events.removeUserLoaded(handleUserLoaded);
    userManager.value.events.removeUserUnloaded(handleUserUnloaded);
    userManager.value.events.removeUserSignedOut(handleUserSignedOut);
    userManager.value.events.removeSilentRenewError(handleSilentRenewError);
  };
}, {immediate: true});

const removeUser = useMemoize(
    userManager
        ? () => userManager.value.removeUser().then(onRemoveUser)
        : unsupportedEnvironment("removeUser"),
);

provide<AuthContextProps>('authContext', {
  state,
  userManagerContext,
  removeUser,
})

</script>

<template>
  <slot/>
</template>

<style scoped>

</style>
