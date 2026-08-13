import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import {
  buildProductionJobs,
  CartItem,
  estimateProduction,
  initialStatus,
  makeOrderId,
  PortalUser,
  Product,
  PRODUCTS,
  STATUS_STYLES,
  SubmittedOrder,
} from "./portalDomain";
import {
  profileForRestaurant,
  RESTAURANT_PROFILES,
  RestaurantProfile,
} from "./restaurantProfiles";
import {
  HistoricalProduct,
  historicalProductsForRestaurant,
} from "./data/invoiceHistory";

const ORDER_STORAGE_KEY = "friedmans_portal_orders_v3";
const USER_STORAGE_KEY = "friedmans_portal_user";
const TOKEN_STORAGE_KEY = "friedmans_portal_session_token";

type Tab = "reorder" | "new" | "orders" | "production" | "account";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

function parseInvoiceDate(value?: string | null) {
  if (!value) return 0;
  const [m, d, y] = value.split("/").map(Number);
  return new Date(y, Math.max(0, m - 1), d).getTime() || 0;
}

function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Complete;
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}>{status}</span>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function RestaurantGraphic({ profile, compact = false }: { profile: RestaurantProfile; compact?: boolean }) {
  const { theme } = profile;
  const id = `pattern-${profile.id.replace(/[^a-z0-9]/gi, "-")}`;
  let shape: React.ReactNode;
  switch (theme.graphic) {
    case "dots":
      shape = <><circle cx="8" cy="8" r="3" fill={theme.accent} /><circle cx="24" cy="24" r="3" fill={theme.secondary} /></>;
      break;
    case "grid":
      shape = <><path d="M0 0H32M0 16H32M0 32H32M0 0V32M16 0V32M32 0V32" stroke={theme.secondary} strokeWidth="2" /><rect x="2" y="2" width="7" height="7" fill={theme.accent} /></>;
      break;
    case "stripes":
      shape = <><path d="M-8 32L32-8M0 40L40 0M8 48L48 8" stroke={theme.secondary} strokeWidth="7" /><path d="M-4 32L32-4" stroke={theme.accent} strokeWidth="2" /></>;
      break;
    case "waves":
      shape = <><path d="M-4 8 Q4 0 12 8 T28 8 T44 8" fill="none" stroke={theme.secondary} strokeWidth="4" /><path d="M-4 24 Q4 16 12 24 T28 24 T44 24" fill="none" stroke={theme.accent} strokeWidth="3" /></>;
      break;
    case "rings":
      shape = <><circle cx="16" cy="16" r="13" fill="none" stroke={theme.secondary} strokeWidth="5" /><circle cx="16" cy="16" r="5" fill="none" stroke={theme.accent} strokeWidth="3" /></>;
      break;
    case "blocks":
      shape = <><rect x="0" y="0" width="15" height="15" fill={theme.secondary} /><rect x="17" y="17" width="15" height="15" fill={theme.accent} /><rect x="19" y="1" width="11" height="11" fill={theme.primary} opacity=".3" /></>;
      break;
    case "chevrons":
      shape = <><path d="M-2 2L14 16L-2 30M14 2L30 16L14 30M30 2L46 16L30 30" fill="none" stroke={theme.secondary} strokeWidth="6" /><path d="M6 2L22 16L6 30" fill="none" stroke={theme.accent} strokeWidth="2" /></>;
      break;
    case "rays":
      shape = <><path d="M16 16L16-8M16 16L40 16M16 16L16 40M16 16L-8 16M16 16L34-2M16 16L34 34M16 16L-2 34M16 16L-2-2" stroke={theme.secondary} strokeWidth="5" /><circle cx="16" cy="16" r="5" fill={theme.accent} /></>;
      break;
    default:
      shape = <><path d="M2 30V16a14 14 0 0 1 28 0v14" fill="none" stroke={theme.secondary} strokeWidth="5" /><path d="M9 30V17a7 7 0 0 1 14 0v13" fill="none" stroke={theme.accent} strokeWidth="3" /></>;
  }
  return (
    <div className={`overflow-hidden ${compact ? "h-12 w-24 rounded-lg" : "h-28 w-full rounded-2xl"}`} style={{ backgroundColor: theme.primary }} aria-hidden="true">
      <svg className="h-full w-full" viewBox="0 0 320 112" preserveAspectRatio="none">
        <defs><pattern id={id} width="32" height="32" patternUnits="userSpaceOnUse">{shape}</pattern></defs>
        <rect width="320" height="112" fill={`url(#${id})`} opacity="0.72" />
        <path d="M0 90 C65 45, 110 125, 185 72 S280 40, 340 82 L340 120 L0 120Z" fill={theme.accent} opacity="0.26" />
      </svg>
    </div>
  );
}

