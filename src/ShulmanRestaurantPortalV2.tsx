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

type PortalUser = {
  id: string;
  name: string;
  role: "admin" | "end_user";
  defaultRestaurantId?: string;
  allowedRestaurantIds?: string[];
};

type ProductionMode = "digital" | "wide" | "other";

type Product = {
  id: string;
  name: string;
  category: string;
  qbSku: string;
  startingPrice: number;
  sizes: string[];
  stocks: string[];
  finishes: string[];
  recipe: {
    mode: ProductionMode;
    machine: string;
    finishedPerSheet?: number;
    wastePct?: number;
    clicksPerMinute?: number;
    setupMinutes: number;
    squareFeetPerMinute?: number;
    finishingMinutesPer100?: number;
  };
};

type ProductionEstimate = {
  machine: string;
  estimatedSheets?: number;
  estimatedClicks?: number;
  estimatedSquareFeet?: number;
  estimatedMachineMinutes: number;
  estimatedFinishingMinutes: number;
};

type CartItem = {
  productId: string;
  qbSku: string;
  name: string;
  jobName: string;
  quantity: number;
  size: string;
  stock: string;
  finish: string;
  doubleSided: boolean;
  rush: boolean;
  neededByDate: string;
  neededByTime: string;
  location: string;
  packByStore: boolean;
  proofRequired: boolean;
  approverEmail?: string;
  artworkMode: "existing" | "replacement";
  artworkFileName?: string;
  notes?: string;
  production: ProductionEstimate;
  startingPrice: number;
};

type SubmittedOrder = {
  orderId: string;
  createdAt: string;
  status: string;
  items: CartItem[];
};

const RESTAURANTS = [
  { id: "suram-31-serano", name: "Suram 31 (Serano)", brand: "Suram", address: "132 W 31st St, New York, NY 10001" },
  { id: "suram-31", name: "Suram 31", brand: "Suram", address: "132 W 31st St, New York, NY 10001" },
  { id: "suram-61", name: "Suram 61", brand: "Suram", address: "21 West End Ave, New York, NY 10023" },
  { id: "wu-nussbaum", name: "Wu & Nussbaum", brand: "Wu & Nussbaum", address: "2897 Broadway, New York, NY 10025" },
  { id: "picka-vesey", name: "Pick-a-Bagel Vesey", brand: "Pick-a-Bagel", address: "251 Vesey St, New York, NY 10282" },
  { id: "picka-37-west-end", name: "Pick-a-Bagel 37 West End", brand: "Pick-a-Bagel", address: "New York, NY" },
  { id: "pq-uws", name: "Pastrami Queen – Upper West Side", brand: "Pastrami Queen", address: "138 W 72nd St, New York, NY" },
  { id: "kossars-72", name: "Kossar’s West End 72nd", brand: "Kossar’s", address: "260 W 72nd St, New York, NY 10023" },
];

