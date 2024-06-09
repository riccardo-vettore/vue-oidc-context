import type { Component, VNode } from "vue"
import { defineAsyncComponent, h, ref, watch } from 'vue'
import type { SigninRedirectArgs } from "oidc-client-ts"
import { useAuth } from "./useAuth.ts"
import { hasAuthParams } from "./utils.ts"

/**
 * @public
 */
export interface WithAuthenticationRequiredProps {
    /**
     * Show a message when redirected to the signin page.
     */
    onRedirecting?: VNode

    /**
     * Allows executing logic before the user is redirected to the signin page.
     */
    onBeforeSignin?: () => Promise<void> | void

    /**
     * Pass additional signin redirect arguments.
     */
    signinRedirectArgs?: SigninRedirectArgs
}

export type WrappedComponent = Component

/**
 * A public higher-order component to protect accessing not public content. When you wrap your components in this higher-order
 * component and an anonymous user visits your component, they will be redirected to the login page after logging in, they
 * will return to the page from which they were redirected.
 *
 * @public
 */
export const withAuthenticationRequired = (WrappedComponent: WrappedComponent, options: WithAuthenticationRequiredProps = {}) => {
    // we will return new component that render's WrappedComponent
    return {
        setup() {
            const {onBeforeSignin, signinRedirectArgs, onRedirecting = h('div')} = options
            const auth = useAuth()
            const isLoading = ref(auth.value.isLoading)
            const activeNavigator = ref(auth.value.activeNavigator)
            const isAuthenticated = ref(auth.value.isAuthenticated)
            const onBeforeSigninRef = ref(onBeforeSignin)
            const signinRedirectArgsRef = ref(signinRedirectArgs)
            watch([isLoading, isAuthenticated, onBeforeSigninRef, signinRedirectArgsRef], () => {
                if (
                    hasAuthParams() || isLoading.value || activeNavigator.value || isAuthenticated.value
                ) {
                    return
                }
                void (
                    async (): Promise<void> => {
                        onBeforeSigninRef.value && await onBeforeSigninRef.value()
                        await auth.value.signinRedirect(signinRedirectArgsRef.value)
                    }
                )()
            }, {immediate: true})
            return () => isAuthenticated.value ? h(WrappedComponent) : onRedirecting
        }
    }
}

/**
 * A public higher-order component to protect accessing not public content.
 * When you wrap your components in this higher-order component and an anonymous user visits your component,
 * they will be redirected to the login page; after logging in, they will return to the page from which they were redirected.
 *
 * This HOC is designed specifically for lazy-loading components.
 *
 * @public
**/
export const withAuthenticationRequiredAsync = (importComponent: () => Promise<{
	default: Component
}>, options: WithAuthenticationRequiredProps = {}) => {
	return defineAsyncComponent(() => {
		const auth = useAuth()
		return new Promise((resolve, reject) => {
			const {onBeforeSignin, signinRedirectArgs, onRedirecting = h('div')} = options
			const isLoading = ref(auth.value.isLoading)
			const activeNavigator = ref(auth.value.activeNavigator)
			const isAuthenticated = ref(auth.value.isAuthenticated)
			const onBeforeSigninRef = ref(onBeforeSignin)
			const signinRedirectArgsRef = ref(signinRedirectArgs)
			watch([isLoading, isAuthenticated, onBeforeSigninRef, signinRedirectArgsRef], () => {
				if (
					hasAuthParams() || isLoading.value || activeNavigator.value || isAuthenticated.value
				) {
					return
				}
				void (
					async (): Promise<void> => {
						onBeforeSigninRef.value && await onBeforeSigninRef.value()
						await auth.value.signinRedirect(signinRedirectArgsRef.value)
					}
				)()
			}, {immediate: true})
			//@ts-ignore
			isAuthenticated.value ? importComponent().then(resolve).catch(reject) : resolve({
				//@ts-ignore
				render() {
					return onRedirecting
				}
			})
		})
	})
}
