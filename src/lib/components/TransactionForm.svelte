<script lang="ts">
  import { TransactionFormState } from "$lib/logic/TransactionFormState.svelte";

  let props = $props<{
    onTransactionAdded: (amount: number) => void;
    editData?: any;
  }>();

  const state = new TransactionFormState({
    get onTransactionAdded() {
      return props.onTransactionAdded;
    },
    get editData() {
      return props.editData;
    },
  });
</script>

<div class="transaction-form">
  <div class="form-grid">
    <div class="input-group">
      <label for="desc">Descripción</label>
      <input
        id="desc"
        type="text"
        bind:value={state.description}
        placeholder="Ej: Café, Taxi, Netflix..."
      />
    </div>

    <div class="input-group">
      <label for="amount">Monto (Pesos)</label>
      <input
        id="amount"
        type="number"
        bind:value={state.amount}
        placeholder="0"
        onfocus={(e) => e.currentTarget.select()}
        onkeydown={(e) => {
          if (["e", "E", "+", "-"].includes(e.key)) {
            e.preventDefault();
          }
        }}
      />
    </div>

    <div class="input-group">
      <label for="type">Tipo</label>
      <select id="type" bind:value={state.type}>
        <option value="gasto">Gasto / Pago</option>
        <option value="ingreso">Ingreso Extra 📈</option>
      </select>
    </div>

    <div class="input-group">
      <label for="cat">Categoría</label>
      <select id="cat" bind:value={state.category}>
        <option value="Comida">Comida</option>
        <option value="Transporte">Transporte</option>
        <option value="Imprevisto">Imprevisto</option>
        <option value="Entretenimiento">Entretenimiento</option>
        <option value="Hogar">Hogar</option>
        <option value="Salud">Salud</option>
        <option value="Otros">Otros</option>
      </select>
    </div>
  </div>

  <button class="add-btn" onclick={state.handleSubmit}>Registrar</button>
</div>