export default function ShulmanRestaurantPortalV3() {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [activeRestaurantId, setActiveRestaurantId] = useState(RESTAURANT_PROFILES[0].id);
  const [tab, setTab] = useState<Tab>("reorder");
  const [query, setQuery] = useState("");
  const [historyCategory, setHistoryCategory] = useState("All");
  const [selectedHistory, setSelectedHistory] = useState<HistoricalProduct | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submittedOrders, setSubmittedOrders] = useState<SubmittedOrder[]>([]);
  const [feedMessage, setFeedMessage] = useState("");

  useEffect(() => {
    try {
      const storedUser = window.sessionStorage.getItem(USER_STORAGE_KEY);
      const token = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedUser && token) {
        const parsed = JSON.parse(storedUser) as PortalUser;
        setUser(parsed);
        setActiveRestaurantId(parsed.defaultRestaurantId || parsed.allowedRestaurantIds?.[0] || RESTAURANT_PROFILES[0].id);
      }
      const orders = window.localStorage.getItem(ORDER_STORAGE_KEY);
      if (orders) setSubmittedOrders(JSON.parse(orders));
    } catch {
      // Storage is a convenience only.
    }
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(submittedOrders.slice(0, 50))); } catch { /* no-op */ }
  }, [submittedOrders]);

  useEffect(() => {
    function onFM(ev: Event) {
      const detail = (ev as CustomEvent).detail || {};
      if (detail.name !== "bootstrap" || !detail.data?.user) return;
      const nextUser = detail.data.user as PortalUser;
      setUser(nextUser);
      setActiveRestaurantId(nextUser.defaultRestaurantId || nextUser.allowedRestaurantIds?.[0] || RESTAURANT_PROFILES[0].id);
    }
    function onFeedResult(ev: Event) {
      const detail = (ev as CustomEvent).detail || {};
      if (detail.ok && detail.result?.forwarded) setFeedMessage("Production feed accepted and forwarded to the master production board.");
      else if (detail.ok) setFeedMessage("Order accepted by the Friedman production feed; master-board forwarding is awaiting endpoint configuration.");
      else setFeedMessage("Order was created, but the production-feed handoff needs attention.");
    }
    window.addEventListener("fm:receive", onFM);
    window.addEventListener("shulman:production-order-result", onFeedResult);
    return () => {
      window.removeEventListener("fm:receive", onFM);
      window.removeEventListener("shulman:production-order-result", onFeedResult);
    };
  }, []);

  if (!user) {
    return <RestaurantLogin onAuthenticated={(nextUser) => {
      setUser(nextUser);
      setActiveRestaurantId(nextUser.defaultRestaurantId || nextUser.allowedRestaurantIds?.[0] || RESTAURANT_PROFILES[0].id);
    }} />;
  }

  const allowedProfiles = user.role === "admin" || !user.allowedRestaurantIds?.length
    ? RESTAURANT_PROFILES
    : RESTAURANT_PROFILES.filter((r) => user.allowedRestaurantIds?.includes(r.id));
  const profile = profileForRestaurant(activeRestaurantId);
  const history = historicalProductsForRestaurant(profile.id).slice().sort((a, b) => parseInvoiceDate(b.invoiceDate) - parseInvoiceDate(a.invoiceDate));
  const categories = ["All", ...Array.from(new Set(history.map((h) => h.category)))];
  const filteredHistory = history.filter((h) => {
    const matchCategory = historyCategory === "All" || h.category === historyCategory;
    const haystack = `${h.name} ${h.description} ${h.invoiceNo || ""}`.toLowerCase();
    return matchCategory && haystack.includes(query.toLowerCase());
  });

  const cartProduction = cart.reduce((acc, item) => {
    acc.clicks += item.production.estimatedClicks || 0;
    acc.sheets += item.production.estimatedSheets || 0;
    acc.squareFeet += item.production.estimatedSquareFeet || 0;
    acc.machineMinutes += item.production.estimatedMachineMinutes;
    acc.finishingMinutes += item.production.estimatedFinishingMinutes;
    return acc;
  }, { clicks: 0, sheets: 0, squareFeet: 0, machineMinutes: 0, finishingMinutes: 0 });

  function signOut() {
    window.sessionStorage.removeItem(USER_STORAGE_KEY);
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setCart([]);
  }

  function placeOrder() {
    if (!cart.length) return;
    const orderId = makeOrderId();
    const createdAt = new Date().toISOString();
    const productionJobs = buildProductionJobs(cart, orderId, createdAt, user, profile);
    const status = productionJobs.some((j) => j.status === "Awaiting Artwork") ? "Awaiting Artwork"
      : productionJobs.some((j) => j.status === "Awaiting Proof") ? "Awaiting Proof" : "Ready to Print";
    const payload = {
      source: "Friedmans Portal",
      source_system: "friedmans_portal",
      orderId,
      createdAt,
      restaurant: { id: profile.id, name: profile.name, brand: profile.brand, address: profile.address },
      requestedBy: user,
      cart,
      productionSummary: cartProduction,
      productionJobs,
    };
    const fm = (window as any).FM;
    if (fm?.call) fm.call("Create Order", payload);
    window.dispatchEvent(new CustomEvent("shulman:production-order", { detail: payload }));
    setSubmittedOrders((prev) => [{ orderId, createdAt, status, items: cart }, ...prev]);
    setFeedMessage("Sending production-ready line items to the Friedman production feed…");
    setCart([]);
    setTab("orders");
  }

  return (
    <div className="min-h-screen text-slate-900" style={{ backgroundColor: profile.theme.surface }}>
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur" style={{ borderColor: profile.theme.secondary }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <RestaurantGraphic profile={profile} compact />
            <div>
              <div className="text-sm font-black tracking-[0.14em]">SHULMAN PAPER</div>
              <div className="text-xs text-slate-500">{profile.name} ordering portal</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.role === "admin" && (
              <select className="hidden max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm md:block" value={activeRestaurantId} onChange={(e) => setActiveRestaurantId(e.target.value)}>
                {allowedProfiles.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.address}</option>)}
              </select>
            )}
            <Button variant="outline" onClick={signOut}>Sign out</Button>
          </div>
        </div>
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${profile.theme.primary}, ${profile.theme.accent}, ${profile.theme.secondary})` }} />
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-32">
        <RestaurantHero profile={profile} history={history} />
        <TabNav tab={tab} setTab={setTab} profile={profile} />

        {tab === "reorder" && (
          <div className="space-y-6">
            <section>
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Quick reorder</h2>
                  <p className="text-sm text-slate-600">Most recent billed jobs for this restaurant, using the actual invoice history from the archive.</p>
                </div>
              </div>
              {history.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {history.slice(0, 4).map((item) => <HistoricalCard key={item.id} item={item} profile={profile} compact onReorder={() => setSelectedHistory(item)} />)}
                </div>
              ) : <EmptyHistory />}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Previously billed products</h2>
                  <p className="mt-1 max-w-3xl text-sm text-slate-600">Historical amounts are shown exactly as billed. They are reorder references, not a promise of current pricing; current pricing can later be reconciled against the Shulman Pricing Bible.</p>
                </div>
                <Input className="lg:w-80" placeholder="Search product, description or invoice" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button key={category} onClick={() => setHistoryCategory(category)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${historyCategory === category ? "text-white" : "bg-white text-slate-700"}`} style={historyCategory === category ? { backgroundColor: profile.theme.primary, borderColor: profile.theme.primary } : { borderColor: profile.theme.secondary }}>
                    {category}
                  </button>
                ))}
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {filteredHistory.map((item) => <HistoricalCard key={item.id} item={item} profile={profile} onReorder={() => setSelectedHistory(item)} />)}
              </div>
              {!filteredHistory.length && <div className="py-10 text-center text-sm text-slate-500">No historical products match those filters.</div>}
            </section>
          </div>
        )}

        {tab === "new" && (
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold">New product / non-history order</h2>
              <p className="mt-1 text-sm text-slate-600">Use these templates when the job is not a direct reorder from a prior invoice.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PRODUCTS.map((p) => (
                <Card key={p.id}>
                  <CardHeader><CardTitle className="text-base">{p.name}</CardTitle><CardDescription>{p.category} • SKU {p.qbSku}</CardDescription></CardHeader>
                  <CardContent><div className="text-sm text-slate-500">Production route: {p.recipe.machine}</div><Button className="w-full" onClick={() => setSelectedProduct(p)}>Configure new job</Button></CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {tab === "orders" && (
          <section className="space-y-4">
            {feedMessage && <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">{feedMessage}</div>}
            {!submittedOrders.length && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No portal orders have been submitted from this browser yet.</div>}
            {submittedOrders.map((order) => (
              <Card key={order.orderId}><CardContent className="p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><div className="font-semibold">{order.orderId}</div><div className="mt-1 text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()} • {order.items.length} job(s)</div><div className="mt-2 text-sm text-slate-700">{order.items.map((i) => i.jobName).join(", ")}</div></div><StatusPill status={order.status} /></div></CardContent></Card>
            ))}
          </section>
        )}

        {tab === "production" && (
          <section className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric label="Cart jobs" value={cart.length} />
              <Metric label="Est. clicks" value={cartProduction.clicks.toLocaleString()} />
              <Metric label="Est. sheets" value={cartProduction.sheets.toLocaleString()} />
              <Metric label="Machine min" value={cartProduction.machineMinutes} />
              <Metric label="Finishing min" value={cartProduction.finishingMinutes} />
            </div>
            <Card><CardHeader><CardTitle>Production feed preview</CardTitle><CardDescription>Historical price references stay separate from production workload calculations.</CardDescription></CardHeader><CardContent>{cart.length ? cart.map((item, i) => <ProductionPreview key={`${item.productId}-${i}`} item={item} onRemove={() => setCart((prev) => prev.filter((_, idx) => idx !== i))} />) : <p className="text-sm text-slate-500">Reorder a historical item or configure a new item to build the production feed.</p>}</CardContent></Card>
          </section>
        )}

        {tab === "account" && <AccountPanel profile={profile} />}
      </main>

      {!!cart.length && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm"><span className="font-semibold">{cart.length} production job{cart.length === 1 ? "" : "s"}</span><span className="ml-3 text-slate-500">{cartProduction.clicks ? `${cartProduction.clicks.toLocaleString()} est. clicks` : `${cartProduction.squareFeet.toFixed(1)} est. sq ft`} • {cartProduction.machineMinutes} machine min</span></div>
            <div className="flex gap-2"><Button variant="outline" onClick={() => setCart([])}>Clear</Button><Button onClick={placeOrder}>Place order & send to production</Button></div>
          </div>
        </div>
      )}

      {selectedHistory && <HistoricalReorderDialog item={selectedHistory} profile={profile} onClose={() => setSelectedHistory(null)} onAdd={(item) => { setCart((prev) => [...prev, item]); setSelectedHistory(null); setTab("production"); }} />}
      {selectedProduct && <NewProductDialog product={selectedProduct} profile={profile} onClose={() => setSelectedProduct(null)} onAdd={(item) => { setCart((prev) => [...prev, item]); setSelectedProduct(null); setTab("production"); }} />}
    </div>
  );
}

function RestaurantLogin({ onAuthenticated }: { onAuthenticated: (user: PortalUser) => void }) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const response = await fetch("/.netlify/functions/restaurant-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loginId, password }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.user || !result.sessionToken) throw new Error(result.error || "Unable to sign in");
      window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, result.sessionToken);
      onAuthenticated(result.user as PortalUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-14 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center text-white"><div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Shulman Paper & Printing</div><h1 className="mt-2 text-3xl font-black">Restaurant Ordering Portal</h1><p className="mt-2 text-sm text-slate-300">Each location has its own private catalog, invoice history and visual identity.</p></div>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <Card className="shadow-2xl"><CardHeader><CardTitle>Restaurant sign in</CardTitle><CardDescription>Use the unique login ID and password assigned to your location.</CardDescription></CardHeader><CardContent><form className="space-y-4" onSubmit={signIn}><div><Label>Login ID</Label><Input autoComplete="username" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="restaurant login" /></div><div><Label>Password</Label><Input autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>{error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}<Button className="w-full" disabled={loading || !loginId || !password}>{loading ? "Signing in…" : "Sign in"}</Button></form></CardContent></Card>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-4">
            {RESTAURANT_PROFILES.slice(0, 16).map((profile) => <div key={profile.id} className="rounded-xl bg-white/5 p-2"><RestaurantGraphic profile={profile} compact /><div className="mt-2 truncate text-[10px] font-medium text-slate-300">{profile.name}</div></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function RestaurantHero({ profile, history }: { profile: RestaurantProfile; history: HistoricalProduct[] }) {
  const lastInvoice = history[0];
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-sm">
      <div className="grid md:grid-cols-[1.6fr_1fr]">
        <div className="p-6">
          <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: profile.theme.primary }}>Ordering for</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{profile.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{profile.address}</p>
          <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: profile.theme.secondary, color: profile.theme.primary }}>Login: {profile.loginId}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{history.length} prior billed jobs</span>{lastInvoice?.invoiceDate && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Latest invoice {lastInvoice.invoiceDate}</span>}</div>
        </div>
        <RestaurantGraphic profile={profile} />
      </div>
    </section>
  );
}

