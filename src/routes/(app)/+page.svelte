<script lang="ts">
  import { onMount } from 'svelte';
 
  import { loadAmapScript } from '$lib/amap-loader.js';
  import { normalizeCities } from '$lib/cities.js';
  import { citiesAPI } from '$lib/api/cities';
  import { createCityMarkers } from '$lib/amap.js';
 
  let mapEl: HTMLDivElement | null = null;
  let loading = '正在加载...';
  let error = '';
  let cityCount: number | null = null;
  let selectedCityName: string | null = null;
  let warning = '';
 
  onMount(async () => {
    try {
      loading = '正在获取配置...';
      error = '';
      cityCount = null;
      selectedCityName = null;
      warning = '';

      const configRes = await fetch('/api/config');
      if (!configRes.ok) {
        const text = await configRes.text();
        throw new Error(`GET /api/config failed: HTTP ${configRes.status} ${text}`);
      }

      const config = await configRes.json();
 
      if (!config?.amapKey) {
        throw new Error('未检测到高德地图 API Key，请检查根目录 .env');
      }
 
      loading = '正在加载高德地图脚本...';
      const AMap = await loadAmapScript({
        amapKey: config.amapKey,
        amapSecurityCode: config.amapSecurityCode,
        plugins: []
      });
 
      if (!mapEl) throw new Error('地图容器未就绪');
 
      loading = '正在初始化地图...';
      const map = new AMap.Map(mapEl, {
        zoom: 4.5,
        center: [108.940174, 34.341568],
        viewMode: '2D'
      });
 
      loading = '正在获取城市数据...';
      const cities = normalizeCities(await citiesAPI().list());
      cityCount = cities.length;

      if (cities.length < 10) {
        warning = `有效城市点位不足 10（当前：${cities.length}）。请检查 /api/cities 数据质量与经纬度字段。`;
      }
 
      if (cities.length === 0) {
        throw new Error('城市列表为空');
      }
 
      createCityMarkers({
        AMap,
        map,
        cities,
        onClick: (payload: any) => {
          selectedCityName = payload?.city?.name ?? null;
        }
      });
 
      loading = '';
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      loading = '';
    }
  });
 </script>
 
 <div class="h-[calc(100dvh-64px)] px-6 py-6">
   <div class="mb-3 flex items-baseline justify-between">
     <h1 class="text-xl font-semibold">Gap Map</h1>
     {#if cityCount !== null}
       <div class="text-sm text-gray-600">已加载城市：{cityCount}</div>
     {/if}
   </div>
 
   {#if loading}
     <div class="mb-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
       {loading}
     </div>
   {/if}
 
   {#if error}
     <div class="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
       {error}
     </div>
   {/if}

  {#if warning}
    <div class="mb-3 rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-900">
      {warning}
    </div>
  {/if}

  {#if selectedCityName}
    <div class="mb-3 rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800">
      <div class="font-medium">已选择城市</div>
      <div class="mt-1">{selectedCityName}</div>
    </div>
  {/if}
 
   <div bind:this={mapEl} class="h-full w-full rounded border"></div>
 </div>
