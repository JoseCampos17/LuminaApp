<script lang="ts">
  import type { CategorySlice } from "$lib/logic/CategoryChartState.svelte";

  let { slices, totalExpenses, formatAmount } = $props<{
    slices: CategorySlice[];
    totalExpenses: number;
    formatAmount: (n: number) => string;
  }>();

  const SIZE = 140;
  const CENTER = SIZE / 2;
  const R = 52; // donut radius
  const STROKE = 18;
  const CIRCUMFERENCE = 2 * Math.PI * R;

  function describeArc(startPercent: number, percent: number) {
    const startAngle = startPercent * 3.6 - 90; // degrees, start from top
    const endAngle = (startPercent + percent) * 3.6 - 90;
    const start = polarToCartesian(CENTER, CENTER, R, endAngle);
    const end = polarToCartesian(CENTER, CENTER, R, startAngle);
    const largeArc = percent > 50 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  }

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  // Compute cumulative start percents for each slice
  function getSlicesWithOffset(slices: CategorySlice[]) {
    let offset = 0;
    return slices.map((s) => {
      const start = offset;
      offset += s.percent;
      return { ...s, start };
    });
  }
</script>

{#if slices.length === 0}
  <p class="chart-empty">Sin gastos en este período.</p>
{:else}
  {@const slicesWithOffset = getSlicesWithOffset(slices)}
  <div class="category-chart-wrap">
    <!-- Donut SVG -->
    <svg width={SIZE} height={SIZE} viewBox="0 0 {SIZE} {SIZE}" class="donut-svg">
      <!-- Background ring -->
      <circle
        cx={CENTER}
        cy={CENTER}
        r={R}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        stroke-width={STROKE}
      />
      <!-- Slices -->
      {#each slicesWithOffset as slice}
        <path
          d={describeArc(slice.start, slice.percent)}
          fill="none"
          stroke={slice.color}
          stroke-width={STROKE}
          stroke-linecap="butt"
          class="donut-path"
        />
      {/each}
      <!-- Center label -->
      <text x={CENTER} y={CENTER - 6} text-anchor="middle" class="donut-center-label">Gastos</text>
      <text x={CENTER} y={CENTER + 12} text-anchor="middle" class="donut-center-value">
        {slices.length} cat.
      </text>
    </svg>

    <!-- Legend -->
    <div class="chart-legend">
      {#each slices as slice}
        <div class="legend-row">
          <span class="legend-dot" style="background:{slice.color}; box-shadow: 0 0 6px {slice.color}"></span>
          <span class="legend-cat">{slice.category}</span>
          <span class="legend-pct">{slice.percent.toFixed(0)}%</span>
        </div>
      {/each}
    </div>
  </div>
{/if}