function TabNav({ tab, setTab, profile }: { tab: Tab; setTab: (value: Tab) => void; profile: RestaurantProfile }) {
  const items: [Tab, string][] = [["reorder", "Reorder History"], ["new", "New Products"], ["orders", "My Orders"], ["production", "Production"], ["account", "Account"]];
  return <nav className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:grid-cols-5">{items.map(([value, label]) => <button key={value} onClick={() => setTab(value)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === value ? "text-white" : "text-slate-600 hover:bg-slate-100"}`} style={tab === value ? { backgroundColor: profile.theme.primary } : undefined}>{label}</button>)}</nav>;
}

function EmptyHistory() { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">No billable product lines were found in the supplied invoice archive for this location.</div>; }

function HistoricalCard({ item, profile, compact = false, onReorder }: { item: HistoricalProduct; profile: RestaurantProfile; compact?: boolean; onReorder: () => void }) {
  const qtyMismatch = item.customerQuantity !== item.billedLineQuantity;
  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="h-1.5" style={{ backgroundColor: profile.theme.accent }} />
      <CardContent className={compact ? "p-4" : "p-5"}>
        <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-wider text-slate-500">{item.category}</div><h3 className="mt-1 font-bold leading-tight">{item.name}</h3></div><span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{item.invoiceNo || "Legacy"}</span></div>
        {!compact && <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>}
        <div className="mt-4 rounded-xl p-3" style={{ backgroundColor: profile.theme.surface }}><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Historical billing reference</div><div className="mt-1 text-xl font-black">{money(item.billedAmount)}</div><div className="mt-1 text-xs text-slate-600">Invoice {item.invoiceNo || "—"} • {item.invoiceDate || "date unavailable"}</div><div className="mt-1 text-xs text-slate-600">Customer/job qty: {item.customerQuantity.toLocaleString()}{qtyMismatch ? ` • invoice line qty: ${item.billedLineQuantity.toLocaleString()}` : item.customerQuantity > 1 ? ` • billed rate: ${money(item.billedRate)}` : ""}</div></div>
        <Button className="mt-4 w-full" onClick={onReorder}>Reorder from this job</Button>
      </CardContent>
    </Card>
  );
}

