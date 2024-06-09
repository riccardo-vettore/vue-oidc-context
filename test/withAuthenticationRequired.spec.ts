import { describe, expect, test, vi } from 'vitest';
import AuthProvider, { userManagerContextResult, withAuthenticationRequired } from '../src';
import { h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import * as useAuthModule from '../src/useAuth';

const settingsStub = {authority: 'authority', client_id: 'client', redirect_uri: 'redirect'};
describe('withAuthenticationRequired', () => {
	test('should block access to a private component when not authenticated', async () => {
		const useAuthMock = vi.spyOn(useAuthModule, 'useAuth');
		const authContext = ref({
			isLoading: false,
			isAuthenticated: false,
			signinRedirect: () => {
			},
		} as userManagerContextResult);
		useAuthMock.mockReturnValue(authContext as any);

		const PrivateComponent = {
			template: '<div>Private</div>',
		};
		const WithAuthComponent = withAuthenticationRequired(PrivateComponent);

		const globalComponent = {
			components: {WithAuthComponent, AuthProvider},
			data: () => settingsStub,
			template: `
				<auth-provider
					:authority="authority"
					:client_id="client_id"
					:redirect_uri="redirect_uri"
				>
					<with-auth-component></with-auth-component>
				</auth-provider>
			`,
		};
		const wrapper = mount(globalComponent);

		expect(useAuthMock).toHaveBeenCalled();
		expect(wrapper.html()).not.toContain('Private');
	});

	test('should allow access to a private component when authenticated', async () => {
		const useAuthMock = vi.spyOn(useAuthModule, 'useAuth');
		const signinRedirectMock = vi.fn().mockResolvedValue(undefined);
		const authContext = ref({
			isLoading: false,
			isAuthenticated: true,
			signinRedirect: signinRedirectMock,
		});
		useAuthMock.mockReturnValue(authContext as any);

		const PrivateComponent = {
			template: '<div>Private</div>',
		};
		const WithAuthComponent = withAuthenticationRequired(PrivateComponent);

		const globalComponent = {
			components: {WithAuthComponent, AuthProvider},
			data: () => settingsStub,
			template: `
				<auth-provider
					:authority="authority"
					:client_id="client_id"
					:redirect_uri="redirect_uri"
				>
					<with-auth-component></with-auth-component>
				</auth-provider>
			`,
		};
		const wrapper = mount(globalComponent);

		expect(signinRedirectMock).not.toHaveBeenCalled()
		expect(wrapper.html()).toContain('Private');
	});

	test('should show a custom redirecting message when not authenticated', async () => {
		const useAuthMock = vi.spyOn(useAuthModule, 'useAuth');
		const signinRedirectMock = vi.fn().mockResolvedValue(undefined);
		const authContext = ref({
			isLoading: false,
			isAuthenticated: false,
			signinRedirect: signinRedirectMock,
		});
		useAuthMock.mockReturnValue(authContext as any);

		const PrivateComponent = {
			template: '<div>Private</div>'
		}
		const OnRedirectingComponent = {
			template: '<div>Redirecting</div>'
		}
		const WrappedComponent = withAuthenticationRequired(PrivateComponent, {
			onRedirecting: h(OnRedirectingComponent),
		});

		const globalComponent = {
			components: {WrappedComponent, AuthProvider},
			data: () => settingsStub,
			template: `
				<auth-provider
					:authority="authority"
					:client_id="client_id"
					:redirect_uri="redirect_uri"
				>
					<wrapped-component></wrapped-component>
				</auth-provider>
			`
		}
		const wrapper = mount(globalComponent)
		expect(wrapper.html()).toContain('Redirecting');
	});

	test('should call onBeforeSignin before signinRedirect', async () => {
		const useAuthMock = vi.spyOn(useAuthModule, 'useAuth');
		const signinRedirectMock = vi.fn().mockResolvedValue(undefined);
		const authContext = ref({
			isLoading: false,
			isAuthenticated: false,
			signinRedirect: signinRedirectMock,
		});
		useAuthMock.mockReturnValue(authContext as any);

		const PrivateComponent = {
			template: '<div>Private</div>'
		}
		const onBeforeSigninMock = vi.fn();
		const WrappedComponent = withAuthenticationRequired(PrivateComponent, {
			onBeforeSignin: onBeforeSigninMock,
		});

		const globalComponent = {
			components: {WrappedComponent, AuthProvider},
			data: () => settingsStub,
			template: `
				<auth-provider
					:authority="authority"
					:client_id="client_id"
					:redirect_uri="redirect_uri"
				>
					<wrapped-component></wrapped-component>
				</auth-provider>
			`
		}
		const wrapper = mount(globalComponent)

		expect(onBeforeSigninMock).toHaveBeenCalled()
		setTimeout(() => {
			expect(signinRedirectMock).toHaveBeenCalled()
		}, 500)
	});

	test('should pass additional options on to signinRedirect', async () => {
		const useAuthMock = vi.spyOn(useAuthModule, 'useAuth');
		const signinRedirectMock = vi.fn().mockResolvedValue(undefined);
		const authContext = ref({
			isLoading: false,
			isAuthenticated: false,
			signinRedirect: signinRedirectMock,
		});
		useAuthMock.mockReturnValue(authContext as any);

		const PrivateComponent = {
			template: '<div>Private</div>'
		}

		const WrappedComponent = withAuthenticationRequired(PrivateComponent, {
			signinRedirectArgs: {
				redirect_uri: 'foo',
			},
		});

		const globalComponent = {
			components: {WrappedComponent, AuthProvider},
			data: () => settingsStub,
			template: `
				<auth-provider
					:authority="authority"
					:client_id="client_id"
					:redirect_uri="redirect_uri"
				>
					<wrapped-component></wrapped-component>
				</auth-provider>
			`
		}
		const wrapper = mount(globalComponent)

		expect(signinRedirectMock).toHaveBeenCalledWith(
			expect.objectContaining({
				redirect_uri: 'foo',
			}),
		)
	});
	test('should call signinRedirect only once even if parent state changes', async () => {
		const useAuthMock = vi.spyOn(useAuthModule, 'useAuth');
		const signinRedirectMock = vi.fn().mockResolvedValue(undefined);
		const authContext = ref({
			isLoading: false,
			isAuthenticated: false,
			signinRedirect: signinRedirectMock,
		});
		useAuthMock.mockReturnValue(authContext as any);

		const PrivateComponent = {
			template: '<div>Private</div>'
		}
		const WrappedComponent = withAuthenticationRequired(PrivateComponent)

		const app = {
			components: {WrappedComponent, AuthProvider},
			props: ['foo'],
			data: () => settingsStub,
			template: `
				<div>
					{{ foo }}
					<auth-provider
						:authority="authority"
						:client_id="client_id"
						:redirect_uri="redirect_uri"
					>
						<wrapped-component></wrapped-component>
					</auth-provider>
				</div>
			`
		}
		const wrapper = mount(app, {props: {foo: 1}})

		expect(signinRedirectMock).toHaveBeenCalled()

		signinRedirectMock.mockClear();
		const wrapper2 = mount(app, {props: {foo: 2}})
		setTimeout(() => {
			expect(signinRedirectMock).not.toHaveBeenCalled()
		}, 500)
	});
});
