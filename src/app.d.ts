declare module '$lib/amap-loader.js' {
  export interface GetAmapScriptUrlOptions {
    amapKey: string;
    plugins?: string[];
  }

  export interface LoadAmapScriptOptions extends GetAmapScriptUrlOptions {
    amapSecurityCode?: string;
  }

  export function getAmapScriptUrl(options: GetAmapScriptUrlOptions): string;

  export function loadAmapScript(options?: LoadAmapScriptOptions): Promise<any>;
}

declare module '$env/dynamic/private' {
  export const env: Record<string, string | undefined>;
}
