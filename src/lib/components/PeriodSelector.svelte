<script lang="ts">
    import { financeState } from "$lib/stores/finance.svelte";
    import { onMount } from "svelte";

    let isOpen = $state(false);
    let container: HTMLDivElement;

    const monthNames = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
    ];

    const fullMonthNames = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
    ];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    function toggle() {
        isOpen = !isOpen;
    }

    function selectMonth(m: number) {
        if (financeState.selectedYear === currentYear && m > currentMonth)
            return;
        financeState.selectedMonth = m;
        isOpen = false;
    }

    function changeYear(delta: number) {
        const newYear = financeState.selectedYear + delta;
        if (newYear >= 2026 && newYear <= currentYear) {
            financeState.selectedYear = newYear;
            // If we moved to current year and selected month is in the future, reset to current month
            if (
                newYear === currentYear &&
                financeState.selectedMonth > currentMonth
            ) {
                financeState.selectedMonth = currentMonth;
            }
        }
    }

    function isMonthDisabled(m: number) {
        return financeState.selectedYear === currentYear && m > currentMonth;
    }

    function handleClickOutside(event: MouseEvent) {
        if (isOpen && container && !container.contains(event.target as Node)) {
            isOpen = false;
        }
    }

    onMount(() => {
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    });
</script>

<div class="period-selector-wrapper" bind:this={container}>
    <button
        class="trigger-btn glass-card"
        onclick={toggle}
        aria-label="Cambiar periodo"
        class:active={isOpen}
    >
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            width="18"
            height="18"
        >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span class="current-label"
            >{monthNames[financeState.selectedMonth]}
            {financeState.selectedYear}</span
        >
    </button>

    {#if isOpen}
        <div class="popover glass-card">
            <div class="popover-header">
                <button
                    class="nav-btn"
                    onclick={() => changeYear(-1)}
                    aria-label="Año anterior"
                    disabled={financeState.selectedYear <= 2026}
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        width="14"
                        height="14"
                        ><polyline points="15 18 9 12 15 6"></polyline></svg
                    >
                </button>
                <span class="year-display">{financeState.selectedYear}</span>
                <button
                    class="nav-btn"
                    onclick={() => changeYear(1)}
                    aria-label="Año siguiente"
                    disabled={financeState.selectedYear >= currentYear}
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        width="14"
                        height="14"
                        ><polyline points="9 18 15 12 9 6"></polyline></svg
                    >
                </button>
            </div>

            <div class="months-grid">
                {#each monthNames.filter((_, i) => !isMonthDisabled(i)) as m, i}
                    <button
                        class="month-btn"
                        class:selected={financeState.selectedMonth === i}
                        onclick={() => selectMonth(i)}
                    >
                        {m}
                    </button>
                {/each}
            </div>

            <button
                class="today-btn"
                onclick={() => {
                    financeState.selectedMonth = currentMonth;
                    financeState.selectedYear = currentYear;
                    isOpen = false;
                }}>Ir a Hoy</button
            >
        </div>
    {/if}
</div>

<style>
    .period-selector-wrapper {
        position: relative;
        display: inline-block;
    }

    .trigger-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--glass-border);
        color: var(--text-color);
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.85rem;
        font-weight: 600;
    }

    .trigger-btn:hover,
    .trigger-btn.active {
        background: rgba(255, 255, 255, 0.1);
        border-color: var(--neon-blue);
        box-shadow: 0 0 10px rgba(0, 243, 255, 0.2);
    }

    .current-label {
        white-space: nowrap;
    }

    .popover {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        z-index: 1000;
        width: 220px;
        padding: 15px;
        background: var(--modal-bg);
        border: 1px solid var(--glass-border);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        animation: slideIn 0.2s cubic-bezier(0, 0, 0.2, 1);
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .popover-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 15px;
    }

    .year-display {
        font-weight: 800;
        color: var(--neon-blue);
        font-size: 1.1rem;
        letter-spacing: 1px;
    }

    .nav-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--glass-border);
        color: var(--text-color);
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .nav-btn:hover:not(:disabled) {
        background: var(--neon-blue);
        color: var(--bg-color);
    }

    .nav-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .months-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 15px;
    }

    .month-btn {
        padding: 8px 4px;
        border-radius: 8px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--text-dim);
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .month-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-color);
    }

    .month-btn.selected {
        background: rgba(0, 243, 255, 0.1);
        color: var(--neon-blue);
        border-color: rgba(0, 243, 255, 0.3);
    }

    .today-btn {
        width: 100%;
        padding: 8px;
        border-radius: 10px;
        border: 1px solid var(--glass-border);
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-color);
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
    }

    .today-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: var(--neon-blue);
    }
</style>
