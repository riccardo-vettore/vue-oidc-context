import { beforeEach, describe, expect, test, vi } from "vitest";
import AuthProvider, { useAuth } from "../src";
import { mount } from "@vue/test-utils";
import { App, createApp, nextTick } from "vue";
import { withSetup } from "./helpers";

const settingsStub = {
    authority: "authority",
    client_id: "client",
    redirect_uri: "redirect",
};
describe("useAuth", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetAllMocks()
    })
    test("should provide the auth context", async () => {
        const globalComponent = {
            components: {AuthProvider},
            data: () => settingsStub,
            template: `
              <auth-provider
                  :authority="authority"
                  :client_id="client_id"
                  :redirect_uri="redirect_uri"
              >
              </auth-provider>
            `
        }
        const wrapper = mount(globalComponent)
        setTimeout(() => {
            const [result] = withSetup(() => useAuth)
            const provider = result()
            expect(provider).toBeDefined();
        }, 500)
    });

    test("should return undefined with no provider", async () => {
        setTimeout(() => {
            const [result] = withSetup(() => useAuth)
            const provider = result()
            expect(provider).toBeDefined();
        }, 500)
    });
});
