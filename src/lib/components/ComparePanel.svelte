<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
  import type { City } from '$lib/types';

  Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

  /**
   * 对比维度配置接口
   * @interface DimensionConfig
   * @property {keyof City} key - 对应的城市数据字段
   * @property {string} label - 维度显示标签
   * @property {string} unit - 数值单位
   * @property {boolean} reverse - 是否反向显示（true时数值越大在雷达图越小）
   * @property {number} min - 数值下限
   * @property {number} max - 数值上限
   */
  interface DimensionConfig {
    key: keyof City;
    label: string;
    unit: string;
    reverse: boolean;
    min: number;
    max: number;
  }

  /**
   * 对比面板组件的属性接口
   * @interface Props
   * @property {City[]} cities - 待对比的城市列表
   * @property {() => void} onclose - 关闭对比面板的回调函数
   */
  interface Props {
    cities: City[];
    onclose: () => void;
  }

  let { cities, onclose }: Props = $props();

  const AVAILABLE_DIMENSIONS: DimensionConfig[] = [
    { key: 'price', label: '房价', unit: '元/㎡', reverse: true, min: 3000, max: 50000 },
    { key: 'comfort_days', label: '舒适天数', unit: '天', reverse: false, min: 0, max: 300 },
    { key: 'green_rate', label: '绿化率', unit: '%', reverse: false, min: 0, max: 60 },
  ];

  /**
   * 城市颜色配置数组，用于雷达图中各城市的颜色展示
   * @type {Array<{bg: string, border: string}>}
   */
  const CITY_COLORS = [
    { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgb(59, 130, 246)' },
    { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgb(16, 185, 129)' },
    { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgb(245, 158, 11)' },
    { bg: 'rgba(139, 92, 246, 0.2)', border: 'rgb(139, 92, 246)' },
  ];

  /**
   * 当前选中的维度列表
   * @type {string[]}
   */
  let selectedDimensions = $state<string[]>(['price', 'comfort_days', 'green_rate']);
  
  /**
   * Canvas 画布元素引用，用于绘制雷达图
   * @type {HTMLCanvasElement | null}
   */
  let canvasEl: HTMLCanvasElement | null = $state(null);
  
  /**
   * Chart.js 实例引用
   * @type {Chart | null}
   */
  let chart: Chart | null = null;

  /**
   * 是否最小化面板
   * @type {boolean}
   */
  let minimized = $state(false);
  
  /**
   * 面板位置坐标 {x: 水平距离左边界, y: 垂直距离顶部}
   * @type {{x: number, y: number}}
   */
  let position = $state({ x: 350, y: 80 });
  
  /**
   * 是否正在拖拽面板
   * @type {boolean}
   */
  let dragging = $state(false);
  
  /**
   * 拖拽时的偏移量
   * @type {{x: number, y: number}}
   */
  let dragOffset = $state({ x: 0, y: 0 });

  /**
   * 处理鼠标按下事件，启动拖拽
   * @param {MouseEvent} e - 鼠标事件对象
   */
  function handleMouseDown(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('button, input, label')) return;
    dragging = true;
    dragOffset = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  }

  /**
   * 处理鼠标移动事件，实时更新面板位置
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
   * 处理鼠标释放事件，停止拖拽
   */
  function handleMouseUp() {
    dragging = false;
  }

  /**
   * 将数值归一化到 0-100 范围内用于雷达图展示
   * @param {number | null} value - 原始数值
   * @param {DimensionConfig} config - 维度配置
   * @returns {number} 归一化后的数值
   */
  function normalizeValue(value: number | null, config: DimensionConfig): number {
    if (value === null) return 0;
    const clampedValue = Math.max(config.min, Math.min(config.max, value));
    const normalized = ((clampedValue - config.min) / (config.max - config.min)) * 100;
    return config.reverse ? 100 - normalized : normalized;
  }

  /**
   * 格式化数值为可读字符串
   * @param {number | null} value - 数值
  /**
   * 更新或创建雷达图表
   * 如果图表已存在则更新数据，否则创建新图表
   * @returns {void}
   */
   * @param {string} unit - 单位
   * @returns {string} 格式化后的字符串
   */
  function formatValue(value: number | null, unit: string): string {
    if (value === null) return '-';
    return value.toLocaleString() + ' ' + unit;
  }

  /**
   * 获取当前选中的维度配置列表
   * @returns {DimensionConfig[]} 选中维度的完整配置对象数组
   */
  function getSelectedConfigs(): DimensionConfig[] {
    return AVAILABLE_DIMENSIONS.filter(d => selectedDimensions.includes(d.key as string));
  }

  function updateChart() {
    if (!canvasEl) return;

    const configs = getSelectedConfigs();
    if (configs.length < 3) return;

    const labels = configs.map(c => c.label);
    const datasets = cities.map((city, index) => {
      const color = CITY_COLORS[index % CITY_COLORS.length];
      return {
        label: city.name,
        data: configs.map(config => normalizeValue(city[config.key] as number | null, config)),
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 2,
        pointBackgroundColor: color.border,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: color.border,
      };
    });

    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets = datasets;
      chart.update();
    } else {
      chart = new Chart(canvasEl, {
        type: 'radar',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            r: {
              min: 0,
              max: 100,
              ticks: {
                stepSize: 20,
                color: '#6B7280',
                backdropColor: 'transparent'
              },
              grid: {
                color: '#E5E7EB'
              },
              pointLabels: {
                color: '#374151',
                font: { size: 12 }
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 20
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const cityIndex = context.datasetIndex;
                  const dimIndex = context.dataIndex;
                  const city = cities[cityIndex];
                  const config = configs[dimIndex];
                  const rawValue = city[config.key] as number | null;
                  return `${city.name}: ${formatValue(rawValue, config.unit)}`;
                }
              }
            }
          }
  /**
   * 切换维度选中状态
   * @param {string} key - 维度键值
   * @returns {void}
   */
        }
      });
    }
  }

  function toggleDimension(key: string) {
    if (selectedDimensions.includes(key)) {
      if (selectedDimensions.length > 3) {
        selectedDimensions = selectedDimensions.filter(d => d !== key);
      }
    } else {
      if (selectedDimensions.length < 6) {
        selectedDimensions = [...selectedDimensions, key];
      }
    }
  }

  $effect(() => {
    if (canvasEl && cities.length >= 2 && selectedDimensions.length >= 3) {
      updateChart();
    }
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
      chart = null;
    }
  });
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<div
  class="fixed z-50 select-none"
  style="left: {position.x}px; top: {position.y}px;"
