<script lang="ts">
    import { financeState, loadData } from "$lib/stores/finance.svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { onMount } from "svelte";

    let history = $state<any[]>([]);
    let isLoading = $state(true);

    async function loadHistory() {
        isLoading = true;
        try {
            history = await invoke("get_salary_history");
        } catch (err) {
            console.error("Error loading salary history:", err);
        } finally {
            isLoading = false;
        }
    }

    async function deleteRecord(id: number) {
        if (
            !confirm(
                "¿Eliminar este registro de salario? Esto afectará los cálculos históricos.",
            )
        )
            return;
        try {
            await invoke("delete_salary_record", { id });
            await loadHistory();
            await loadData();
        } catch (err) {
            alert("Error al eliminar registro");
        }
    }

    onMount(() => {
        loadHistory();
    });
</script>

<div class="salary-history-log glass-card">
    <h3>Historial de Cortas de Salario</h3>
    <p class="hint">
        Aquí puedes ver y gestionar cuándo cambió tu salario. Lumina usa estos
        registros para calcular tus ingresos pasados.
    </p>

    {#if isLoading}
        <div class="loading">Cargando historial...</div>
    {:else if history.length === 0}
        <div class="empty">
            No hay registros de salario aún. Configura tu salario para empezar.
        </div>
    {:else}
        <div class="log-table">
            {#each history as record}
                <div class="log-item">
                    <div class="info">
                        <span class="date">{record.effective_date}</span>
                        <span class="amount"
                            >{record.amount.toLocaleString()}
                            {record.currency}</span
                        >
                        <span class="freq">({record.frequency})</span>
                    </div>
                    <button
                        class="delete-btn"
                        onclick={() => deleteRecord(record.id)}
                        aria-label="Eliminar registro de salario"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            ><path
                                d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                            /></svg
                        >
                    </button>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .salary-history-log {
        margin-top: 20px;
        padding: 20px;
    }
    h3 {
        margin: 0 0 10px 0;
        font-size: 1.1rem;
        color: var(--neon-blue);
    }
    .hint {
        font-size: 0.8rem;
        color: var(--text-dim);
        margin-bottom: 15px;
    }

    .log-table {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .log-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
    }

    .info {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .date {
        font-family: monospace;
        font-weight: 700;
        color: var(--text-color);
    }
    .amount {
        font-weight: 600;
        color: var(--neon-blue);
    }
    .freq {
        font-size: 0.75rem;
        color: var(--text-dim);
        text-transform: capitalize;
    }

    .delete-btn {
        background: transparent;
        border: none;
        color: var(--text-dim);
        cursor: pointer;
        padding: 5px;
        border-radius: 6px;
        transition: all 0.2s;
    }

    .delete-btn:hover {
        color: #ff4757;
        background: rgba(255, 71, 87, 0.1);
    }

    .loading,
    .empty {
        text-align: center;
        padding: 20px;
        color: var(--text-dim);
        font-size: 0.85rem;
    }
</style>