function templateForHistorical(item: HistoricalProduct) {
  if (item.category === "Signs & Displays") return PRODUCTS.find((p) => p.id === "poster-large") || PRODUCTS[0];
  if (item.category === "Banners") return PRODUCTS.find((p) => p.id === "banner-vinyl") || PRODUCTS[0];
  if (item.category === "Labels") return PRODUCTS.find((p) => p.id === "label-roll") || PRODUCTS[0];
  if (item.category === "Cards & Flyers") return PRODUCTS.find((p) => p.id === "flyer-standard") || PRODUCTS[0];
  return PRODUCTS.find((p) => p.id === "menu-dine") || PRODUCTS[0];
}

function tomorrowDate() { return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10); }

function HistoricalReorderDialog({ item, profile, onClose, onAdd }: { item: HistoricalProduct; profile: RestaurantProfile; onClose: () => void; onAdd: (item: CartItem) => void }) {
  const [qty, setQty] = useState(Math.max(1, item.customerQuantity));
  const [neededByDate, setNeededByDate] = useState(tomorrowDate());
  const [neededByTime, setNeededByTime] = useState("");
  const [rush, setRush] = useState(false);
  const [proofRequired, setProofRequired] = useState(false);
  const [approverEmail, setApproverEmail] = useState("");
  const [notes, setNotes] = useState("");
  const template = templateForHistorical(item);
  const production = useMemo(() => estimateProduction(template, qty, item.size, item.sides === 2), [template, qty, item.size, item.sides]);
  const valid = qty > 0 && !!neededByDate && (!proofRequired || approverEmail.includes("@"));
  return (
    <Modal title={`Reorder: ${item.name}`} onClose={onClose}>
      <div className="mb-5 rounded-xl border p-4" style={{ borderColor: profile.theme.secondary, backgroundColor: profile.theme.surface }}><div className="text-xs font-bold uppercase tracking-wider text-slate-500">Prior invoice reference</div><div className="mt-1 text-lg font-black">{money(item.billedAmount)} total</div><div className="mt-1 text-xs text-slate-600">Invoice {item.invoiceNo || "—"} • {item.invoiceDate || "—"} • prior customer qty {item.customerQuantity.toLocaleString()}</div><p className="mt-2 text-xs leading-relaxed text-slate-600">{item.description}</p></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label>Reorder quantity</Label><Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value || 0))} /></div><div><Label>Needed by date</Label><Input type="date" value={neededByDate} onChange={(e) => setNeededByDate(e.target.value)} /></div><div><Label>Needed by time</Label><Input type="time" value={neededByTime} onChange={(e) => setNeededByTime(e.target.value)} /></div><div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"><input id="hist-rush" type="checkbox" checked={rush} onChange={(e) => setRush(e.target.checked)} /><Label htmlFor="hist-rush" className="mb-0">Rush production</Label></div><div className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"><input id="hist-proof" type="checkbox" checked={proofRequired} onChange={(e) => setProofRequired(e.target.checked)} /><Label htmlFor="hist-proof" className="mb-0">Send a PDF proof before production</Label></div>{proofRequired && <div className="sm:col-span-2"><Label>Proof approver email</Label><Input type="email" value={approverEmail} onChange={(e) => setApproverEmail(e.target.value)} /></div>}<div className="sm:col-span-2"><Label>Additional production notes</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any changes from the prior invoice job" /></div></div>
      <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Production estimate: <strong>{production.machine}</strong> • {production.estimatedClicks ? `${production.estimatedClicks} clicks` : production.estimatedSquareFeet ? `${production.estimatedSquareFeet} sq ft` : "manual route"} • {production.estimatedMachineMinutes} machine min</div>
      <div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!valid} onClick={() => onAdd({ productId: item.id, qbSku: `HIST-${String(item.invoiceNo || item.id).replace(/[^A-Z0-9-]/gi, "")}`, name: item.name, jobName: item.name, quantity: qty, size: item.size, stock: `Per prior invoice ${item.invoiceNo || "legacy"}`, finish: "Reproduce prior job specifications", doubleSided: item.sides === 2, rush, neededByDate, neededByTime, location: `${profile.name} — ${profile.address}`, packByStore: true, proofRequired, approverEmail: proofRequired ? approverEmail : undefined, artworkMode: "existing", notes: [`Historical reorder from invoice ${item.invoiceNo || "unknown"} dated ${item.invoiceDate || "unknown"}. Last billed ${money(item.billedAmount)} for customer qty ${item.customerQuantity}.`, item.description, notes].filter(Boolean).join("\n"), production })}>Add reorder to production</Button></div>
    </Modal>
  );
}

