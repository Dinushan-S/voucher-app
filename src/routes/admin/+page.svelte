<script lang="ts">
  import { goto } from '$app/navigation';
  import { formatLKR } from '$lib/format';

  interface Row { amount: number | null; count: number | null; }

  let expiry = '';
  let rows: Row[] = [{ amount: 5000, count: 20 }];
  let busy = false;
  let error = '';

  function addRow() { rows = [...rows, { amount: null, count: null }]; }
  function removeRow(i: number) { rows = rows.filter((_, k) => k !== i); }

  $: totalCount = rows.reduce((s, r) => s + (r.count || 0), 0);
  $: totalValue = rows.reduce((s, r) => s + (r.amount || 0) * (r.count || 0), 0);

  async function generate() {
    error = '';
    if (!expiry) { error = 'Pick an expiry date.'; return; }
    for (const r of rows) {
      if (!r.amount || r.amount <= 0 || !r.count || r.count <= 0) {
        error = 'Every row needs a positive amount and count.';
        return;
      }
    }
    busy = true;
    const res = await fetch('/api/v1/vouchers/generate-batch', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': crypto.randomUUID()
      },
      body: JSON.stringify({
        expiry_date: expiry,
        batches: rows.map((r) => ({ amount: r.amount, count: r.count }))
      })
    });
    busy = false;
    const j = await res.json();
    if (res.ok) {
      goto(`/admin/print/${j.batch_id}`);
    } else {
      error = j.error ?? 'Generation failed';
    }
  }

  async function logout() {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    goto('/login');
  }
</script>

<div class="page">
  <header>
    <h1>Generate Vouchers</h1>
    <div class="actions">
      <a href="/scan" class="link">Open Scanner →</a>
      <button class="ghost" on:click={logout}>Log out</button>
    </div>
  </header>

  <div class="card-dark panel">
    <label class="field">
      <span>Expiry date</span>
      <input type="date" bind:value={expiry} />
    </label>

    <div class="rows">
      <div class="rowhead"><span>Amount (LKR)</span><span>Count</span><span></span></div>
      {#each rows as row, i}
        <div class="row">
          <input type="number" min="1" placeholder="e.g. 5000" bind:value={row.amount} />
          <input type="number" min="1" placeholder="e.g. 20" bind:value={row.count} />
          <button class="del" on:click={() => removeRow(i)} disabled={rows.length === 1}>✕</button>
        </div>
      {/each}
    </div>

    <button class="add" on:click={addRow}>+ Add amount</button>

    <div class="totals">
      <div><span>Vouchers</span><strong>{totalCount}</strong></div>
      <div><span>Total value</span><strong>{formatLKR(totalValue)} LKR</strong></div>
    </div>

    {#if error}<div class="err">{error}</div>{/if}

    <button class="btn-gold gen" on:click={generate} disabled={busy}>
      {busy ? 'Generating…' : 'Generate & Print'}
    </button>
  </div>
</div>

<style>
  .page { max-width: 720px; margin: 0 auto; padding: 28px 20px 60px; }
  header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
  h1 {
    margin: 0; font-size: 24px;
    background: linear-gradient(180deg, var(--gold-light), var(--gold));
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .actions { display: flex; align-items: center; gap: 16px; }
  .link { color: var(--gold); text-decoration: none; font-weight: 600; }
  .ghost { background: none; border: 1px solid #333; color: var(--ink); border-radius: 8px; padding: 8px 14px; }
  .panel { padding: 24px; }
  .field { display: block; margin-bottom: 20px; }
  .field span { display: block; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #9a9a9a; margin-bottom: 6px; }
  input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #333; background: #0d0d0d; color: var(--ink); }
  .rowhead, .row { display: grid; grid-template-columns: 1fr 1fr 44px; gap: 10px; align-items: center; }
  .rowhead { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #777; margin-bottom: 6px; }
  .row { margin-bottom: 10px; }
  .del { background: none; border: 1px solid #3a2222; color: #ff7b7b; border-radius: 8px; height: 44px; }
  .del:disabled { opacity: 0.3; }
  .add { background: none; border: 1px dashed #444; color: var(--gold); border-radius: 8px; padding: 10px; width: 100%; margin: 6px 0 20px; }
  .totals { display: flex; gap: 30px; padding: 16px 0; border-top: 1px solid #2a2a2a; margin-bottom: 16px; }
  .totals span { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
  .totals strong { font-size: 18px; }
  .gen { width: 100%; }
  .err { color: #ff7b7b; font-size: 13px; margin-bottom: 12px; }
</style>
