<script setup lang="ts">
import { WebStorageStateStore } from "oidc-client-ts";
import Home from "./components/Home.vue";
import AuthProvider from '../../src/AuthProvider.vue';


const oidcConfig = {
	authority: "...",
	client_id: "...",
	redirect_uri: window.location.origin,
	userStore: new WebStorageStateStore({store: window.localStorage})
};

const onSigninCallback = () => {
	window.history.replaceState(
		{},
		document.title,
		window.location.origin
	)
}
</script>

<template>
	<AuthProvider
		:authority="oidcConfig.authority"
		:client_id="oidcConfig.client_id"
		:redirect_uri="oidcConfig.redirect_uri"
		:on-signin-callback="onSigninCallback"
		:user-store="oidcConfig.userStore"
		:automatic-silent-renew="true"
	>
		<Home />
	</AuthProvider>
</template>

<style scoped>
</style>
