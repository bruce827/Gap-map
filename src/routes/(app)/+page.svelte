<script lang="ts">
  import { onMount } from 'svelte';
 
  import { loadAmapScript } from '$lib/amap-loader.js';
  import { normalizeCities } from '$lib/cities.js';
  import { citiesAPI } from '$lib/api/cities';
  import { createCityMarkers } from '$lib/amap.js';
  import type { City } from '$lib/types';
  import CityDetailCard from '$lib/components/CityDetailCard.svelte';
  import FilterPanel from '$lib/components/FilterPanel.svelte';
  import CompareBar from '$lib/components/CompareBar.svelte';
  import ComparePanel from '$lib/components/ComparePanel.svelte';
 
  let mapEl: HTMLDivElement | null = null;
  let AMapRef = $state<any>(null);
  let mapRef = $state<any>(null);
  let geocoderRef = $state<any>(null);

  let loading = $state('正在加载...');
  let error = $state('');
  let cityCount = $state<number | null>(null);
  let selectedCityName = $state<string | null>(null);
  let warning = $state('');
  
  let showDetailCard = $state(false);
  let detailLoading = $state(false);
  let detailError = $state('');
  let selectedCity = $state<City | null>(null);

  let allCities = $state<City[]>([]);
  let filteredCities = $state<City[]>([]);
  let provinces = $state<string[]>([]);
  let markers = $state<any[]>([]);
  let markerMap = $state<Map<string, any>>(new Map());

  let compareCities = $state<City[]>([]);
  let showComparePanel = $state(false);
  const MAX_COMPARE_CITIES = 4;

  let showPanorama = $state(false);
  let panoramaUrl = $state('');
  let locationMarker = $state<any>(null);

  async function loadCityDetail(cityId: string) {
    detailLoading = true;
    detailError = '';
    showDetailCard = true;
    
    try {
      const city = await citiesAPI().getById(cityId);
      if (!city) {
        detailError = '城市不存在';
        selectedCity = null;
      } else {
        selectedCity = city;
      }
    } catch (e) {
      detailError = e instanceof Error ? e.message : '加载失败';
      selectedCity = null;
    } finally {
      detailLoading = false;
    }
  }

  function closeDetailCard() {
    showDetailCard = false;
    selectedCity = null;
    detailError = '';
  }

  function handleFilter(filtered: City[]) {
    filteredCities = filtered;
    cityCount = filtered.length;
    
    const filteredIds = new Set(filtered.map(c => c.id));
    markerMap.forEach((marker, id) => {
      if (filteredIds.has(id)) {
        marker.show();
      } else {
        marker.hide();
      }
    });
  }

  function handleSort(sorted: City[]) {
    filteredCities = sorted;
  }

  function handleAddCompare(city: City) {
    if (compareCities.length >= MAX_COMPARE_CITIES) {
      alert(`最多只能对比 ${MAX_COMPARE_CITIES} 个城市`);
      return;
    }
    if (compareCities.some(c => c.id === city.id)) {
      return;
    }
    compareCities = [...compareCities, city];
  }

  function handleRemoveCompare(cityId: string) {
    compareCities = compareCities.filter(c => c.id !== cityId);
  }

  function handleOpenCompare() {
    if (compareCities.length >= 2) {
      showComparePanel = true;
    }
  }

  function handleCloseCompare() {
    showComparePanel = false;
  }

  function isCityInCompare(cityId: string): boolean {
    return compareCities.some(c => c.id === cityId);
  }

  function buildCityAddress(city: City): string {
    return [city.province, city.name, city.district]
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter(Boolean)
      .join('');
  }

  async function geocodeAddress(address: string): Promise<{ lng: number; lat: number }> {
    if (!geocoderRef) throw new Error('Geocoder 未就绪');

    return new Promise((resolve, reject) => {
      geocoderRef.getLocation(address, (status: string, result: any) => {
        if (status !== 'complete') {
          reject(new Error(`地址解析失败: ${status}`));
          return;
        }

        const location = result?.geocodes?.[0]?.location;
        const lng = typeof location?.getLng === 'function' ? location.getLng() : location?.lng;
        const lat = typeof location?.getLat === 'function' ? location.getLat() : location?.lat;

        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
          reject(new Error('地址解析失败: 无有效坐标'));
          return;
        }

        resolve({ lng, lat });
      });
    });
  }

  async function handleLocateCity(city: City) {
    try {
      if (!AMapRef || !mapRef) {
        alert('地图未就绪');
        return;
      }

      const address = buildCityAddress(city);
      if (!address) {
        alert('缺少地址信息，无法定位');
        return;
      }

      const { lng, lat } = await geocodeAddress(address);
      mapRef.setZoomAndCenter(14, [lng, lat]);

      if (locationMarker && typeof mapRef?.remove === 'function') {
        mapRef.remove(locationMarker);
        locationMarker = null;
      }

      if (typeof AMapRef?.Marker === 'function') {
        locationMarker = new AMapRef.Marker({
          position: [lng, lat],
          map: mapRef
        });
      }

      panoramaUrl = `https://uri.amap.com/panorama?position=${lng},${lat}`;
      showPanorama = true;
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  function closePanorama() {
    showPanorama = false;
    panoramaUrl = '';
  }
 
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
        plugins: ['AMap.Geocoder']
      });
      AMapRef = AMap;
 
      if (!mapEl) throw new Error('地图容器未就绪');
 
      loading = '正在初始化地图...';
      const map = new AMap.Map(mapEl, {
        zoom: 4.5,
        center: [108.940174, 34.341568],
        viewMode: '2D'
      });
      mapRef = map;
      geocoderRef = new AMap.Geocoder();
 
      loading = '正在获取城市数据...';
      const rawCities = await citiesAPI().list();
      const validCities = rawCities.filter(c => 
        c.id && c.name && 
        typeof c.lat === 'number' && Number.isFinite(c.lat) &&
        typeof c.lng === 'number' && Number.isFinite(c.lng)
      );
      
      allCities = validCities;
      filteredCities = validCities;
      cityCount = validCities.length;

      const uniqueProvinces = [...new Set(validCities.map(c => c.province).filter((p): p is string => p !== null))].sort();
      provinces = uniqueProvinces;

      if (validCities.length < 10) {
        warning = `有效城市点位不足 10（当前：${validCities.length}）。请检查 /api/cities 数据质量与经纬度字段。`;
      }
 
      if (validCities.length === 0) {
        throw new Error('城市列表为空');
      }

      const markerCities = normalizeCities(validCities);
      const createdMarkers = createCityMarkers({
        AMap,
        map,
        cities: markerCities,
        onClick: (payload: any) => {
          selectedCityName = payload?.city?.name ?? null;
          const cityId = payload?.city?.id;
          if (cityId) {
            loadCityDetail(cityId);
          }
        }
      });

      markers = createdMarkers;
      const newMarkerMap = new Map<string, any>();
      validCities.forEach((city: City, index: number) => {
        if (createdMarkers[index]) {
          newMarkerMap.set(city.id, createdMarkers[index]);
        }
      });
      markerMap = newMarkerMap;
 
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

