import { inject, Ref } from 'vue'
import { userManagerContextResult } from './AuthContext.ts'

export const useAuth = (): Ref<userManagerContextResult> => {
    const context = inject<Ref<userManagerContextResult>>('AuthContext')
    if (!context) {
        const errorMessage = "AuthProvider context is undefined, please verify you are calling useAuth() as child of a <AuthProvider> component."
        console.error(errorMessage)
        throw new Error(errorMessage)
    }

    return context
}
