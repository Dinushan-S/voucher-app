<script lang="ts">
  import { formatLKR } from '$lib/format';
  export let data;

  // Chunk into pages of 3 cards.
  $: pages = (() => {
    const out: (typeof data.cards)[] = [];
    for (let i = 0; i < data.cards.length; i += 3) out.push(data.cards.slice(i, i + 3));
    return out;
  })();
</script>

<div class="toolbar no-print">
  <a href="/admin">← Back</a>
  <span>{data.cards.length} vouchers · {formatLKR(data.batch.total_value)} LKR</span>
  <button class="btn-gold" on:click={() => window.print()}>Print / Save PDF</button>
</div>

{#each pages as page}
  <div class="sheet">
    {#each page as c}
      <div class="card">
        <div class="left">
          <div class="head">
            <img class="logo" src="/logo.png" alt="Modern Furniture" />
            <div>
              <div class="bname">MODERN FURNITURE</div>
              <div class="bsub">Gift Voucher</div>
            </div>
          </div>
          <div>
            <div class="vlabel">Value</div>
            <div class="amt">{formatLKR(c.amount)}<small>LKR</small></div>
          </div>
          <div class="meta">
            <div><div class="k">Valid Until</div><div class="val">{c.expiry}</div></div>
            <div><div class="k">Serial</div><div class="val">{c.code}</div></div>
          </div>
        </div>
        <div class="right">
          <div class="qrbox"><img src={c.qr} alt="QR" /></div>
          <div class="scan">Scan to Redeem</div>
        </div>
      </div>
    {/each}
  </div>
{/each}

<style>
  .toolbar {
    position: sticky; top: 0; display: flex; align-items: center; justify-content: space-between;
    gap: 16px; padding: 12px 20px; background: #161616; border-bottom: 1px solid #2a2a2a;
  }
  .toolbar a { color: var(--gold); text-decoration: none; }
  .toolbar span { color: #aaa; font-size: 13px; }
  .sheet {
    width: 210mm; min-height: 297mm; background: #fff; margin: 16px auto;
    display: flex; flex-direction: column; align-items: center; justify-content: space-evenly;
  }
  .card {
    position: relative; width: 180mm; height: 80mm;
    background: linear-gradient(135deg, #0a0a0a, #161616 55%, #0a0a0a);
    border-radius: 5mm; overflow: hidden; display: grid; grid-template-columns: 1fr auto;
    align-items: center; padding: 7mm 9mm; color: #f5f5f0;
  }
  .card::before { content: ''; position: absolute; inset: 3mm; border: 0.6mm solid #d4af37; border-radius: 3.5mm; }
  .card::after { content: ''; position: absolute; inset: 4mm; border: 0.2mm solid #b8901f; border-radius: 3mm; opacity: 0.6; }
  .left { display: flex; flex-direction: column; justify-content: space-between; height: 100%; z-index: 2; padding-right: 6mm; }
  .head { display: flex; align-items: center; gap: 5mm; }
  .logo { height: 18mm; }
  .bname { font-size: 6mm; font-weight: 800; background: linear-gradient(180deg, #f7e08a, #d4af37); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .bsub { font-size: 2.6mm; letter-spacing: 3px; color: #d4af37; text-transform: uppercase; }
  .vlabel { font-size: 2.8mm; letter-spacing: 3px; color: #9a9a9a; text-transform: uppercase; }
  .amt { font-size: 13mm; font-weight: 800; line-height: 1; background: linear-gradient(180deg, #f7e08a, #b8901f); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .amt small { font-size: 5mm; color: #d4af37; -webkit-text-fill-color: #d4af37; margin-left: 1.5mm; }
  .meta { display: flex; gap: 10mm; }
  .k { font-size: 2.4mm; letter-spacing: 2px; color: #8a8a8a; text-transform: uppercase; }
  .val { font-size: 3.6mm; font-weight: 700; font-family: 'Courier New', monospace; }
  .right { display: flex; flex-direction: column; align-items: center; gap: 2.5mm; z-index: 2; }
  .qrbox { background: #fff; padding: 2.5mm; border-radius: 2mm; border: 0.5mm solid #d4af37; }
  .qrbox img { display: block; width: 32mm; height: 32mm; }
  .scan { font-size: 2.4mm; letter-spacing: 2px; color: #d4af37; text-transform: uppercase; }

  @media print {
    :global(body) { background: #fff; }
    .no-print { display: none; }
    .sheet { margin: 0; box-shadow: none; page-break-after: always; }
    @page { size: A4; margin: 0; }
  }
</style>
