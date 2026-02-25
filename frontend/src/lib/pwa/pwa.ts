// 全局 PWA 安装事件监听与 deferredPrompt 管理
let deferred: BeforeInstallPromptEvent | null = null;

export function initPWAListener() {
  console.info('[pwa] initPWAListener registering listeners');
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    console.info('[pwa] beforeinstallprompt event captured', e);
    try { (e as BeforeInstallPromptEvent).preventDefault(); } catch (err) { console.warn('[pwa] preventDefault failed', err); }
    deferred = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('pwa:deferred-available'));
  });
  window.addEventListener('appinstalled', (e) => {
    console.info('[pwa] appinstalled event', e);
    deferred = null;
    window.dispatchEvent(new CustomEvent('pwa:appinstalled'));
  });
}

export function getDeferredPrompt() { return deferred; }
export function clearDeferredPrompt() { deferred = null; }

// 类型声明（如有 ts 报错可补充）
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }
}
