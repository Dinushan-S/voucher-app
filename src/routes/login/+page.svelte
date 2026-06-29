<script lang="ts">
  import { goto } from '$app/navigation';
  let passcode = '';
  let error = '';
  let busy = false;

  async function submit() {
    busy = true;
    error = '';
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ passcode })
    });
    busy = false;
    if (res.ok) {
      goto('/admin');
    } else {
      const j = await res.json().catch(() => ({}));
      error = j.error ?? 'Login failed';
    }
  }
</script>

<div class="wrap">
  <form class="box card-dark" on:submit|preventDefault={submit}>
    <h1>Modern Furniture</h1>
    <p>Voucher System</p>
    <input
      type="password"
      bind:value={passcode}
      placeholder="Enter passcode"
      autocomplete="current-password"
    />
    {#if error}<div class="err">{error}</div>{/if}
    <button class="btn-gold" disabled={busy || !passcode}>
      {busy ? 'Checking…' : 'Unlock'}
    </button>
  </form>
</div>

<style>
  .wrap { min-height: 100vh; display: grid; place-items: center; padding: 20px; }
  .box { width: 100%; max-width: 360px; padding: 36px 28px; text-align: center; }
  h1 {
    margin: 0;
    font-size: 22px;
    background: linear-gradient(180deg, var(--gold-light), var(--gold));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  p { margin: 4px 0 24px; letter-spacing: 4px; text-transform: uppercase; font-size: 11px; color: var(--gold); }
  input {
    width: 100%;
    padding: 14px;
    border-radius: 10px;
    border: 1px solid #333;
    background: #0d0d0d;
    color: var(--ink);
    text-align: center;
    margin-bottom: 14px;
  }
  .btn-gold { width: 100%; }
  .err { color: #ff7b7b; font-size: 13px; margin-bottom: 12px; }
</style>
