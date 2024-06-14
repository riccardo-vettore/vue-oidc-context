import {describe, expect, test, vi} from 'vitest';
import {createWrapper} from './helpers';
import {User, UserManager} from 'oidc-client-ts';
import {useAuth} from '../src';
import {nextTick} from 'vue';

const settingsStub = {
    authority: 'authority',
    client_id: 'client',
    redirect_uri: 'redirect',
};
const user = {id_token: '__test_user__'} as User;

describe('AuthProvider', () => {
    test('should signinRedirect when asked', async () => {
        const wrapper = createWrapper({...settingsStub});
        setTimeout(async () => {
            const auth = useAuth()
            expect(auth.value.user).toBeUndefined()

            await auth.value.signinRedirect()

            expect(UserManager.prototype.signinRedirect).toHaveBeenCalled();
            expect(UserManager.prototype.getUser).toHaveBeenCalled();
        }, 100)
    });

    test('should handle signinCallback success and call onSigninCallback', async () => {
        // arrange
        const onSigninCallback = vi.fn();
        window.history.pushState(
            {},
            document.title,
            '/?code=__test_code__&state=__test_state__',
        );
        expect(window.location.href).toBe(
            'https://www.example.com/?code=__test_code__&state=__test_state__',
        );

        const wrapper = createWrapper({...settingsStub, onSigninCallback});

        setTimeout(async () => {
            const auth = useAuth()
            expect(onSigninCallback).toHaveBeenCalledTimes(1)
            expect(UserManager.prototype.signinCallback).toHaveBeenCalledTimes(1)
        }, 100)
    });

    test('should handle signinCallback errors and call onSigninCallback', async () => {
        // arrange
        const onSigninCallback = vi.fn();
        window.history.pushState(
            {},
            document.title,
            '/?error=__test_error__&state=__test_state__',
        );
        expect(window.location.href).toBe(
            'https://www.example.com/?error=__test_error__&state=__test_state__',
        );

        const wrapper = createWrapper({...settingsStub, onSigninCallback})

        setTimeout(async () => {
            const auth = useAuth()
            expect(onSigninCallback).toHaveBeenCalledTimes(1)
            expect(UserManager.prototype.signinCallback).toHaveBeenCalledTimes(1)
        }, 100)
    });

    test('should handle signoutCallback success and call onSignoutCallback', async () => {
        // arrange
        const onSignoutCallback = vi.fn();
        window.history.pushState(
            {},
            document.title,
            '/signout-callback',
        );
        expect(window.location.pathname).toBe(
            '/signout-callback',
        );

        createWrapper({
            ...settingsStub,
            post_logout_redirect_uri: 'https://www.example.com/signout-callback',
            matchSignoutCallback: () => window.location.pathname === '/signout-callback',
            onSignoutCallback,
        });

        setTimeout(async () => {
            const auth = useAuth()
            expect(onSignoutCallback).toHaveBeenCalledTimes(1)
            expect(UserManager.prototype.signoutCallback).toHaveBeenCalledTimes(1);
        }, 100)
    });

    test('should signinResourceOwnerCredentials when asked', async () => {
        // arrange
        const wrapper = createWrapper({...settingsStub});

        setTimeout(async () => {
            const auth = useAuth()
            expect(auth.value.user).toBeUndefined()
            expect(UserManager.prototype.signinCallback).toHaveBeenCalledTimes(1)

            await auth.value.signinResourceOwnerCredentials({
                username: 'username',
                password: 'password',
                skipUserInfo: false,
            })

            expect(UserManager.prototype.signinResourceOwnerCredentials).toHaveBeenCalled();
            expect(UserManager.prototype.getUser).toHaveBeenCalled();
        }, 100)
    });

    test('should handle removeUser and call onRemoveUser', async () => {
        const onRemoveUser = vi.fn();

        createWrapper({...settingsStub, onRemoveUser});
        setTimeout(async () => {
            const auth = useAuth()
            await auth.value.removeUser()
            expect(onRemoveUser).toHaveBeenCalled()
            expect(UserManager.prototype.removeUser).toHaveBeenCalled()
        }, 100)
    });

    test('should handle signoutSilent', async () => {
        createWrapper({...settingsStub});
        setTimeout(async () => {
            const auth = useAuth()
            await auth.value.signoutSilent()
            expect(UserManager.prototype.signoutSilent).toHaveBeenCalled();
        }, 100)
    });

    test('should get the user', async () => {
        const userManager = vi.mocked(
            UserManager.prototype,
        )
        userManager.getUser = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                resolve(user);
            });
        });
        createWrapper({...settingsStub});

        setTimeout(async () => {
            const auth = useAuth()
            expect(UserManager.prototype.getUser).toHaveBeenCalled()
            expect(UserManager.prototype.signoutSilent).toHaveBeenCalled()
            expect(auth.value.user).toBe(user)
        }, 100)
    });

    test('should allow passing a custom UserManager', async () => {
        // arrange
        const customUserManager = new UserManager({...settingsStub});
        customUserManager.signinRedirect = vi
            .fn()
            .mockResolvedValue(undefined);

        const wrapper = createWrapper({
            userManager: customUserManager,
        });

        setTimeout(() => {
            const auth = useAuth()
            expect(auth.value.user).toBeUndefined()
            auth.value.signinRedirect()
            expect(UserManager.prototype.signinRedirect).not.toHaveBeenCalled();
            expect(customUserManager.signinRedirect).toHaveBeenCalled();
        }, 100)
    });


    test('should throw an error if user manager and custom settings are passed in', async () => {
        // arrange
        const customUserManager = new UserManager({...settingsStub});

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const wrapper = createWrapper({
            ...settingsStub,
            userManager: customUserManager,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        setTimeout(() => {
            expect(wrapper).throw(TypeError);
        }, 100)
    });

    test('should set isLoading to false after initializing', async () => {
        const wrapper = createWrapper({...settingsStub});
        setTimeout(() => {
            const auth = useAuth()
            expect(auth.value.isLoading).toBe(true)
            expect(auth.value.isLoading).toBe(false)
        }, 100)
    });

    test('should set isLoading to true during a navigation', async () => {
        // arrange
        let resolve: (value: User) => void;
        const userManager = vi.mocked(
            UserManager.prototype,
        )
        userManager.signinPopup = vi.fn().mockReturnValue(
            new Promise((_resolve) => {
                resolve = _resolve;
            }),
        );
        const wrapper = createWrapper({...settingsStub})
        setTimeout(() => {
            const auth = useAuth()
            expect(auth.value.isLoading).toBe(false)
            auth.value.signinPopup()
            expect(auth.value.isLoading).toBe(true)
            resolve({} as User)
            expect(auth.value.isLoading).toBe(false);
        }, 100)

        userManager.signinPopup.mockRestore();
    });
    test('should set activeNavigator based on the most recent navigation', async () => {
        // arrange
        let resolve: (value: User) => void;
        const userManager = vi.mocked(
            UserManager.prototype,
        )
        userManager.signinPopup = vi.fn().mockReturnValue(
            new Promise((_resolve) => {
                resolve = _resolve;
            }),
        );
        const wrapper = createWrapper({...settingsStub});

        setTimeout(() => {
            const auth = useAuth()
            expect(auth.value.activeNavigator).toBe(undefined)
            auth.value.signinPopup()
            expect(auth.value.activeNavigator).toBe('signinPopup')
            resolve({} as User)
            expect(auth.value.activeNavigator).toBe(undefined)
        }, 100)

        userManager.signinPopup.mockRestore()
    });
});
