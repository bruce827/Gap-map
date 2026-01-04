<script lang="ts">
  import type { City } from '$lib/types';

  /**
   * 筛选状态接口
   * @interface FilterState
   * @property {number | null} maxPrice - 房价上限（元/㎡）
   * @property {number | null} minComfortDays - 舒适天数下限
   * @property {string} province - 省份
   * @property {number | null} minGreenRate - 绿化率下限（%）
   */
  interface FilterState {
    maxPrice: number | null;
    minComfortDays: number | null;
    province: string;
    minGreenRate: number | null;
  }

  /**
   * 排序状态接口
   * @interface SortState
   * @property {'price' | 'comfort_days' | ''} field - 排序字段
   * @property {'asc' | 'desc'} direction - 排序方向
   */
  interface SortState {
    field: 'price' | 'comfort_days' | '';
    direction: 'asc' | 'desc';
  }

  /**
   * 筛选面板组件的属性接口
   * @interface Props
   * @property {City[]} cities - 城市列表数据
   * @property {string[]} provinces - 省份列表
   * @property {(filtered: City[]) => void} onfilter - 筛选完成时的回调函数
   * @property {(sorted: City[]) => void} onsort - 排序完成时的回调函数
   */
  interface Props {
    cities: City[];
    provinces: string[];
    onfilter: (filtered: City[]) => void;
    onsort: (sorted: City[]) => void;
  }

  let { cities, provinces, onfilter, onsort }: Props = $props();

  /**
   * 是否最小化面板
   * @type {boolean}
   */
  let minimized = $state(false);
  
  /**
   * 面板位置坐标
   * @type {{x: number, y: number}}
   */
  let position = $state({ x: 20, y: 150 });
  
  /**
   * 是否正在拖拽
   * @type {boolean}
   */
  let dragging = $state(false);
  
  /**
   * 拖拽时的偏移量
  /**
   * 处理鼠标按下事件
   * @param {MouseEvent} e - 鼠标事件对象
   */
  function handleMouseDown(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    dragging = true;
    dragOffset = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  }

  /**
   * 处理鼠标移动事件
   * @param {MouseEvent} e - 鼠标事件对象
   */
  function handleMouseMove(e: MouseEvent) {
    if (!dragging) return;
    position = {
      x: Math.max(0, e.clientX - dragOffset.x),
      y: Math.max(0, e.clientY - dragOffset.y)
    };
  }

  /**
   * 处理鼠标释放事件
   */   * 当前排序条件
   * @type {SortState}
   */
  let sort = $state<SortState>({
    field: '',
    direction: 'asc'
  });

  /**
   * 筛选结果的城市数量
   * @type {number}
   */
  let filteredCount = $state(0);
  
  /**
   * 排序后的前5个城市
   * @type {City[]}
   */
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

  /**
   * 应用当前筛选条件，返回符合条件的城市列表
   * @returns {City[]} 筛选后的城市数组
   */
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
  /**
   * 对城市列表进行排序
   * @param {City[]} data - 待排序的城市数组
   * @returns {City[]} 排序后的城市数组
   */
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
/**
   * 处理应用按钮点击事件，应用筛选和排序
   * @returns {void}
   */
  
      return sort.direction === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }

  /**
   * 处理重置按钮点击事件，重置所有筛选和排序条件
   * @returns {void}
   */
  function handleApply() {
    const filtered = applyFilter();
    const sorted = applySort(filtered);
    filteredCount = sorted.length;
    topCities = sorted.slice(0, 5);
    onfilter(sorted);
    onsort(sorted);
  }

  function handleReset() {
  /**
   * 格式化数值为可读字符串
   * @param {number | null} value - 数值
   * @param {string} [suffix=''] - 后缀
   * @returns {string} 格式化后的字符串
   */
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
