import { vitest } from "vitest";
import { AuthProviderProps } from "../src/AuthProvider";
import { App, createApp, Slots } from "vue";
import AuthProvider, { useAuth } from "../src";
import { mount, shallowMount } from "@vue/test-utils";

export const createWrapper = (settingsStub: AuthProviderProps) => {
    const globalComponent = {
        components: {AuthProvider},
        data: () => settingsStub,
        template: `
              <auth-provider
                  :authority="authority"
                  :client_id="client_id"
                  :redirect_uri="redirect_uri"
              />
            `
    }
    return mount(globalComponent)
}

export const withSetup = (
    composable: () => typeof useAuth
): [typeof useAuth, App<Element>] => {
    let result: typeof useAuth | null = null
    const app = createApp({
        setup() {
            result = composable()
            // suppress missing template warning
            return () => {}
        }
    })
    app.mount(document.createElement('div'))
    // return the result and the app instance
    // for testing provide/unmount
    if (!result) {
        throw new Error('Composable is not define')
    }
    return [result, app]
}

export const createLocation = (search: string, hash: string): Location => {
    const location: Location = {
        search,
        hash,

        host: "www.example.com",
        protocol: "https:",
        ancestorOrigins: {} as DOMStringList,
        href: "",
        hostname: "",
        origin: "",
        pathname: "",
        port: "80",
        assign: vitest.fn(),
        reload: vitest.fn(),
        replace: vitest.fn(),
    };
    return location;
};
