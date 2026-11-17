'use strict';
/* ------------------------------ PWA: install prompt, offline notices, service worker ------------------------------ */
const PWA = {
  deferred: null,
  bind() {
    const btn = $('#btnInstall'), standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    addEventListener('beforeinstallprompt', e => { e.preventDefault(); this.deferred = e; btn.hidden = false; });
    addEventListener('appinstalled', () => { this.deferred = null; btn.hidden = true; UI.toast('🎉 تم تثبيت التطبيق'); });
    if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone) btn.hidden = false;
    btn.addEventListener('click', async () => {
      if (this.deferred) { this.deferred.prompt(); await this.deferred.userChoice.catch(() => {}); this.deferred = null; btn.hidden = true; }
      else UI.toast('اضغطي زر المشاركة ثم «إضافة إلى الشاشة الرئيسية» 📲');
    });
    addEventListener('offline', () => UI.toast('📴 أنت دون اتصال — التطبيق يعمل بدون إنترنت'));
    addEventListener('online', () => UI.toast('✅ عاد الاتصال'));
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
};
