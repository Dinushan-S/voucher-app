<script lang="ts">
  import { formatLKR } from '$lib/format';
  export let data;
</script>

<div class="page">
  <header>
    <h1>Used Vouchers</h1>
    <a href="/admin" class="link">← Back</a>
  </header>

  {#if data.vouchers.length === 0}
    <p class="empty">No vouchers redeemed yet.</p>
  {:else}
    <table>
      <thead>
        <tr><th>Serial</th><th>Amount</th><th>Redeemed</th></tr>
      </thead>
      <tbody>
        {#each data.vouchers as v}
          <tr>
            <td class="mono">{v.voucher_code}</td>
            <td>{formatLKR(v.denomination_amount)} LKR</td>
            <td>{new Date(v.redeemed_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .page { max-width: 720px; margin: 0 auto; padding: 28px 20px 60px; }
  header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  h1 {
    margin: 0; font-size: 24px;
    background: linear-gradient(180deg, var(--gold-light), var(--gold));
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .link { color: var(--gold); text-decoration: none; font-weight: 600; }
  .empty { color: #999; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #888; padding: 8px 12px; border-bottom: 1px solid #2a2a2a; }
  td { padding: 10px 12px; border-bottom: 1px solid #1d1d1d; font-size: 14px; }
  .mono { font-family: 'Courier New', monospace; }
</style>
