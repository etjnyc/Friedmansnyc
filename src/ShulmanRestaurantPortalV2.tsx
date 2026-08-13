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
  RESTAURANTS,
  STATUS_STYLES,
  SubmittedOrder,
} from "./portalDomain";

const ORDER_STORAGE_KEY = "friedmans_portal_orders_v2";

function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Complete;
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}>{status}</span>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function ShulmanRestaurantPortalV2() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<PortalUser>({ id: "demo", name: "Admin", role: "admin" });
  const [activeRestaurantId, setActiveRestaurantId] = useState(RESTAURANTS[0].id);
  const [tab, setTab] = useState<"order" | "orders" | "production" | "account">("order");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Menus");
  const [configuring, setConfiguring] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submittedOrders, setSubmittedOrders] = useState<SubmittedOrder[]>([]);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);
  const [feedMessage, setFeedMessage] = useState<string>("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ORDER_STORAGE_KEY);
      if (stored) setSubmittedOrders(JSON.parse(stored));
    } catch {
      // Local history is a convenience only; backend history remains authoritative once connected.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(submittedOrders.slice(0, 50)));
    } catch {
      // Do not block ordering if local storage is unavailable.
    }
  }, [submittedOrders]);

  useEffect(() => {
    function onFM(ev: Event) {
      const custom = ev as CustomEvent;
      const { name, data } = custom.detail || {};
      if (name !== "bootstrap" || !data?.user) return;
      const nextUser = data.user as PortalUser;
      setUser(nextUser);
      setActiveRestaurantId(nextUser.defaultRestaurantId || nextUser.allowedRestaurantIds?.[0] || RESTAURANTS[0].id);
      setLoggedIn(true);
    }

    function onFeedResult(ev: Event) {
      const detail = (ev as CustomEvent).detail || {};
      if (detail.ok && detail.result?.forwarded) {
        setFeedMessage("Production feed accepted and forwarded to the master board endpoint.");
      } else if (detail.ok && detail.result?.configurationRequired) {
        setFeedMessage("Order payload accepted. Master-board endpoint still needs Netlify environment configuration.");
      } else if (!detail.ok) {
        setFeedMessage("Order was created locally/FileMaker-side, but the production-feed handoff reported an error.");
      }
    }

    window.addEventListener("fm:receive", onFM);
    window.addEventListener("shulman:production-order-result", onFeedResult);
    return () => {
      window.removeEventListener("fm:receive", onFM);
      window.removeEventListener("shulman:production-order-result", onFeedResult);
    };
  }, []);

  const allowedRestaurants = useMemo(() => {
    if (user.role === "admin" || !user.allowedRestaurantIds?.length) return RESTAURANTS;
    return RESTAURANTS.filter((r) => user.allowedRestaurantIds?.includes(r.id));
  }, [user]);

  const activeRestaurant = RESTAURANTS.find((r) => r.id === activeRestaurantId) || RESTAURANTS[0];
  const categories = Array.from(new Set(PRODUCTS.map((p) => p.category));
  const filteredProducts = PRODUCTS.filter((p) => p.category === category && p.name.toLowerCase().includes(query.toLowerCase()));

  const cartProduction = useMemo(() => {
    return cart.reduce(
      (acc, item) => {
        acc.clicks += item.production.estimatedClicks || 0;
        acc.sheets += item.production.estimatedSheets || 0;
        acc.squareFeet += item.production.estimatedSquareFeet || 0;
        acc.machineMinutes += item.production.estimatedMachineMinutes;
        acc.finishingMinutes += item.production.estimatedFinishingMinutes;
        return acc;
      },
      { clicks: 0, sheets: 0, squareFeet: 0, machineMinutes: 0, finishingMinutes: 0 }
    );
  }, [cart]);

  function placeOrder() {
    if (!cart.length) return;
    const orderId = makeOrderId();
    const createdAt = new Date().toISOString();
    const productionJobs = buildProductionJobs(cart, orderId, createdAt, user, activeRestaurant);
    const status = productionJobs.some((j) => j.status === "Awaiting Artwork")
      ? "Awaiting Artwork"
      : productionJobs.some((j) => j.status === "Awaiting Proof")
        ? "Awaiting Proof"
        : "Ready to Print";

    const payload = {
      source: "Friedmans Portal",
      source_system: "friedmans_portal",
      orderId,
      createdAt,
      restaurant: activeRestaurant,
      requestedBy: user,
      cart,
      productionSummary: cartProduction,
      productionJobs,
    };

    const fm = (window as any).FM;
    if (fm?.call) fm.call("Create Order", payload);
    window.dispatchEvent(new CustomEvent("shulman:production-order", { detail: payload }));

    setSubmittedOrders((prev) => [{ orderId, createdAt, status, items: cart }, ...prev]);
    setLastSubmittedId(orderId);
    setFeedMessage("Sending production-ready line items to the production feed…");
    setCart([]);
    setTab("orders");
  }

  if (!loggedIn) {
    return <AuthGate onSignIn={() => setLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <div className="font-bold tracking-tight">SHULMAN PAPER</div>
            <div className="text-xs text-slate-500">Restaurant Print Ordering • Production Board Connected</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="hidden min-w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm md:block"
              value={activeRestaurantId}
              disabled={user.role !== "admin"}
              onChange={(e) => setActiveRestaurantId(e.target.value)}
            >
              {allowedRestaurants.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.address}</option>)}
            </select>
            <Button variant="outline" onClick={() => setLoggedIn(false)}>Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-32">
        <Dashboard restaurantName={activeRestaurant.name} address={activeRestaurant.address} />
        <TabNav tab={tab} setTab={setTab} />

        {tab === "order" && (
          <div className="space-y-6">
            <section>
              <div className="mb-3">
                <h2 className="text-lg font-semibold">Quick Reorder</h2>
                <p className="text-sm text-slate-500">Start from the jobs your restaurants order most often.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {PRODUCTS.slice(0, 4).map((p) => (
                  <button key={p.id} onClick={() => setConfiguring(p)} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="mt-1 text-xs text-slate-500">SKU {p.qbSku}</div>
                    <div className="mt-3 text-sm font-medium">Reorder / Configure →</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Start a New Order</h2>
                  <p className="text-sm text-slate-500">Every line item becomes its own production-board job while staying linked to one portal order.</p>
                </div>
                <Input className="lg:w-72" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((c) => <Button key={c} variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>{c}</Button>)}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((p) => (
                  <Card key={p.id} className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <CardDescription>SKU {p.qbSku} • Pricing from Shulman Pricing Bible</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-slate-500">Primary production route: {p.recipe.machine}</div>
                      <Button className="w-full" onClick={() => setConfiguring(p)}>Configure</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === "orders" && (
          <section className="space-y-4">
            {lastSubmittedId && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><strong>{lastSubmittedId}</strong> was converted into production-board-ready line items.</div>}
            {feedMessage && <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">{feedMessage}</div>}
            <OrderCard orderId="FRD-260812-1045" date="Today, 9:17 AM" name="Takeout Menus" status="Printing" />
            <OrderCard orderId="FRD-260812-1041" date="Today, 8:42 AM" name="Table Tents" status="Awaiting Approval" />
            {submittedOrders.map((order) => (
              <OrderCard key={order.orderId} orderId={order.orderId} date={new Date(order.createdAt).toLocaleString()} name={order.items.map((i) => i.jobName).join(", ")} status={order.status} />
            ))}
          </section>
        )}

        {tab === "production" && (
          <section className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric label="Cart Jobs" value={cart.length} />
              <Metric label="Est. Clicks" value={cartProduction.clicks.toLocaleString()} />
              <Metric label="Est. Sheets" value={cartProduction.sheets.toLocaleString()} />
              <Metric label="Machine Min" value={cartProduction.machineMinutes} />
              <Metric label="Finishing Min" value={cartProduction.finishingMinutes} />
            </div>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Production-board feed preview</CardTitle>
                <CardDescription>Workload estimates are operational only. Pricing remains separate and must come from the Pricing Bible.</CardDescription>
              </CardHeader>
              <CardContent>
                {!cart.length ? <p className="text-sm text-slate-500">Configure an item to preview production data.</p> : cart.map((item, i) => <ProductionPreview key={`${item.productId}-${i}`} item={item} />)}
              </CardContent>
            </Card>
          </section>
        )}

        {tab === "account" && <AccountPanel restaurantName={activeRestaurant.name} address={activeRestaurant.address} />}
      </main>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm">
              <span className="font-semibold">{cart.length} production job{cart.length === 1 ? "" : "s"}</span>
              <span className="ml-3 text-slate-500">{cartProduction.clicks ? `${cartProduction.clicks.toLocaleString()} est. clicks` : `${cartProduction.squareFeet.toFixed(1)} est. sq ft`} • {cartProduction.machineMinutes} machine min</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCart([])}>Clear</Button>
              <Button onClick={placeOrder}>Place Order & Send to Production Feed</Button>
            </div>
          </div>
        </div>
      )}

      {configuring && (
        <Configurator
          product={configuring}
          location={`${activeRestaurant.name} — ${activeRestaurant.address}`}
          onClose={() => setConfiguring(null)}
          onAdd={(item) => {
            setCart((prev) => [...prev, item]);
            setConfiguring(null);
            setTab("production");
          }}
        />
      )}
    </div>
  );
}

function AuthGate({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold tracking-tight">SHULMAN PAPER</div>
          <div className="mt-1 text-sm text-slate-500">Restaurant Print Ordering</div>
        </div>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>FileMaker users can be signed in automatically. Demo sign-in remains available while production authentication is connected.</CardDescription>
          </CardHeader>
          <CardContent>
            <Label>Email</Label>
            <Input placeholder="you@restaurant.com" />
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" />
            <Button className="mt-2 w-full" onClick={onSignIn}>Demo sign in</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Dashboard({ restaurantName, address }: { restaurantName: string; address: string }) {
  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ordering for</div>
          <h1 className="mt-1 text-2xl font-bold">{restaurantName}</h1>
          <p className="mt-1 text-sm text-slate-500">{address}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-orange-50 px-4 py-3"><div className="text-xl font-bold text-orange-900">1</div><div className="text-xs text-orange-700">Awaiting Proof</div></div>
          <div className="rounded-xl bg-blue-50 px-4 py-3"><div className="text-xl font-bold text-blue-900">2</div><div className="text-xs text-blue-700">In Production</div></div>
          <div className="rounded-xl bg-emerald-50 px-4 py-3"><div className="text-xl font-bold text-emerald-900">3</div><div className="text-xs text-emerald-700">Ready / Recent</div></div>
        </div>
      </div>
    </section>
  );
}

function TabNav({ tab, setTab }: { tab: "order" | "orders" | "production" | "account"; setTab: (tab: "order" | "orders" | "production" | "account") => void }) {
  return (
    <nav className="mb-6 grid grid-cols-4 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {(["order", "orders", "production", "account"] as const).map((value) => (
        <button key={value} onClick={() => setTab(value)} className={`rounded-lg px-3 py-2 text-sm font-medium capitalize ${tab === value ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
          {value === "orders" ? "My Orders" : value === "production" ? "Production View" : value}
        </button>
      ))}
    </nav>
  );
}

function OrderCard({ orderId, date, name, status }: { orderId: string; date: string; name: string; status: string }) {
  const steps = ["Order Received", "Artwork", "Proof", "Approved", "Printing", "Finishing", "Ready"];
  const activeIndex = status === "Printing" ? 4 : status === "Awaiting Approval" ? 2 : status === "Ready" ? 6 : status === "Ready to Print" ? 3 : 1;
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div><div className="text-sm font-semibold">{orderId} • {name}</div><div className="mt-1 text-xs text-slate-500">{date}</div></div>
          <StatusPill status={status} />
        </div>
        <div className="mt-5 grid grid-cols-7 gap-1">
          {steps.map((step, i) => <div key={step}><div className={`h-2 rounded-full ${i <= activeIndex ? "bg-slate-900" : "bg-slate-200"}`} /><div className="mt-1 hidden text-[10px] text-slate-500 sm:block">{step}</div></div>)}
        </div>
      </CardContent>
    </Card>
  );
}

function ProductionPreview({ item }: { item: CartItem }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div><div className="font-semibold">{item.jobName}</div><div className="text-xs text-slate-500">{item.quantity} • {item.size} • {item.stock} • {item.doubleSided ? "2-sided" : "1-sided"}</div></div>
        <StatusPill status={initialStatus(item)} />
      </div>
      <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3 lg:grid-cols-6">
        <Mini label="Machine" value={item.production.machine} />
        <Mini label="Clicks" value={item.production.estimatedClicks || "—"} />
        <Mini label="Sheets" value={item.production.estimatedSheets || "—"} />
        <Mini label="Sq ft" value={item.production.estimatedSquareFeet || "—"} />
        <Mini label="Machine time" value={`${item.production.estimatedMachineMinutes} min`} />
        <Mini label="Finishing" value={`${item.production.estimatedFinishingMinutes} min`} />
      </div>
    </div>
  );
}

function AccountPanel({ restaurantName, address }: { restaurantName: string; address: string }) {
  return (
    <Card className="shadow-sm">
      <CardHeader><CardTitle>Account & Workflow Defaults</CardTitle><CardDescription>Defaults used for proofing, packing, and production routing.</CardDescription></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div><Label>Default approver email</Label><Input defaultValue="ops@brand.com" /></div>
        <div><Label>Default delivery location</Label><Input defaultValue={`${restaurantName} — ${address}`} /></div>
        <div className="md:col-span-2"><Label>Standing production notes</Label><Textarea rows={3} placeholder="Packing, labeling, delivery, or recurring production instructions" /></div>
      </CardContent>
    </Card>
  );
}

function Configurator({ product, location, onClose, onAdd }: { product: Product; location: string; onClose: () => void; onAdd: (item: CartItem) => void }) {
  const [jobName, setJobName] = useState(product.name);
  const [qty, setQty] = useState(100);
  const [size, setSize] = useState(product.sizes[0]);
  const [stock, setStock] = useState(product.stocks[0]);
  const [finish, setFinish] = useState(product.finishes[0]);
  const [doubleSided, setDoubleSided] = useState(product.category !== "Banners" && product.category !== "Posters");
  const [rush, setRush] = useState(false);
  const [neededByDate, setNeededByDate] = useState("");
  const [neededByTime, setNeededByTime] = useState("");
  const [packByStore, setPackByStore] = useState(true);
  const [proofRequired, setProofRequired] = useState(true);
  const [approverEmail, setApproverEmail] = useState("ops@brand.com");
  const [artworkMode, setArtworkMode] = useState<"existing" | "replacement">("existing");
  const [artworkFileName, setArtworkFileName] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const production = useMemo(() => estimateProduction(product, qty, size, doubleSided), [product, qty, size, doubleSided]);
  const valid = jobName.trim().length > 0 && qty > 0 && neededByDate.length > 0 && (!proofRequired || approverEmail.trim().length > 3) && (artworkMode === "existing" || !!artworkFileName);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto my-4 max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-xl font-bold">Configure {product.name}</h2>
          <p className="mt-1 text-sm text-slate-500">Production-ready fields are captured now so the production board does not have to reinterpret the order later.</p>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-2">
          <Field label="Job Name / Reference"><Input value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="Fall Dinner Menu" /></Field>
          <Field label="Quantity"><Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value || 0))} /></Field>
          <Field label="Finished Size"><NativeSelect value={size} onChange={setSize} options={product.sizes} /></Field>
          <Field label="Stock"><NativeSelect value={stock} onChange={setStock} options={product.stocks} /></Field>
          <Field label="Finish"><NativeSelect value={finish} onChange={setFinish} options={product.finishes} /></Field>
          <Field label="Delivery Location"><Input value={location} readOnly /></Field>
          <Field label="Needed By — Date"><Input type="date" value={neededByDate} onChange={(e) => setNeededByDate(e.target.value)} /></Field>
          <Field label="Needed By — Time"><Input type="time" value={neededByTime} onChange={(e) => setNeededByTime(e.target.value)} /></Field>

          <Toggle label="Double-sided" description="Used to calculate digital clicks and press load." checked={doubleSided} onChange={setDoubleSided} />
          <Toggle label="Rush" description="Flags this line item as RUSH on the production board." checked={rush} onChange={setRush} />
          <Toggle label="Pack by Store" description="Split and label by destination/location." checked={packByStore} onChange={setPackByStore} />
          <Toggle label="Proof Required" description="Hold production until proof workflow is satisfied." checked={proofRequired} onChange={setProofRequired} />

          {proofRequired && <Field label="Approver Email"><Input type="email" value={approverEmail} onChange={(e) => setApproverEmail(e.target.value)} /></Field>}
          <Field label="Artwork">
            <NativeSelect value={artworkMode} onChange={(value) => setArtworkMode(value as "existing" | "replacement")} options={["existing", "replacement"]} labels={{ existing: "Use artwork on file", replacement: "Upload replacement artwork" }} />
            {artworkMode === "replacement" && <input className="mt-2 block w-full text-sm" type="file" accept=".pdf,.ai,.eps,.png,.jpg,.jpeg" onChange={(e) => setArtworkFileName(e.target.files?.[0]?.name)} />}
          </Field>

          <div className="md:col-span-2"><Label>Production Notes</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={'Trim 0.125" all sides, score @ 6", pack 100s by store, etc.'} /></div>

          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-sm font-semibold">Automatic production estimate</div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Mini label="Machine" value={production.machine} />
              <Mini label="Sheets" value={production.estimatedSheets ?? "—"} />
              <Mini label="Clicks" value={production.estimatedClicks ?? "—"} />
              <Mini label="Sq ft" value={production.estimatedSquareFeet ?? "—"} />
              <Mini label="Machine time" value={`${production.estimatedMachineMinutes} min`} />
              <Mini label="Finishing" value={`${production.estimatedFinishingMinutes} min`} />
            </div>
            <p className="mt-3 text-xs text-slate-500">Workload estimates only. Customer pricing must be supplied by the Shulman Pricing Bible.</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 p-5">
          <div className="text-xs text-slate-500">Required: job name, quantity, needed-by date, artwork readiness, and proof approver when applicable.</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={!valid} onClick={() => onAdd({ productId: product.id, qbSku: product.qbSku, name: product.name, jobName: jobName.trim(), quantity: qty, size, stock, finish, doubleSided, rush, neededByDate, neededByTime, location, packByStore, proofRequired, approverEmail: proofRequired ? approverEmail : undefined, artworkMode, artworkFileName, notes, production })}>Add Production Job</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}</div>;
}

function NativeSelect({ value, onChange, options, labels }: { value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string> }) {
  return <select className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{labels?.[option] || option}</option>)}</select>;
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3"><div><div className="text-sm font-medium">{label}</div><div className="mt-1 text-xs text-slate-500">{description}</div></div><input className="h-5 w-5" type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /></label>;
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>;
}
