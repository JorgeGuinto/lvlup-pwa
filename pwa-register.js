(() => {
  const state = {
    ready: false,
    update: false,
    error: false,
    offline: !navigator.onLine,
  };
  const publish = () => {
    window.__lvlupPwa = { ...state };
    window.dispatchEvent(new Event("lvlup-pwa"));
  };
  publish();
  for (const event of ["online", "offline"])
    window.addEventListener(event, () => {
      state.offline = !navigator.onLine;
      publish();
    });
  if (!("serviceWorker" in navigator) || !window.isSecureContext) {
    state.error = true;
    publish();
    return;
  }
  const base = new URL("./", document.currentScript.src);
  let registration;
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    state.ready = true;
    publish();
    if (reloading) location.reload();
  });
  window.addEventListener("lvlup-apply-update", () => {
    if (registration?.waiting) {
      reloading = true;
      registration.waiting.postMessage({ type: "APPLY_UPDATE" });
    }
  });
  const waiting = () => {
    state.update = !!registration.waiting;
    publish();
  };
  navigator.serviceWorker
    .register(new URL("sw.js", base), {
      scope: base.pathname,
      updateViaCache: "none",
    })
    .then(async (reg) => {
      registration = reg;
      waiting();
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed") waiting();
          if (worker.state === "redundant" && !reg.active) {
            state.error = true;
            publish();
          }
        });
      });
      await navigator.serviceWorker.ready;
      state.ready = true;
      publish();
      const check = () => {
        if (navigator.onLine) reg.update().catch(() => {});
      };
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
      window.addEventListener("online", check);
      check();
    })
    .catch(() => {
      state.error = true;
      publish();
    });
})();
