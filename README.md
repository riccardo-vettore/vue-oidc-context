# vue-oidc-context

Lightweight auth library using the
[oidc-client-ts](https://github.com/authts/oidc-client-ts) library for Vue
single page applications (SPA). Support for
[composables](https://vuejs.org/guide/reusability/composables) and
higher-order components (HOC)

## Table of Contents

- [Documentation](#documentation)
- [Installation](#installation)
- [Getting Started](#getting-started)

## Documentation

This library implements an auth context provider by making use of the
`oidc-client-ts` library. Its configuration is tight coupled to that library.

- [oidc-client-ts](https://github.com/authts/oidc-client-ts)

The
[`User`](https://authts.github.io/oidc-client-ts/classes/User.html)
and
[`UserManager`](https://authts.github.io/oidc-client-ts/classes/UserManager.html)
is hold in this context, which is accessible from the
Vue application. Additionally it intercepts the auth redirects by looking at
the query/fragment parameters and acts accordingly. You still need to setup a
redirect uri, which must point to your application, but you do not need to
create that route.

To renew the access token, the
[automatic silent renew]()
feature of `oidc-client-ts` can be used.

## Installation

Using [npm](https://npmjs.org/)

```bash
npm install oidc-client-ts vue-oidc-context --save
```

Using [pnpm](https://pnpm.io/)

```bash
pnpm add oidc-client-ts vue-oidc-context
```

## Getting Started

Configure the library by wrapping your application in `AuthProvider`:

```vue
// App.vue
<script setup lang="ts">
	
 import AuthProvider from "vue-oidc-context";
 
 const oidcConfig = {
  authority: "authority",
  client_id: "clientId",
  redirect_uri: window.location.origin
 };
 
</script>

<template>
	
 <AuthProvider 
  :authority="oidcConfig.authority"
  :client_id="oidcConfig.client_id"
  :redirect_uri="oidcConfig.redirect_uri"
 >
  <router-view/>
 </AuthProvider>
	
</template>
```

Use the `useAuth` component in your components to access authentication state
(`isLoading`, `isAuthenticated` and `user`) and userManagerContext with methods
(`signinRedirect` and `signOutRedirect`) and removeUser method:

```vue
// Home.vue
<script setup lang="ts">
	
 import { useAuth } from "vue-oidc-context";
 import { ref, watch } from "vue";
 import { hasAuthParams } from "vue-oidc-context";
 
 const auth = useAuth();
 const hasTriedSignin = ref(false)
	
</script>

<template>
	
 <div v-if="auth.activeNavigator === 'signinSilent'">
  Signing you in...
 </div>
 <div v-if="auth.activeNavigator === 'signoutRedirect'">
  Signing you out...
 </div>
 <div v-if="auth.isLoading">Loading...</div>
 <div v-if="auth.error">Oops... {{ state.error.message }}</div>
 <div v-if="auth.isAuthenticated">
  Hello {{ state.user?.profile.sub }}{{ " " }}
  <button @click="() => auth.removeUser()">Log out</button>
 </div>
 <div v-if="!auth.isLoading && !auth.isAuthenticated">
  <button @click="() => auth.signinRedirect()">Log in</button>
 </div>
	
</template>
```

You **must** provide an implementation of `onSigninCallback` to `oidcConfig` to remove the payload from the URL upon successful login. Otherwise if you refresh the page and the payload is still there, `signinSilent` - which handles renewing your token - won't work.

A working implementation is already in the code [here](https://github.com/riccardo-vettore/vue-oidc-context/blob/19ce24d0fee26125147534a64d7db6333be77cb1/src/AuthProvider.ts#L8).


### Call a protected API

As a child of `AuthProvider` with a user containing an access token:

```vue
// Posts.vue
<script setup lang="ts">

 import { useAuth } from "vue-oidc-context";
 import { ref } from "vue";
 
 const auth = useAuth()
 const posts = ref()
 
 const getPosts = async () => {
  try {
   const token = auth.value.user?.access_token;
   const response = await fetch("https://api.example.com/posts", {
     headers: {
      Authorization: `Bearer ${token}`,
    },
   });
   posts.value = await response.json()
  } catch (e) {
   console.error(e)
  }
 }
 
</script>

<template>
	
 <div v-if="!posts.length">Loading...</div>
 <ul>
  <li 
   v-for="(post, index) in posts"
   :key="index"
  >
   {{post}}
  </li>
 </ul>
	
</template>
```

### Protect a (vue-router) route 

Secure a route component by using the `withAuthenticationRequired` higher-order component. If a user attempts
to access this route without authentication, they will be redirected to the login page.

```ts
// router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import Home from "../sections/Home.vue";
import { withAuthenticationRequired } from "vue-oidc-context";

const routes = [
 //...
 {
  path: '/home',
  name: 'home',
  component: withAuthenticationRequired(Home)
 },
 //...
]

const router = createRouter({
 history: createWebHistory(''),
 routes
})

export default router
```

Define `Callback.vue` component if you want remove `code` and `state` query params.
```vue
<script setup lang="ts">
	
 import { watch } from "vue";
 import { useAuth } from "vue-oidc-context";
 const auth = useAuth();

 watch(auth, () => {
  if (!auth.value.isLoading && auth.value.isAuthenticated) {
   window.location.replace(window.location.origin + '/home')
  }
 })
	
</script>

<template>
 <div>...Loading</div>
</template>
```
Append `Callback.vue` in routes
```ts
// router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import Home from "../sections/Home.vue";
import { withAuthenticationRequired } from "vue-oidc-context";

const routes = [
 //...
 {
  path: '/home',
  name: 'home',
  component: withAuthenticationRequired(Home)
 },
 {
  name: 'callback',
  path: '/callback',
  component: Callback
 },
 //...
]

const router = createRouter({
 history: createWebHistory(''),
 routes
})

export default router
```

### Adding event listeners

The underlying [`UserManagerEvents`](https://authts.github.io/oidc-client-ts/classes/UserManagerEvents.html) instance can be imperatively managed with the `useAuth` composable.

```vue
// Home.vue
<script setup lang="ts">
	
 import { useAuth } from "vue-oidc-context";
 import { ref, watch } from "vue";
 import { hasAuthParams } from "vue-oidc-context";
 
 const auth = useAuth();
 const hasTriedSignin = ref(false)
 
 watch([auth.value.events, auth.value.signinSilent],() => {
	 auth.value.events.addAccessTokenExpiring(() => {
   if (alert("You're about to be signed out due to inactivity. Press continue to stay signed in.")) {
	   auth.value.signinSilent();
   }
  })
 })
	
</script>

<template>
	
 <button @click="() => auth.signinRedirect()">Log in</button>
	
</template>
```

### Automatic sign-in

Automatically sign-in and silently reestablish your previous session, if you close the tab and reopen the application.

```vue
// App.vue
<script setup lang="ts">

 const oidcConfig: AuthProviderProps = {
  //...
  userStore: new WebStorageStateStore({store: window.localStorage}),
 }

</script>
```

```vue
// Home.vue
<script setup lang="ts">
	
 import { useAuth } from "vue-oidc-context";
 import { ref, watch } from "vue";
 import { hasAuthParams } from "vue-oidc-context";
 
 const auth = useAuth();
 const hasTriedSignin = ref(false)
 
 watch([auth, hasTriedSignin],() => {
  if (!hasAuthParams() && !auth.value.isAuthenticated && !auth.value.activeNavigator
   && !auth.value.isLoading && !hasTriedSignin.value
  ) {
	  auth.signinRedirect()
   hasTriedSignin.value = true
  }
 })
	
</script>

<template>
	
  <div v-if="auth.activeNavigator === 'signinSilent'">
    Signing you in...
  </div>
  <div v-if="auth.activeNavigator === 'signoutRedirect'">
    Signing you out...
  </div>
  <div v-if="auth.isLoading">Loading...</div>
  <div v-if="auth.error">Oops... {{ state.error.message }}</div>
  <div v-if="auth.isAuthenticated">
    Hello {{ state.user?.profile.sub }}{{ " " }}
    <button @click="() => auth.removeUser()">Log out</button>
  </div>
  <div v-if="!auth.isLoading && !auth.isAuthenticated">
    <button @click="() => auth.signinRedirect()">Log in</button>
  </div>
	
</template>
```
