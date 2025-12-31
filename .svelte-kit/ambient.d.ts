
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```sh
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const DATABASE_URL: string;
	export const AMAP_KEY: string;
	export const AMAP_SECURITY_CODE: string;
	export const NVM_INC: string;
	export const PYCHARM_VM_OPTIONS: string;
	export const WEBIDE_VM_OPTIONS: string;
	export const TERM_PROGRAM: string;
	export const NODE: string;
	export const SSL_CERT_FILE: string;
	export const INIT_CWD: string;
	export const NVM_CD_FLAGS: string;
	export const ANDROID_HOME: string;
	export const NOTION_TOKEN: string;
	export const TERM: string;
	export const JETBRAINSCLIENT_VM_OPTIONS: string;
	export const SHELL: string;
	export const HOMEBREW_API_DOMAIN: string;
	export const HOMEBREW_BOTTLE_DOMAIN: string;
	export const CURL_CA_BUNDLE: string;
	export const HOMEBREW_REPOSITORY: string;
	export const TMPDIR: string;
	export const npm_config__alife_registry: string;
	export const VSCODE_PYTHON_AUTOACTIVATE_GUARD: string;
	export const TERM_PROGRAM_VERSION: string;
	export const ZDOTDIR: string;
	export const ORIGINAL_XDG_CURRENT_DESKTOP: string;
	export const MallocNanoZone: string;
	export const npm_config__terminus_registry: string;
	export const npm_config_registry: string;
	export const ENABLE_IDE_INTEGRATION: string;
	export const NVM_DIR: string;
	export const USER: string;
	export const COMMAND_MODE: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const REQUESTS_CA_BUNDLE: string;
	export const CLAUDE_CODE_SSE_PORT: string;
	export const PHPSTORM_VM_OPTIONS: string;
	export const SSH_AUTH_SOCK: string;
	export const VSCODE_PROFILE_INITIALIZED: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const npm_execpath: string;
	export const GOLAND_VM_OPTIONS: string;
	export const PAGER: string;
	export const GOOGLE_CLOUD_PROJECT: string;
	export const APPCODE_VM_OPTIONS: string;
	export const npm_config_verify_deps_before_run: string;
	export const npm_config_frozen_lockfile: string;
	export const DEVECOSTUDIO_VM_OPTIONS: string;
	export const PATH: string;
	export const npm_package_json: string;
	export const _: string;
	export const npm_config__ali_registry: string;
	export const USER_ZDOTDIR: string;
	export const __CFBundleIdentifier: string;
	export const npm_command: string;
	export const PWD: string;
	export const JAVA_HOME: string;
	export const npm_lifecycle_event: string;
	export const npm_config__jsr_registry: string;
	export const npm_package_name: string;
	export const LANG: string;
	export const IDEA_VM_OPTIONS: string;
	export const CLION_VM_OPTIONS: string;
	export const WINDSURF_CASCADE_TERMINAL_KIND: string;
	export const VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
	export const XPC_FLAGS: string;
	export const WEBSTORM_VM_OPTIONS: string;
	export const ANTHROPIC_API_KEY: string;
	export const DATASPELL_VM_OPTIONS: string;
	export const npm_config_node_gyp: string;
	export const pnpm_config_verify_deps_before_run: string;
	export const npm_config_sass_binary_site: string;
	export const npm_package_version: string;
	export const SSL_CERT_DIR: string;
	export const XPC_SERVICE_NAME: string;
	export const VSCODE_INJECTION: string;
	export const PYENV_SHELL: string;
	export const SHLVL: string;
	export const STUDIO_VM_OPTIONS: string;
	export const HOME: string;
	export const VSCODE_GIT_ASKPASS_MAIN: string;
	export const ANTHROPIC_BASE_URL: string;
	export const HOMEBREW_PREFIX: string;
	export const LOGNAME: string;
	export const npm_lifecycle_script: string;
	export const VSCODE_GIT_IPC_HANDLE: string;
	export const GATEWAY_VM_OPTIONS: string;
	export const NVM_BIN: string;
	export const DATAGRIP_VM_OPTIONS: string;
	export const npm_config_user_agent: string;
	export const VSCODE_GIT_ASKPASS_NODE: string;
	export const GIT_ASKPASS: string;
	export const INFOPATH: string;
	export const HOMEBREW_CELLAR: string;
	export const RIDER_VM_OPTIONS: string;
	export const JETBRAINS_CLIENT_VM_OPTIONS: string;
	export const OSLogRateLimit: string;
	export const GIT_PAGER: string;
	export const RUBYMINE_VM_OPTIONS: string;
	export const npm_node_execpath: string;
	export const COLORTERM: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		DATABASE_URL: string;
		AMAP_KEY: string;
		AMAP_SECURITY_CODE: string;
		NVM_INC: string;
		PYCHARM_VM_OPTIONS: string;
		WEBIDE_VM_OPTIONS: string;
		TERM_PROGRAM: string;
		NODE: string;
		SSL_CERT_FILE: string;
		INIT_CWD: string;
		NVM_CD_FLAGS: string;
		ANDROID_HOME: string;
		NOTION_TOKEN: string;
		TERM: string;
		JETBRAINSCLIENT_VM_OPTIONS: string;
		SHELL: string;
		HOMEBREW_API_DOMAIN: string;
		HOMEBREW_BOTTLE_DOMAIN: string;
		CURL_CA_BUNDLE: string;
		HOMEBREW_REPOSITORY: string;
		TMPDIR: string;
		npm_config__alife_registry: string;
		VSCODE_PYTHON_AUTOACTIVATE_GUARD: string;
		TERM_PROGRAM_VERSION: string;
		ZDOTDIR: string;
		ORIGINAL_XDG_CURRENT_DESKTOP: string;
		MallocNanoZone: string;
		npm_config__terminus_registry: string;
		npm_config_registry: string;
		ENABLE_IDE_INTEGRATION: string;
		NVM_DIR: string;
		USER: string;
		COMMAND_MODE: string;
		PNPM_SCRIPT_SRC_DIR: string;
		REQUESTS_CA_BUNDLE: string;
		CLAUDE_CODE_SSE_PORT: string;
		PHPSTORM_VM_OPTIONS: string;
		SSH_AUTH_SOCK: string;
		VSCODE_PROFILE_INITIALIZED: string;
		__CF_USER_TEXT_ENCODING: string;
		npm_execpath: string;
		GOLAND_VM_OPTIONS: string;
		PAGER: string;
		GOOGLE_CLOUD_PROJECT: string;
		APPCODE_VM_OPTIONS: string;
		npm_config_verify_deps_before_run: string;
		npm_config_frozen_lockfile: string;
		DEVECOSTUDIO_VM_OPTIONS: string;
		PATH: string;
		npm_package_json: string;
		_: string;
		npm_config__ali_registry: string;
		USER_ZDOTDIR: string;
		__CFBundleIdentifier: string;
		npm_command: string;
		PWD: string;
		JAVA_HOME: string;
		npm_lifecycle_event: string;
		npm_config__jsr_registry: string;
		npm_package_name: string;
		LANG: string;
		IDEA_VM_OPTIONS: string;
		CLION_VM_OPTIONS: string;
		WINDSURF_CASCADE_TERMINAL_KIND: string;
		VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
		XPC_FLAGS: string;
		WEBSTORM_VM_OPTIONS: string;
		ANTHROPIC_API_KEY: string;
		DATASPELL_VM_OPTIONS: string;
		npm_config_node_gyp: string;
		pnpm_config_verify_deps_before_run: string;
		npm_config_sass_binary_site: string;
		npm_package_version: string;
		SSL_CERT_DIR: string;
		XPC_SERVICE_NAME: string;
		VSCODE_INJECTION: string;
		PYENV_SHELL: string;
		SHLVL: string;
		STUDIO_VM_OPTIONS: string;
		HOME: string;
		VSCODE_GIT_ASKPASS_MAIN: string;
		ANTHROPIC_BASE_URL: string;
		HOMEBREW_PREFIX: string;
		LOGNAME: string;
		npm_lifecycle_script: string;
		VSCODE_GIT_IPC_HANDLE: string;
		GATEWAY_VM_OPTIONS: string;
		NVM_BIN: string;
		DATAGRIP_VM_OPTIONS: string;
		npm_config_user_agent: string;
		VSCODE_GIT_ASKPASS_NODE: string;
		GIT_ASKPASS: string;
		INFOPATH: string;
		HOMEBREW_CELLAR: string;
		RIDER_VM_OPTIONS: string;
		JETBRAINS_CLIENT_VM_OPTIONS: string;
		OSLogRateLimit: string;
		GIT_PAGER: string;
		RUBYMINE_VM_OPTIONS: string;
		npm_node_execpath: string;
		COLORTERM: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
