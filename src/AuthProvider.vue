<script setup lang="ts">
import { ref, computed, watchEffect, onMounted, provide } from 'vue';
import {
	UserManager,
	UserManagerSettings,
	ProcessResourceOwnerPasswordCredentialsArgs,
	User
} from 'oidc-client-ts';
import { initialAuthState } from './AuthState';
import {reducer, useReducer} from './reducer';
import { hasAuthParams, signinError, signoutError } from './utils';
import { AuthProviderProps } from "./AuthProvider.ts";

const {
	onSigninCallback: onSigninCallbackProp,
	skipSigninCallback: skipSigninCallbackProp,
	matchSignoutCallback: matchSignoutCallbackProp,
	onSignoutCallback: onSignoutCallbackProp,
	onRemoveUser,
	userManager: userManagerProp = undefined,
	...userManagerSettings
} = defineProps<AuthProviderProps>()
const {state, dispatch} = useReducer(reducer, initialAuthState);


const UserManagerImpl =
	typeof window === "undefined" ? null : UserManager;

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


const didInitialize = ref(false);

const userManagerContextKeys = [
	'clearStaleState',
	'querySessionStatus',
	'revokeTokens',
	'startSilentRenew',
	'stopSilentRenew'
] as const;
const navigatorKeys = [
	'signinPopup',
	'signinSilent',
	'signinRedirect',
	'signinResourceOwnerCredentials',
	'signoutPopup',
	'signoutRedirect',
	'signoutSilent'
] as const;

const unsupportedEnvironment = (fnName: string) => () => {
	throw new Error(
		`UserManager#${fnName} was called from an unsupported context. If this is a server-rendered page, defer this call with onMounted or pass a custom UserManager implementation.`
	);
};

const userManagerContext = ref({});

if (userManager.value) {
	userManagerContext.value = Object.assign(
		{
			settings: userManager.value.settings,
			events: userManager.value.events,
		},
		Object.fromEntries(
			userManagerContextKeys.map((key) => [
				key,
				userManager.value[key]?.bind(userManager.value) ?? unsupportedEnvironment(key),
			]),
		) as Pick<UserManager, typeof userManagerContextKeys[number]>,
		Object.fromEntries(
			navigatorKeys.map((key) => [
				key,
				userManager.value[key]
					? async (args: ProcessResourceOwnerPasswordCredentialsArgs & never[]) => {
						dispatch({
							type: 'NAVIGATOR_INIT',
							method: key,
						});
						try {
							return await userManager.value[key](args);
						} catch (error) {
							dispatch({type: 'ERROR', error: error as Error});
							return null;
						} finally {
							dispatch({type: 'NAVIGATOR_CLOSE'});
						}
					}
					: unsupportedEnvironment(key),
			]),
		) as Pick<UserManager, typeof navigatorKeys[number]>,
	);
}

onMounted(async () => {
	if (!userManager.value || didInitialize.value) return;
	didInitialize.value = true;

	try {
		let user = null;
		if (hasAuthParams() && !skipSigninCallbackProp) {
			user = await userManager.value.signinCallback();
			onSigninCallbackProp && (await onSigninCallbackProp(user));
		}
		user = user || (await userManager.value.getUser());
		dispatch({ type: 'INITIALISED', user });
	} catch (error) {
		dispatch({ type: 'ERROR', error: signinError(error) });
	}

	try {
		if (matchSignoutCallbackProp && matchSignoutCallbackProp(userManager.value.settings as UserManagerSettings)) {
			await userManager.value.signoutCallback();
			onSignoutCallbackProp && (await onSignoutCallbackProp());
		}
	} catch (error) {
		dispatch({ type: 'ERROR', error: signoutError(error) });
	}
});

watchEffect(() => {
	if (!userManager.value) return;

	const handleUserLoaded = (user: User) => {
		dispatch({ type: 'USER_LOADED', user });
	};
	const handleUserUnloaded = () => {
		dispatch({ type: 'USER_UNLOADED' });
	};
	const handleUserSignedOut = () => {
		dispatch({ type: 'USER_SIGNED_OUT' });
	};
	const handleSilentRenewError = (error: any) => {
		dispatch({ type: 'ERROR', error });
	};

	userManager.value.events.addUserLoaded(handleUserLoaded);
	userManager.value.events.addUserUnloaded(handleUserUnloaded);
	userManager.value.events.addUserSignedOut(handleUserSignedOut);
	userManager.value.events.addSilentRenewError(handleSilentRenewError);

	return () => {
		userManager.value.events.removeUserLoaded(handleUserLoaded);
		userManager.value.events.removeUserUnloaded(handleUserUnloaded);
		userManager.value.events.removeUserSignedOut(handleUserSignedOut);
		userManager.value.events.removeSilentRenewError(handleSilentRenewError);
	};
});

const removeUser = async () => {
	if (!userManager.value) return unsupportedEnvironment('removeUser');
	await userManager.value.removeUser();
	onRemoveUser && onRemoveUser();
};

const contextValue = computed(() => ({
	...state.value,
	...userManagerContext.value,
	removeUser,
}));
provide('AuthContext', contextValue);
</script>

<template>
	<slot />
</template>
