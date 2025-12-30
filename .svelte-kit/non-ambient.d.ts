
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/(app)" | "/" | "/admin" | "/admin/cities" | "/api" | "/api/cities" | "/api/cities/[id]" | "/api/config" | "/api/health" | "/(app)/city" | "/(app)/city/[id]";
		RouteParams(): {
			"/api/cities/[id]": { id: string };
			"/(app)/city/[id]": { id: string }
		};
		LayoutParams(): {
			"/(app)": { id?: string };
			"/": { id?: string };
			"/admin": Record<string, never>;
			"/admin/cities": Record<string, never>;
			"/api": { id?: string };
			"/api/cities": { id?: string };
			"/api/cities/[id]": { id: string };
			"/api/config": Record<string, never>;
			"/api/health": Record<string, never>;
			"/(app)/city": { id?: string };
			"/(app)/city/[id]": { id: string }
		};
		Pathname(): "/" | "/admin" | "/admin/" | "/admin/cities" | "/admin/cities/" | "/api" | "/api/" | "/api/cities" | "/api/cities/" | `/api/cities/${string}` & {} | `/api/cities/${string}/` & {} | "/api/config" | "/api/config/" | "/api/health" | "/api/health/" | "/city" | "/city/" | `/city/${string}` & {} | `/city/${string}/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/screenshots/.gitkeep" | "/screenshots/screencapture-localhost-5173-2025-12-30-16_31_49.png" | "/screenshots/screencapture-localhost-5173-2025-12-30-16_36_00.png" | string & {};
	}
}