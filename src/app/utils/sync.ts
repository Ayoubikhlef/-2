const CHANNEL_NAME = 'aos-sync';
const LOCAL_EVENT = 'aos:data-changed';

let channel: BroadcastChannel | null = null;
let listenerAttached = false;
let isExternalEvent = false;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return channel;
}

export function initCrossTabSync(): void {
  if (typeof window === 'undefined') return;
  const ch = getChannel();
  if (!ch || listenerAttached) return;
  listenerAttached = true;

  ch.onmessage = (event) => {
    if (event.data?.type === 'data-changed') {
      isExternalEvent = true;
      window.dispatchEvent(new CustomEvent(LOCAL_EVENT));
      isExternalEvent = false;
    }
  };

  window.addEventListener(LOCAL_EVENT, () => {
    if (!isExternalEvent) {
      const bc = getChannel();
      if (bc) {
        try { bc.postMessage({ type: 'data-changed' }); } catch { /* noop */ }
      }
    }
  });
}
