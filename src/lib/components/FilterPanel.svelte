<script lang="ts">
  import type { City } from '$lib/types';

  interface FilterState {
    maxPrice: number | null;
    minComfortDays: number | null;
    province: string;
    minGreenRate: number | null;
  }

  interface SortState {
    field: 'price' | 'comfort_days' | '';
    direction: 'asc' | 'desc';
  }

  interface Props {
    cities: City[];
    provinces: string[];
    onfilter: (filtered: City[]) => void;
    onsort: (sorted: City[]) => void;
  }

  let { cities, provinces, onfilter, onsort }: Props = $props();

  let minimized = $state(false);
  let position = $state({ x: 20, y: 150 });
  let dragging = $state(false);
  let dragOffset = $state({ x: 0, y: 0 });

  let filters = $state<FilterState>({
    maxPrice: null,
    minComfortDays: null,
    province: '',
    minGreenRate: null
  });

  let sort = $state<SortState>({
    field: '',
    direction: 'asc'
  });

  let filteredCount = $state(0);
  let topCities = $state<City[]>([]);

  function handleMouseDown(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    dragging = true;
    dragOffset = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  }

  function handleMouseMove(e: MouseEvent) {
    if (!dragging) return;
    position = {
      x: Math.max(0, e.clientX - dragOffset.x),
      y: Math.max(0, e.clientY - dragOffset.y)
    };
  }

  function handleMouseUp() {
    dragging = false;
  }

  function applyFilter(): City[] {
    return cities.filter(city => {
      if (filters.maxPrice !== null && filters.maxPrice > 0) {
        if (city.price === null || city.price > filters.maxPrice) return false;
      }
      if (filters.minComfortDays !== null && filters.minComfortDays > 0) {
        if (city.comfort_days === null || city.comfort_days < filters.minComfortDays) return false;
      }
      if (filters.province && filters.province !== '') {
        if (city.province !== filters.province) return false;
      }
      if (filters.minGreenRate !== null && filters.minGreenRate > 0) {
        if (city.green_rate === null || city.green_rate < filters.minGreenRate) return false;
      }
      return true;
    });
  }

  function applySort(data: City[]): City[] {
    if (!sort.field) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sort.field as keyof City] as number | null;
      const bVal = b[sort.field as keyof City] as number | null;

      const aNum = aVal ?? (sort.direction === 'asc' ? Infinity : -Infinity);
      const bNum = bVal ?? (sort.direction === 'asc' ? Infinity : -Infinity);

      return sort.direction === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }

  function handleApply() {
    const filtered = applyFilter();
    const sorted = applySort(filtered);
    filteredCount = sorted.length;
    topCities = sorted.slice(0, 5);
    onfilter(sorted);
    onsort(sorted);
  }

  function handleReset() {
    filters = {
      maxPrice: null,
      minComfortDays: null,
      province: '',
      minGreenRate: null
    };
    sort = { field: '', direction: 'asc' };
    filteredCount = cities.length;
    topCities = [];
    onfilter(cities);
    onsort(cities);
  }

  function formatValue(value: number | null, suffix = ''): string {
    if (value === null) return '-';
    return value.toLocaleString() + suffix;
  }
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<div
  class="fixed z-40 select-none"
  style="left: {position.x}px; top: {position.y}px;"
>
  {#if minimized}
    <button
      onclick={() => minimized = false}
      class="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-gray-200 transition-all hover:scale-110 hover:shadow-xl"
      title="展开筛选面板"
    >
      <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
      </svg>
    </button>
  {:else}
    <div
      class="w-72 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-gray-200"
      class:cursor-grabbing={dragging}
      class:cursor-grab={!dragging}
    >
      <div
        role="toolbar"
        tabindex="0"
        class="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white"
        onmousedown={handleMouseDown}
      >
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
          </svg>
          <span class="font-semibold">筛选与排序</span>
        </div>
        <button
          onclick={() => minimized = true}
          class="rounded p-1 transition-colors hover:bg-white/20"
          title="最小化"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
          </svg>
        </button>
      </div>

      <div class="max-h-[60vh] overflow-y-auto p-4">
        <div class="space-y-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">筛选条件</div>
          
          <label class="block">
            <span class="mb-1 block text-sm text-gray-700">房价上限（元/㎡）</span>
            <input
              type="number"
              bind:value={filters.maxPrice}
              placeholder="如：10000"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          <label class="block">
            <span class="mb-1 block text-sm text-gray-700">舒适天数下限（天）</span>
            <input
              type="number"
              bind:value={filters.minComfortDays}
              placeholder="如：200"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          <label class="block">
            <span class="mb-1 block text-sm text-gray-700">省份</span>
            <select
              bind:value={filters.province}
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">全部省份</option>
              {#each provinces as p}
                <option value={p}>{p}</option>
              {/each}
            </select>
          </label>

          <label class="block">
            <span class="mb-1 block text-sm text-gray-700">绿化率下限（%）</span>
            <input
              type="number"
              bind:value={filters.minGreenRate}
              placeholder="如：30"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          <div class="border-t border-gray-100 pt-4">
            <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">排序方式</div>
          </div>

          <div class="flex gap-2">
            <select
              bind:value={sort.field}
              class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">不排序</option>
              <option value="price">房价</option>
              <option value="comfort_days">舒适天数</option>
            </select>
            <select
              bind:value={sort.direction}
              class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="asc">升序</option>
              <option value="desc">降序</option>
            </select>
          </div>

          <div class="flex gap-2 pt-2">
            <button
              onclick={handleApply}
              class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              应用
            </button>
            <button
              onclick={handleReset}
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              重置
            </button>
          </div>

          {#if filteredCount > 0}
            <div class="border-t border-gray-100 pt-4">
              <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                结果：{filteredCount} 个城市
              </div>
              {#if topCities.length > 0}
                <div class="space-y-2">
                  {#each topCities as city, i}
                    <div class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                      <span class="font-medium text-gray-900">
                        <span class="mr-1 text-blue-600">{i + 1}.</span>
                        {city.name}
                      </span>
                      <span class="text-gray-500">
                        {#if sort.field === 'price'}
                          {formatValue(city.price, '元')}
                        {:else if sort.field === 'comfort_days'}
                          {formatValue(city.comfort_days, '天')}
                        {:else}
                          {city.province ?? '-'}
                        {/if}
                      </span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {:else if filteredCount === 0 && (filters.maxPrice || filters.minComfortDays || filters.province || filters.minGreenRate)}
            <div class="border-t border-gray-100 pt-4 text-center text-sm text-gray-500">
              没有符合条件的城市
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