>
  {#if minimized}
    <button
      onclick={() => minimized = false}
      class="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-gray-200 transition-all hover:scale-110 hover:shadow-xl"
      title="展开对比面板"
    >
      <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
      </svg>
    </button>
  {:else}
    <div
      class="w-[480px] overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-gray-200"
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <span class="font-semibold">城市对比</span>
          <span class="rounded-full bg-white/20 px-2 py-0.5 text-xs">{cities.length} 城</span>
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
            onclick={onclose}
            class="rounded p-1 transition-colors hover:bg-white/20"
            title="关闭"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="max-h-[70vh] overflow-y-auto p-4">
        <div class="mb-4">
          <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">选择对比指标 (3-6个)</div>
          <div class="flex flex-wrap gap-2">
            {#each AVAILABLE_DIMENSIONS as dim}
              <label class="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors {selectedDimensions.includes(dim.key as string) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'}">
                <input
                  type="checkbox"
                  checked={selectedDimensions.includes(dim.key as string)}
                  onchange={() => toggleDimension(dim.key as string)}
                  class="sr-only"
                />
                {dim.label}
              </label>
            {/each}
          </div>
        </div>

        <div class="mb-4 flex aspect-square items-center justify-center rounded-lg bg-gray-50 p-4">
          {#if selectedDimensions.length < 3}
            <p class="text-sm text-gray-500">请至少选择 3 个指标</p>
          {:else}
            <canvas bind:this={canvasEl}></canvas>
          {/if}
        </div>

        <div class="border-t border-gray-100 pt-4">
          <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">数据详情</div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="py-2 text-left font-medium text-gray-500">指标</th>
                  {#each cities as city, i}
                    <th class="py-2 text-right font-medium" style="color: {CITY_COLORS[i % CITY_COLORS.length].border}">
                      {city.name}
                    </th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each getSelectedConfigs() as config}
                  <tr class="border-b border-gray-100">
                    <td class="py-2 text-gray-600">{config.label}</td>
                    {#each cities as city}
                      <td class="py-2 text-right font-medium text-gray-900">
                        {formatValue(city[config.key] as number | null, config.unit)}
                      </td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