function NewProductDialog({ product, profile, onClose, onAdd }: { product: Product; profile: RestaurantProfile; onClose: () => void; onAdd: (item: CartItem) => void }) {
  const [jobName, setJobName] = useState(product.name);
  const [qty, setQty] = useState(100);
  const [size, setSize] = useState(product.sizes[0]);
  const [stock, setStock] = useState(product.stocks[0]);
  const [finish, setFinish] = useState(product.finishes[0]);
  const [doubleSided, setDoubleSided] = useState(product.category !== "Posters" && product.category !== "Banners");
  const [neededByDate, setNeededByDate] = useState(tomorrowDate());
  const [neededByTime, setNeededByTime] = useState("");
  const [rush, setRush] = useState(false);
  const [notes, setNotes] = useState("");
  const production = useMemo(() => estimateProduction(product, qty, size, doubleSided), [product, qty, size, doubleSided]);
  return <Modal title={`Configure: ${product.name}`} onClose={onClose}><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Label>Job name / reference</Label><Input value={jobName} onChange={(e) => setJobName(e.target.value)} /></div><div><Label>Quantity</Label><Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value || 0))} /></div><div><Label>Finished size</Label><select className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={size} onChange={(e) => setSize(e.target.value)}>{product.sizes.map((v) => <option key={v}>{v}</option>)}</select></div><div><Label>Stock</Label><select className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={stock} onChange={(e) => setStock(e.target.value)}>{product.stocks.map((v) => <option key={v}>{v}</option>)}</select></div><div><Label>Finish</Label><select className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={finish} onChange={(e) => setFinish(e.target.value)}>{product.finishes.map((v) => <option key={v}>{v}</option>)}</select></div><div><Label>Needed by</Label><Input type="date" value={neededByDate} onChange={(e) => setNeededByDate(e.target.value)} /></div><div><Label>Time</Label><Input type="time" value={neededByTime} onChange={(e) => setNeededByTime(e.target.value)} /></div><label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium"><input type="checkbox" checked={doubleSided} onChange={(e) => setDoubleSided(e.target.checked)} />Double-sided</label><label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium"><input type="checkbox" checked={rush} onChange={(e) => setRush(e.target.checked)} />Rush</label><div className="sm:col-span-2"><Label>Production notes</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!jobName || qty < 1 || !neededByDate} onClick={() => onAdd({ productId: product.id, qbSku: product.qbSku, name: product.name, jobName, quantity: qty, size, stock, finish, doubleSided, rush, neededByDate, neededByTime, location: `${profile.name} — ${profile.address}`, packByStore: true, proofRequired: false, artworkMode: "replacement", artworkFileName: "Artwork required before production", notes, production })}>Add to production</Button></div></Modal>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4"><div className="mx-auto my-4 max-w-3xl rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 className="text-xl font-bold">{title}</h2><button className="rounded-lg px-3 py-1 text-xl text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Close">×</button></div><div className="p-5">{children}</div></div></div>;
}