const PRODUCTS: Product[] = [
  {
    id: "menu-dine",
    name: "Dine-In Menu",
    category: "Menus",
    qbSku: "MENU-DINE",
    startingPrice: 129,
    sizes: ["8.5×11", "8.5×14", "11×17"],
    stocks: ["White Card Stock", "Cream Card Stock", "Synthetic 12 mil", "Flyer Paper"],
    finishes: ["None"],
    recipe: { mode: "digital", machine: "Canon imagePRESS V1000", finishedPerSheet: 1, wastePct: 0.03, clicksPerMinute: 80, setupMinutes: 8 },
  },
  {
    id: "menu-togo",
    name: "Takeout Menu",
    category: "Menus",
    qbSku: "MENU-TOGO",
    startingPrice: 89,
    sizes: ["8.5×11", "8.5×14"],
    stocks: ["White Card Stock", "Cream Card Stock", "Synthetic 12 mil", "Flyer Paper"],
    finishes: ["None", "Score & Fold"],
    recipe: { mode: "digital", machine: "Canon imagePRESS V1000", finishedPerSheet: 1, wastePct: 0.03, clicksPerMinute: 80, setupMinutes: 8, finishingMinutesPer100: 3 },
  },
  {
    id: "flyer-standard",
    name: "Promo Flyers",
    category: "Flyers",
    qbSku: "FLYER-STD",
    startingPrice: 49,
    sizes: ["4×6", "5×7", "8.5×11"],
    stocks: ["100# Gloss Cover", "100# Silk Cover", "80# Uncoated"],
    finishes: ["No Coat", "AQ Coat", "UV Gloss"],
    recipe: { mode: "digital", machine: "Canon imagePRESS V1000", finishedPerSheet: 4, wastePct: 0.03, clicksPerMinute: 80, setupMinutes: 8, finishingMinutesPer100: 2 },
  },
  {
    id: "poster-large",
    name: "Large Poster",
    category: "Posters",
    qbSku: "POSTER-LG",
    startingPrice: 39,
    sizes: ["12×18", "18×24", "24×36"],
    stocks: ["Photo Paper", "Mounted to 3/16” white foam core", "Printed direct on 3mm PVC Plastic"],
    finishes: ["No Laminate", "Matte Laminate", "Gloss Laminate"],
    recipe: { mode: "wide", machine: "HP DesignJet Z5400", setupMinutes: 10, squareFeetPerMinute: 2.5, finishingMinutesPer100: 12 },
  },
  {
    id: "banner-vinyl",
    name: "Vinyl Banner",
    category: "Banners",
    qbSku: "BANNER-VNYL",
    startingPrice: 59,
    sizes: ["24×48", "36×72", "48×96"],
    stocks: ["13oz Vinyl", "18oz Heavy Vinyl"],
    finishes: ["Top corners", "All Corners", "Every 12\"", "Every 6\""],
    recipe: { mode: "wide", machine: "HP DesignJet Z5400", setupMinutes: 10, squareFeetPerMinute: 2.2, finishingMinutesPer100: 15 },
  },
  {
    id: "label-roll",
    name: "Product Labels",
    category: "Labels",
    qbSku: "LABEL-ROLL",
    startingPrice: 35,
    sizes: ["2×2", "3×3", "3×5", "4×6"],
    stocks: ["Paper Permanent", "Poly Waterproof", "Kraft"],
    finishes: ["Matte", "Gloss"],
    recipe: { mode: "other", machine: "Label workflow / assign at preflight", setupMinutes: 10, finishingMinutesPer100: 2 },
  },
  {
    id: "tent-standard",
    name: "Table Tents",
    category: "Other",
    qbSku: "TENT-STD",
    startingPrice: 75,
    sizes: ["4×6 (flat 4×12)", "5×7 (flat 5×14)"],
    stocks: ["120# Cover Uncoated", "14pt C2S", "16pt C2S"],
    finishes: ["Score & Fold", "Score Only"],
    recipe: { mode: "digital", machine: "Canon imagePRESS V1000", finishedPerSheet: 2, wastePct: 0.04, clicksPerMinute: 70, setupMinutes: 10, finishingMinutesPer100: 5 },
  },
];

const STATUS_STYLES: Record<string, string> = {
  "Awaiting Artwork": "bg-amber-100 text-amber-900 border-amber-200",
  "Awaiting Proof": "bg-yellow-100 text-yellow-900 border-yellow-200",
  "Awaiting Approval": "bg-orange-100 text-orange-900 border-orange-200",
  "Ready to Print": "bg-emerald-100 text-emerald-900 border-emerald-200",
  Printing: "bg-blue-100 text-blue-900 border-blue-200",
  Finishing: "bg-violet-100 text-violet-900 border-violet-200",
  Ready: "bg-teal-100 text-teal-900 border-teal-200",
  Complete: "bg-slate-200 text-slate-800 border-slate-300",
};

function parseDimensions(size: string) {
  const match = size.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)/i);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

