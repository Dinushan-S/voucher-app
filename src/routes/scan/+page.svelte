<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { formatLKR } from '$lib/format';

  type View = 'idle' | 'checking' | 'valid' | 'redeemed' | 'error';

  let view: View = 'idle';
  let curCode = '';
  let curAmount = 0;
  let errReason = '';
  let errMessage = '';

  let scanner: any = null;
  let scanning = false;
  let busy = false;

  async function startScanner() {
    const { Html5Qrcode } = await import('html5-qrcode');
    scanner = new Html5Qrcode('reader');
    scanning = true;
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decoded: string) => onDecoded(decoded),
      () => {}
    );
  }

  async function stopScanner() {
    if (scanner && scanning) {
      try {
        await scanner.stop();
      } catch {
        /* ignore */
      }
      scanning = false;
    }
  }

  function extractToken(raw: string): string {
    // QR may be a full URL (.../scan?t=TOKEN) or the bare token/serial.
    try {
      const u = new URL(raw);
      return u.searchParams.get('t') ?? raw;
    } catch {
      return raw;
    }
  }

  async function onDecoded(raw: string) {
    await stopScanner();
    await verify(extractToken(raw));
  }

  async function verify(token: string) {
    view = 'checking';
    curCode = token;
    const res = await fetch('/api/v1/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const j = await res.json();
    if (j.valid) {
      curAmount = j.amount;
      view = 'valid';
    } else {
      errReason = j.reason;
      errMessage = j.message;
      view = 'error';
    }
  }

  async function confirmRedeem() {
    busy = true;
    const res = await fetch('/api/v1/redeem', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: curCode, location: 'showroom' })
    });
    const j = await res.json();
    busy = false;
    if (j.ok) {
      curAmount = j.amount;
      view = 'redeemed';
    } else {
      errReason = j.reason;
      errMessage = j.message;
      view = 'error';
    }
  }

  function reset() {
    view = 'idle';
    startScanner();
  }

  onMount(() => {
    // Support deep-link from a printed QR opened directly.
    const t = $page.url.searchParams.get('t');
    if (t) verify(t);
    else startScanner();
  });
  onDestroy(stopScanner);
</script>

<div class="screen">
  <header><a href="/admin">← Admin</a><span>Voucher Scanner</span></header>

  {#if view === 'idle' || view === 'checking'}
    <div class="reader-wrap">
      <div id="reader"></div>
      <p class="hint">{view === 'checking' ? 'Checking…' : 'Point the camera at the voucher QR'}</p>
    </div>
  {:else if view === 'valid'}
    <div class="result green">
      <div class="big">✓</div>
      <div class="label">Valid Voucher</div>
      <div class="value">{formatLKR(curAmount)} LKR</div>
      <button class="btn-gold" disabled={busy} on:click={confirmRedeem}>
        {busy ? 'Redeeming…' : 'Confirm & Redeem'}
      </button>
      <button class="link" on:click={reset}>Cancel</button>
    </div>
  {:else if view === 'redeemed'}
    <div class="result green">
      <div class="big">✓</div>
      <div class="label">Redeemed</div>
      <div class="value">{formatLKR(curAmount)} LKR applied</div>
      <button class="btn-gold" on:click={reset}>Scan Next</button>
    </div>
  {:else if view === 'error'}
    <div class="result red">
      <div class="big">✕</div>
      <div class="label">{errMessage}</div>
      <div class="sub">
        {#if errReason === 'redeemed' || errReason === 'already_redeemed'}This voucher was already used.
        {:else if errReason === 'expired'}This voucher has expired.
        {:else}Code is invalid or not recognised.{/if}
      </div>
      <button class="btn-gold" on:click={reset}>Scan Again</button>
    </div>
  {/if}
</div>

<style>
  .screen { min-height: 100vh; display: flex; flex-direction: column; }
  header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #2a2a2a; }
  header a { color: var(--gold); text-decoration: none; }
  header span { color: #aaa; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; }
  .reader-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }
  #reader { width: 100%; max-width: 360px; border-radius: 16px; overflow: hidden; }
  .hint { color: #999; margin-top: 16px; text-align: center; }
  .result { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 30px; text-align: center; }
  .result.green { background: radial-gradient(circle at 50% 35%, #0c3b22, #071a10); }
  .result.red { background: radial-gradient(circle at 50% 35%, #4a1212, #1a0707); }
  .big { font-size: 80px; line-height: 1; }
  .green .big { color: #43d17f; }
  .red .big { color: #ff6b6b; }
  .label { font-size: 24px; font-weight: 700; }
  .value { font-size: 34px; font-weight: 800; color: var(--gold-light); }
  .sub { color: #ccc; }
  .btn-gold { margin-top: 10px; min-width: 220px; }
  .link { background: none; border: none; color: #aaa; text-decoration: underline; }
</style>