{#if showDetailCard}
  <CityDetailCard
    city={selectedCity}
    loading={detailLoading}
    error={detailError}
    onclose={closeDetailCard}
    onlocate={handleLocateCity}
    onaddcompare={handleAddCompare}
    isInCompare={selectedCity ? isCityInCompare(selectedCity.id) : false}
  />
{/if}

{#if allCities.length > 0}
  <FilterPanel
    cities={allCities}
    {provinces}
    onfilter={handleFilter}
    onsort={handleSort}
  />
{/if}

<CompareBar
  cities={compareCities}
  onremove={handleRemoveCompare}
  oncompare={handleOpenCompare}
/>

{#if showComparePanel && compareCities.length >= 2}
  <ComparePanel
    cities={compareCities}
    onclose={handleCloseCompare}
  />
{/if}

{#if showPanorama}
  <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
    <div class="relative h-[70vh] w-[90vw] overflow-hidden rounded-xl bg-white shadow-2xl">
      <button
        class="absolute right-2 top-2 z-10 rounded bg-white/90 px-3 py-1 text-sm text-gray-700 shadow hover:bg-white"
        onclick={closePanorama}
      >
        关闭
      </button>
      <iframe class="h-full w-full" src={panoramaUrl} title="全景地图"></iframe>
    </div>
  </div>
{/if}

<style lang="css">
  /* 隐藏高德地图logo */
  :global(a.amap-logo) {
    visibility: hidden !important;
  }
  
  /* 隐藏高德地图版权信息 */
  :global(div.amap-copyright) {
    visibility: hidden !important;
  }
</style>