function estimateProduction(product: Product, qty: number, size: string, doubleSided: boolean): ProductionEstimate {
  const safeQty = Math.max(1, qty || 1);
  const recipe = product.recipe;
  const finishingMinutes = Math.ceil(((recipe.finishingMinutesPer100 || 0) * safeQty) / 100);

  if (recipe.mode === "digital") {
    const ups = Math.max(1, recipe.finishedPerSheet || 1);
    const waste = 1 + (recipe.wastePct || 0);
    const sheets = Math.ceil((safeQty / ups) * waste);
    const sides = doubleSided ? 2 : 1;
    const clicks = sheets * sides;
    const machineMinutes = Math.ceil(recipe.setupMinutes + clicks / Math.max(1, recipe.clicksPerMinute || 60));
    return {
      machine: recipe.machine,
      estimatedSheets: sheets,
      estimatedClicks: clicks,
      estimatedMachineMinutes: machineMinutes,
      estimatedFinishingMinutes: finishingMinutes,
    };
  }

  if (recipe.mode === "wide") {
    const dimensions = parseDimensions(size);
    const squareFeet = dimensions ? (dimensions.width * dimensions.height * safeQty) / 144 : 0;
    const machineMinutes = Math.ceil(recipe.setupMinutes + squareFeet / Math.max(0.1, recipe.squareFeetPerMinute || 1));
    return {
      machine: recipe.machine,
      estimatedSquareFeet: Math.round(squareFeet * 10) / 10,
      estimatedMachineMinutes: machineMinutes,
      estimatedFinishingMinutes: finishingMinutes,
    };
  }

  return {
    machine: recipe.machine,
    estimatedMachineMinutes: recipe.setupMinutes,
    estimatedFinishingMinutes: finishingMinutes,
  };
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function makeOrderId() {
  const d = new Date();
  const stamp = [
    String(d.getFullYear()).slice(2),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
    String(d.getSeconds()).padStart(2, "0"),
  ].join("");
  return `FRD-${stamp}`;
}

function initialStatus(item: CartItem) {
  if (item.artworkMode === "replacement" && !item.artworkFileName) return "Awaiting Artwork";
  if (item.proofRequired) return "Awaiting Proof";
  return "Ready to Print";
}

function StatusPill({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.Complete}`}>{status}</span>;
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
    window.addEventListener("fm:receive", onFM);
    return () => window.removeEventListener("fm:receive", onFM);
  }, []);

  const allowedRestaurants = useMemo(() => {
    if (user.role === "admin" || !user.allowedRestaurantIds?.length) return RESTAURANTS;
    return RESTAURANTS.filter((r) => user.allowedRestaurantIds?.includes(r.id));
  }, [user]);

  const activeRestaurant = RESTAURANTS.find((r) => r.id === activeRestaurantId) || RESTAURANTS[0];
  const categories = Array.from(new Set(PRODUCTS.map((p) => p.category)));
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
    const productionJobs = cart.map((item, index) => ({
      source: "Friedmans Portal",
      source_system: "friedmans_portal",
      source_order_id: orderId,
      job_id: `${orderId}-${String(index + 1).padStart(2, "0")}`,
      customer: activeRestaurant.brand,
      restaurant: activeRestaurant.name,
      delivery_location: item.location,
      requested_by: user.name,
      received_at: createdAt,
      needed_by: item.neededByDate ? `${item.neededByDate}${item.neededByTime ? `T${item.neededByTime}` : ""}` : null,
      rush: item.rush,
      job_name: item.jobName,
      product: item.name,
      sku: item.qbSku,
      quantity: item.quantity,
      finished_size: item.size,
      stock: item.stock,
      sides: item.doubleSided ? 2 : 1,
      finish: item.finish,
      artwork_status: item.artworkMode === "existing" ? "On file" : item.artworkFileName ? "Replacement selected" : "Missing",
      artwork_file_name: item.artworkFileName || null,
      proof_required: item.proofRequired,
      proof_status: item.proofRequired ? "Required" : "Not required",
      approver_email: item.proofRequired ? item.approverEmail || null : null,
      estimated_clicks: item.production.estimatedClicks || 0,
      estimated_sheets: item.production.estimatedSheets || 0,
      estimated_square_feet: item.production.estimatedSquareFeet || 0,
      estimated_machine_minutes: item.production.estimatedMachineMinutes,
      machine: item.production.machine,
      estimated_finishing_minutes: item.production.estimatedFinishingMinutes,
      pack_by_store: item.packByStore,
      production_notes: item.notes || "",
      status: initialStatus(item),
      priority: item.rush ? "RUSH" : "STANDARD",
      last_updated: createdAt,
    }));

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

    setSubmittedOrders((prev) => [{ orderId, createdAt, status: productionJobs.some((j) => j.status === "Awaiting Artwork") ? "Awaiting Artwork" : productionJobs.some((j) => j.status === "Awaiting Proof") ? "Awaiting Proof" : "Ready to Print", items: cart }, ...prev]);
    setLastSubmittedId(orderId);
    setCart([]);
    setTab("orders");
  }

  if (!loggedIn) {
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
              <Button className="mt-2 w-full" onClick={() => setLoggedIn(true)}>Demo sign in</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ordering for</div>
              <h1 className="mt-1 text-2xl font-bold">{activeRestaurant.name}</h1>
              <p className="mt-1 text-sm text-slate-500">{activeRestaurant.address}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-orange-50 px-4 py-3"><div className="text-xl font-bold text-orange-900">1</div><div className="text-xs text-orange-700">Awaiting Proof</div></div>
              <div className="rounded-xl bg-blue-50 px-4 py-3"><div className="text-xl font-bold text-blue-900">2</div><div className="text-xs text-blue-700">In Production</div></div>
              <div className="rounded-xl bg-emerald-50 px-4 py-3"><div className="text-xl font-bold text-emerald-900">3</div><div className="text-xs text-emerald-700">Ready / Recent</div></div>
            </div>
          </div>
        </section>

        <nav className="mb-6 grid grid-cols-4 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {(["order", "orders", "production", "account"] as const).map((value) => (
            <button key={value} onClick={() => setTab(value)} className={`rounded-lg px-3 py-2 text-sm font-medium capitalize ${tab === value ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{value === "orders" ? "My Orders" : value === "production" ? "Production View" : value}</button>
          ))}
        </nav>

        {tab === "order" && (
          <div className="space-y-6">
            <section>
              <div className="mb-3 flex items-end justify-between">
                <div><h2 className="text-lg font-semibold">Quick Reorder</h2><p className="text-sm text-slate-500">Start from the jobs your restaurants order most often.</p></div>
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
                <div><h2 className="text-lg font-semibold">Start a New Order</h2><p className="text-sm text-slate-500">Every line item becomes its own production-board job while staying linked to one portal order.</p></div>
                <Input className="lg:w-72" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((c) => <Button key={c} variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>{c}</Button>)}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((p) => (
                  <Card key={p.id} className="shadow-sm">
                    <CardHeader><CardTitle className="text-base">{p.name}</CardTitle><CardDescription>SKU {p.qbSku} • Starting at {formatMoney(p.startingPrice)}</CardDescription></CardHeader>
                    <CardContent>
                      <div className="text-sm text-slate-500">Primary route: {p.recipe.machine}</div>
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
            <OrderCard orderId="FRD-260812-1045" date="Today, 9:17 AM" name="Takeout Menus" status="Printing" />
            <OrderCard orderId="FRD-260812-1041" date="Today, 8:42 AM" name="Table Tents" status="Awaiting Approval" />
            {submittedOrders.map((order) => <OrderCard key={order.orderId} orderId={order.orderId} date={new Date(order.createdAt).toLocaleString()} name={order.items.map((i) => i.jobName).join(", ")} status={order.status} />)}
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
              <CardHeader><CardTitle>Production-board feed preview</CardTitle><CardDescription>These are the fields that will leave the portal with every submitted line item.</CardDescription></CardHeader>
              <CardContent>
                {!cart.length ? <p className="text-sm text-slate-500">Configure an item to preview production data.</p> : cart.map((item, i) => <ProductionPreview key={`${item.productId}-${i}`} item={item} />)}
              </CardContent>
            </Card>
          </section>
        )}

        {tab === "account" && (
          <Card className="shadow-sm">
            <CardHeader><CardTitle>Account & Workflow Defaults</CardTitle><CardDescription>Defaults used for proofing, packing, and production routing.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div><Label>Default approver email</Label><Input defaultValue="ops@brand.com" /></div>
              <div><Label>Default delivery location</Label><Input defaultValue={`${activeRestaurant.name} — ${activeRestaurant.address}`} /></div>
              <div className="md:col-span-2"><Label>Standing production notes</Label><Textarea rows={3} placeholder="Packing, labeling, delivery, or recurring production instructions" /></div>
            </CardContent>
          </Card>
        )}
      </main>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm"><span className="font-semibold">{cart.length} production job{cart.length === 1 ? "" : "s"}</span><span className="ml-3 text-slate-500">{cartProduction.clicks ? `${cartProduction.clicks.toLocaleString()} est. clicks` : `${cartProduction.squareFeet.toFixed(1)} est. sq ft`} • {cartProduction.machineMinutes} machine min</span></div>
            <div className="flex gap-2"><Button variant="outline" onClick={() => setCart([])}>Clear</Button><Button onClick={placeOrder}>Place Order & Send to Production Feed</Button></div>
          </div>
        </div>
      )}

      {configuring && <Configurator product={configuring} location={`${activeRestaurant.name} — ${activeRestaurant.address}`} onClose={() => setConfiguring(null)} onAdd={(item) => { setCart((prev) => [...prev, item]); setConfiguring(null); }} />}
    </div>
  );
}

