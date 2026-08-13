type ProductionOrderEvent = CustomEvent<Record<string, unknown>>;

export function installProductionBoardTransport() {
  if (typeof window === "undefined") return () => undefined;

  async function onProductionOrder(event: Event) {
    const customEvent = event as ProductionOrderEvent;
    const payload = customEvent.detail;
    if (!payload) return;

    try {
      const response = await fetch("/.netlify/functions/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      window.dispatchEvent(
        new CustomEvent("shulman:production-order-result", {
          detail: {
            ok: response.ok,
            status: response.status,
            result,
          },
        })
      );
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent("shulman:production-order-result", {
          detail: {
            ok: false,
            status: 0,
            error: error instanceof Error ? error.message : "Production feed transport failed",
          },
        })
      );
    }
  }

  window.addEventListener("shulman:production-order", onProductionOrder);
  return () => window.removeEventListener("shulman:production-order", onProductionOrder);
}
