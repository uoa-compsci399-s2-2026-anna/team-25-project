import "@testing-library/jest-dom/vitest"

// Shared by jsdom projects (which lack these) and real-browser projects (which don't) —
// only stub what's actually missing so real-browser runs keep native behavior.
if (typeof window.matchMedia === "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

if (typeof window.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: ResizeObserverStub,
  })
}

// jsdom's environment can be missing these depending on the Node/jsdom version pairing.
if (typeof globalThis.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = await import("node:util")
  Object.assign(globalThis, { TextEncoder, TextDecoder })
}