function OrderCard({ orderId, date, name, status }: { orderId: string; date: string; name: string; status: string }) {
  const steps = ["Order Received", "Artwork", "Proof", "Approved", "Printing", "Finishing", "Ready"];
  const activeIndex = status === "Printing" ? 4 : status === "Awaiting Approval" ? 2 : status === "Ready" ? 6 : 1;
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
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><div><div className="font-semibold">{item.jobName}</div><div className="text-xs text-slate-500">{item.quantity} • {item.size} • {item.stock} • {item.doubleSided ? "2-sided" : "1-sided"}</div></div><StatusPill status={initialStatus(item)} /></div>
      <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3 lg:grid-cols-6">
        <div><strong>Machine:</strong><br />{item.production.machine}</div>
        <div><strong>Clicks:</strong><br />{item.production.estimatedClicks || "—"}</div>
        <div><strong>Sheets:</strong><br />{item.production.estimatedSheets || "—"}</div>
        <div><strong>Sq ft:</strong><br />{item.production.estimatedSquareFeet || "—"}</div>
        <div><strong>Machine:</strong><br />{item.production.estimatedMachineMinutes} min</div>
        <div><strong>Finishing:</strong><br />{item.production.estimatedFinishingMinutes} min</div>
      </div>
    </div>
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
        <div className="border-b border-slate-200 p-5"><h2 className="text-xl font-bold">Configure {product.name}</h2><p className="mt-1 text-sm text-slate-500">Production-ready fields are captured now so the production board does not have to reinterpret the order later.</p></div>
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
            <p className="mt-3 text-xs text-slate-500">These are workload estimates, not customer pricing. Final pricing should come from the Shulman pricing bible.</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 p-5">
          <div className="text-xs text-slate-500">Required before adding: job name, quantity, needed-by date, artwork readiness, and proof approver when applicable.</div>
          <div className="flex gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!valid} onClick={() => onAdd({ productId: product.id, qbSku: product.qbSku, name: product.name, jobName: jobName.trim(), quantity: qty, size, stock, finish, doubleSided, rush, neededByDate, neededByTime, location, packByStore, proofRequired, approverEmail: proofRequired ? approverEmail : undefined, artworkMode, artworkFileName, notes, production, startingPrice: product.startingPrice })}>Add Production Job</Button></div>
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
