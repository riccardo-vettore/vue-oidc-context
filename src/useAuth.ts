import { inject } from "vue";
import type { AuthContextProps } from "./AuthContext.ts";

export const useAuth = (): AuthContextProps => {
    const context = inject<AuthContextProps>('authContext');
    if (!context) {
        const errorMessage = "AuthProvider context is undefined, please verify you are calling useAuth() as child of a <AuthProvider> component."
        console.error(errorMessage);
        throw new Error(errorMessage)
    }

    return context;
};
