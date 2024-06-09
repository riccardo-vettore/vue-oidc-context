<script setup lang="ts">
import { hasAuthParams, useAuth } from "../../../src";
import { ref, watch } from "vue";

const auth = useAuth()
const hasTriedSignin = ref(false);

// automatically sign-in
watch([auth, hasTriedSignin], () => {
	if (!hasAuthParams() &&
		!auth.value.isAuthenticated && !auth.value.activeNavigator && !auth.value.isLoading &&
		!hasTriedSignin.value
	) {
		auth.value.signinRedirect();
		hasTriedSignin.value = true;
	}
});
</script>

<template>
	<div />
	<div v-if="auth.activeNavigator === 'signinSilent'">
		Signing you in...
	</div>
	<div v-if="auth.activeNavigator === 'signoutRedirect'">
		Signing you out...
	</div>
	<div v-if="auth.isLoading">
		Loading...
	</div>
	<div v-if="auth.error">
		Oops... {{ auth.error.message }}
	</div>
	<div v-if="auth.isAuthenticated">
		Hello
		{{ auth.user?.profile.sub }}{{ " " }}
		<button @click="() => auth.removeUser()">
			Log out
		</button>
	</div>
	<div v-if="!auth.isLoading && !auth.isAuthenticated">
		<button @click="() => auth.signinRedirect()">
			Log in
		</button>
	</div>
</template>

<style scoped>
</style>