function ProductionPreview({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  return <div className="mb-3 rounded-xl border border-slate-200 p-4 last:mb-0"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><div><div className="font-semibold">{item.jobName}</div><div className="mt-1 text-xs text-slate-500">{item.quantity.toLocaleString()} • {item.size} • {item.doubleSided ? "2-sided" : "1-sided"}</div></div><div className="flex items-center gap-2"><StatusPill status={initialStatus(item)} /><Button size="sm" variant="outline" onClick={onRemove}>Remove</Button></div></div><div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-4"><div><b>Machine:</b> {item.production.machine}</div><div><b>Clicks:</b> {item.production.estimatedClicks || "—"}</div><div><b>Sheets / sq ft:</b> {item.production.estimatedSheets || item.production.estimatedSquareFeet || "—"}</div><div><b>Time:</b> {item.production.estimatedMachineMinutes} min</div></div></div>;
}

function AccountPanel({ profile }: { profile: RestaurantProfile }) {
  return <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><Card><CardHeader><CardTitle>Location profile</CardTitle><CardDescription>This account is locked to its restaurant and historical catalog.</CardDescription></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-2"><div><div className="text-xs font-bold uppercase tracking-wider text-slate-500">Restaurant</div><div className="mt-1 font-semibold">{profile.name}</div></div><div><div className="text-xs font-bold uppercase tracking-wider text-slate-500">Login ID</div><div className="mt-1 font-mono text-sm">{profile.loginId}</div></div><div className="sm:col-span-2"><div className="text-xs font-bold uppercase tracking-wider text-slate-500">Delivery address</div><div className="mt-1 text-sm">{profile.address}</div></div></div></CardContent></Card><Card><CardHeader><CardTitle>Restaurant visual identity</CardTitle><CardDescription>Unique portal palette and graphic motif assigned to this location.</CardDescription></CardHeader><CardContent><RestaurantGraphic profile={profile} /><div className="mt-4 flex gap-2">{[profile.theme.primary, profile.theme.secondary, profile.theme.accent].map((color) => <div key={color} className="h-9 flex-1 rounded-lg border border-black/5" style={{ backgroundColor: color }} title={color} />)}</div></CardContent></Card></div>;
}
