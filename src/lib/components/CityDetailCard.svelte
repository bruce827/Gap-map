<script lang="ts">
  import type { City } from '$lib/types';

  interface Props {
    city: City | null;
    loading?: boolean;
    error?: string;
    onclose?: () => void;
    onaddcompare?: (city: City) => void;
    isInCompare?: boolean;
  }

  let { city, loading = false, error = '', onclose, onaddcompare, isInCompare = false }: Props = $props();

  let minimized = $state(false);
  let position = $state({ x: 20, y: 80 });
  let dragging = $state(false);
  let dragOffset = $state({ x: 0, y: 0 });

  function handleMouseDown(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('button')) return;
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

  function formatValue(value: string | number | null | undefined, suffix = ''): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return value.toLocaleString() + suffix;
    }
    return String(value) || '-';
  }
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

{#if city || loading || error}
  <div
    class="fixed z-50 select-none"
    style="left: {position.x}px; top: {position.y}px;"
  >
    {#if minimized}
      <button
        onclick={() => minimized = false}
        class="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-gray-200 transition-all hover:scale-110 hover:shadow-xl"
        title="展开城市详情"
      >
        <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span class="font-semibold">城市详情</span>
          </div>
          <div class="flex items-center gap-1">
            <button
              onclick={() => minimized = true}
              class="rounded p-1 transition-colors hover:bg-white/20"
              title="最小化"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
              </svg>
            </button>
            <button
              onclick={() => onclose?.()}
              class="rounded p-1 transition-colors hover:bg-white/20"
              title="关闭"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="p-4">
          {#if loading}
            <div class="flex items-center justify-center py-6">
              <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              <span class="ml-2 text-sm text-gray-500">加载中...</span>
            </div>
          {:else if error}
            <div class="py-4 text-center text-sm text-red-500">{error}</div>
          {:else if city}
            <div class="mb-3 border-b border-gray-100 pb-3">
              <h3 class="text-lg font-bold text-gray-900">{city.name}</h3>
              {#if city.province}
                <p class="text-sm text-gray-500">
                  {city.province}{city.district ? ` · ${city.district}` : ''}
                </p>
              {/if}
            </div>

            <div class="space-y-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">房价</span>
                <span class="font-medium text-gray-900">{formatValue(city.price, ' 元/㎡')}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">舒适天数</span>
                <span class="font-medium text-gray-900">{formatValue(city.comfort_days, ' 天/年')}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">绿化率</span>
                <span class="font-medium text-gray-900">{formatValue(city.green_rate, '%')}</span>
              </div>
            </div>

            <button
              onclick={() => city && onaddcompare?.(city)}
              disabled={isInCompare}
              class="mt-4 w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors {isInCompare ? 'cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}"
            >
              {isInCompare ? '已加入对比' : '加入对比'}
            </button>
          {:else}
            <div class="py-4 text-center text-sm text-gray-400">点击地图上的城市查看详情</div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}
