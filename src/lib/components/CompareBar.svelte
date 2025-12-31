<script lang="ts">
  import type { City } from '$lib/types';

  interface Props {
    cities: City[];
    onremove: (cityId: string) => void;
    oncompare: () => void;
    maxCities?: number;
  }

  let { cities, onremove, oncompare, maxCities = 4 }: Props = $props();

  const CITY_COLORS = [
    { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700' },
    { bg: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-700' },
    { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-700' },
    { bg: 'bg-violet-100', border: 'border-violet-500', text: 'text-violet-700' },
  ];

  function getColorClass(index: number) {
    return CITY_COLORS[index % CITY_COLORS.length];
  }
</script>

{#if cities.length > 0}
  <div class="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-6 py-3 shadow-lg backdrop-blur">
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium text-gray-700">
          对比列表 ({cities.length}/{maxCities})
        </span>
        <div class="flex items-center gap-2">
          {#each cities as city, i}
            {@const colors = getColorClass(i)}
            <div class="flex items-center gap-1 rounded-full border-2 {colors.border} {colors.bg} px-3 py-1">
              <span class="text-sm font-medium {colors.text}">{city.name}</span>
              <button
                onclick={() => onremove(city.id)}
                class="ml-1 rounded-full p-0.5 text-gray-400 transition-colors hover:bg-white hover:text-red-500"
                title="移除"
              >
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          {/each}
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          onclick={() => cities.forEach(c => onremove(c.id))}
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          清空
        </button>
        <button
          onclick={oncompare}
          disabled={cities.length < 2}
          class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {cities.length < 2 ? 'cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}"
        >
          开始对比 ({cities.length}/2+)
        </button>
      </div>
    </div>
  </div>
{/if}
