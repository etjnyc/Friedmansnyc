import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Search,
  Pizza,
  ScrollText,
  FileStack,
  LogIn,
  LogOut,
  Loader2,
  Plus,
  Upload,
  Check,
  History,
  User,
  Building2,
  BadgeInfo,
} from "lucide-react";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Separator,
  Textarea,
  Switch,
} from "@/components/ui";

// =============================
// Inline Assets
// =============================
// NOTE: Inline SVG logo is rendered directly in the Header for reliability across environments.
// If you still prefer a data URL, we can re-enable it later.base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA0MjAgNjAnPjxyZWN0IHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnIGZpbGw9J3doaXRlJy8+PHRleHQgeD0nMCcgeT0nMjgnIGZvbnQtZmFtaWx5PSdJbnRlcicsIEFyaWFsLCBzYW5zLXNlcmlmJyBmb250LXdlaWdodD0nNjAwJyBmb250LXNpemU9JzIyJyBmaWxsPScjMGYxNzJhJz5TSFVMTUFOIFBBUEVSPC90ZXh0Pjx0ZXh0IHg9JzAnIHk9JzQ4JyBmb250LWZhbWlseT0nSW50ZXInLCBBcmlhbCwgc2Fucy1zZXJpZicgZm9udC1zaXplPScxMicgZmlsbD0nIzQ3NTU2OSc+RmlsbGluZyBzbWFsbCBvcmRlcnMgZm9yIGJpZyBpZGVhcyDigKIgd3d3LnNodWxtYW5wYXBlci5jb208L3RleHQ+PC9zdmc+";

// =============================
// Reference Data
// =============================
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

// Top menu ordering: Menus, Flyers, Posters, Banners, Labels, Other
const CATEGORIES = [
  { id: "menus", name: "Menus", icon: ScrollText },
  { id: "flyers", name: "Flyers", icon: Pizza },
  { id: "posters", name: "Posters", icon: FileStack },
  { id: "banners", name: "Banners", icon: FileStack },
  { id: "labels", name: "Labels", icon: BadgeInfo },
  { id: "other", name: "Other", icon: FileStack },
];

const STOCK_PRESETS = {
  menus: [
    "White Card Stock",
    "Cream Card Stock",
    "Synthetic 12 mil",
    "Flyer Paper",
  ],
  flyers: ["100# Gloss Cover", "100# Silk Cover", "80# Uncoated"],
  posters: [
    "Photo Paper",
    "Mounted to 3/16” white foam core",
    "Printed direct on 3mm PVC Plastic",
  ],
  banners: ["13oz Vinyl", "18oz Heavy Vinyl"],
  labels: ["Paper Permanent", "Poly Waterproof", "Kraft"],
  other: ["120# Cover Uncoated", "14pt C2S", "16pt C2S"],
};

const FINISH_PRESETS = {
  // Menus: no laminate (synthetic only)
  menus: ["None"],
  flyers: ["AQ Coat", "UV Gloss", "No Coat"],
  posters: ["No Laminate", "Matte Laminate", "Gloss Laminate"],
  // Banners: grommet choices
  banners: ["Top corners", "All Corners", "Every 12\"", "Every 6\""],
  labels: ["Matte", "Gloss"],
  other: ["Score & Fold", "Score Only"],
};

const PRODUCTS = [
  {
    id: "menu-1",
    name: "Dine-In Menu",
    category: "menus",
    basePrice: 129,
    qbSku: "MENU-DINE",
    options: {
      sizes: ["8.5×11", "8.5×14", "11×17"],
      stocks: STOCK_PRESETS.menus,
      finishes: FINISH_PRESETS.menus,
    },
  },
  {
    id: "menu-2",
    name: "Takeout Menu",
    category: "menus",
    basePrice: 89,
    qbSku: "MENU-TOGO",
    options: {
      sizes: ["8.5×11", "8.5×14"],
      stocks: STOCK_PRESETS.menus,
      finishes: FINISH_PRESETS.menus,
    },
  },
  {
    id: "banner-1",
    name: "Vinyl Banner",
    category: "banners",
    basePrice: 59,
    qbSku: "BANNER-VNYL",
    options: {
      sizes: ["24×48", "36×72", "48×96"],
      stocks: STOCK_PRESETS.banners,
      finishes: FINISH_PRESETS.banners,
    },
  },
  {
    id: "flyer-1",
    name: "Promo Flyers",
    category: "flyers",
    basePrice: 49,
    qbSku: "FLYER-STD",
    options: {
      sizes: ["4×6", "5×7", "8.5×11"],
      stocks: STOCK_PRESETS.flyers,
      finishes: FINISH_PRESETS.flyers,
    },
  },
  {
    id: "poster-1",
    name: "Large Poster",
    category: "posters",
    basePrice: 39,
    qbSku: "POSTER-LG",
    options: {
      sizes: ["12×18", "18×24", "24×36"],
      stocks: STOCK_PRESETS.posters,
      finishes: FINISH_PRESETS.posters,
    },
  },
  {
    id: "label-1",
    name: "Product Labels",
    category: "labels",
    basePrice: 35,
    qbSku: "LABEL-ROLL",
    options: {
      sizes: ["2×2", "3×3", "3×5", "4×6"],
      stocks: STOCK_PRESETS.labels,
      finishes: FINISH_PRESETS.labels,
    },
  },
  {
    id: "tent-1",
    name: "Table Tents",
    category: "other",
    basePrice: 75,
    qbSku: "TENT-STD",
    options: {
      sizes: ["4×6 (flat 4×12)", "5×7 (flat 5×14)"],
      stocks: STOCK_PRESETS.other,
      finishes: FINISH_PRESETS.other,
    },
  },
];

// =============================
// Utilities
// =============================
const LOCATIONS = [
  "Suram 31 (Serano) — 132 W 31st St, New York, NY 10001",
  "Suram 31 — 132 W 31st St, New York, NY 10001",
  "Suram 61 — 21 West End Ave, New York, NY 10023",
  "Wu & Nussbaum — 2897 Broadway, New York, NY 10025",
  "Pick-a-Bagel Vesey — 251 Vesey St, New York, NY 10282",
  "Pick-a-Bagel 37 West End — New York, NY",
  "Pastrami Queen – Upper West Side — 138 W 72nd St, New York, NY",
  "Kossar’s West End 72nd — 260 W 72nd St, New York, NY 10023",
];

function currency(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function calculateUnitPrice(
  { basePrice }: { basePrice: number },
  opts: { size: string; stock: string; finish: string; doubleSided: boolean }
) {
  let price = basePrice;
  const { size, stock, finish, doubleSided } = opts;
  // Add laminate only if not "No Laminate"
  if (/laminate/i.test(finish) && !/no\s*laminate/i.test(finish)) price += 10;
  if (
    stock.toLowerCase().includes("cover") ||
    stock.toLowerCase().includes("heavy") ||
    stock.toLowerCase().includes("superfine")
  )
    price += 8;
  if (size.includes("24") || size.includes("36") || size.includes("48")) price += 12;
  if (doubleSided) price += 6;
  return price;
}

// Permission helpers
function computeAllowedSet(role: string | undefined, allowedIds?: string[]) {
  if (role === "admin" || !allowedIds || allowedIds.length === 0) {
    return new Set(RESTAURANTS.map((r) => r.id));
  }
  return new Set(allowedIds);
}

// =============================
// Types
// =============================
type CartItem = {
  productId: string;
  name: string;
  quantity: number;
  size: string;
  stock: string;
  finish: string;
  doubleSided: boolean;
  rush: boolean;
  notes?: string;
  unitPrice: number;
  // Business additions
  location?: string;
  packByStore: boolean;
  proofRequired: boolean;
  approverEmail?: string;
  qbSku?: string;
};

type PortalUser = {
  id: string;
  name: string;
  role: "admin" | "end_user";
  defaultRestaurantId?: string;
  allowedRestaurantIds?: string[];
} | null;

// =============================
// Main Component
// =============================
export default function ShulmanRestaurantPortal() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeRestaurant, setActiveRestaurant] = useState<string | undefined>(RESTAURANTS[0].id);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("menus");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showConfigurator, setShowConfigurator] = useState<string | null>(null);
  const [tab, setTab] = useState("order");
  const [user, setUser] = useState<PortalUser>({ id: "demo", name: "Admin", role: "admin" });
  const [allowedRestaurantIds, setAllowedRestaurantIds] = useState<Set<string>>(computeAllowedSet("admin"));

  const restaurant = useMemo(() => RESTAURANTS.find((r) => r.id === activeRestaurant), [activeRestaurant]);

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => p.category === activeCat && p.name.toLowerCase().includes(query.toLowerCase()));
  }, [activeCat, query]);

  // Listen for FM bootstrap (optional) to set user + permissions
  useEffect(() => {
    function onFM(ev: any) {
      const { name, data } = ev.detail || {};
      if (name === "bootstrap") {
        const u = data.user as PortalUser;
        setUser(u);
        const allowedSet = computeAllowedSet(u?.role, u?.allowedRestaurantIds);
        setAllowedRestaurantIds(allowedSet);
        const def =
          u?.defaultRestaurantId || (u?.allowedRestaurantIds && u.allowedRestaurantIds[0]) || RESTAURANTS[0].id;
        setActiveRestaurant(def);
        setLoggedIn(true);
      }
    }
    window.addEventListener("fm:receive", onFM as any);
    return () => window.removeEventListener("fm:receive", onFM as any);
  }, []);

  function handleLogin() {
    setLoading(true);
    setTimeout(() => {
      setLoggedIn(true);
      setLoading(false);
    }, 500);
  }

  function addToCart(item: CartItem) {
    setCart((prev) => [...prev, item]);
    setShowConfigurator(null);
  }

  function removeFromCart(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  const subtotal = useMemo(() => cart.reduce((acc, c) => acc + c.unitPrice * c.quantity, 0), [cart]);
  const rushFee = useMemo(() => (cart.some((c) => c.rush) ? subtotal * 0.15 : 0), [cart, subtotal]);
  const total = subtotal + rushFee;

  const isAdmin = user?.role === "admin";
  const visibleRestaurants = RESTAURANTS; // constant; no memo needed
  const grayedOutIds = useMemo(
    () => new Set(visibleRestaurants.map((r) => r.id).filter((id) => !allowedRestaurantIds.has(id))),
    [visibleRestaurants, allowedRestaurantIds]
  );
  const selectDisabled = !isAdmin; // end users always locked

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      <Header
        loggedIn={loggedIn}
        restaurant={restaurant?.name}
        onLogout={() => setLoggedIn(false)}
        onLogin={handleLogin}
        loading={loading}
        activeRestaurant={activeRestaurant}
        setActiveRestaurant={setActiveRestaurant}
        visibleRestaurants={visibleRestaurants}
        selectDisabled={selectDisabled}
        grayedOutIds={grayedOutIds}
      />

      <main className="mx-auto max-w-7xl px-4 pb-24">
        {!loggedIn ? (
          <AuthGate onLogin={handleLogin} loading={loading} />
        ) : (
          <div className="mt-6">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-4 w-full bg-white/70 backdrop-blur border rounded-xl">
                <TabsTrigger value="order">Order</TabsTrigger>
                <TabsTrigger value="orders">My Orders</TabsTrigger>
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>

              <TabsContent value="order" className="mt-6">
                <OrderToolbar query={query} setQuery={setQuery} activeCat={activeCat} setActiveCat={setActiveCat} />

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((p) => (
                    <ProductCard key={p.id} product={p} onConfigure={() => setShowConfigurator(p.id)} />
                  ))}
                </div>

                <CartBar subtotal={subtotal} rushFee={rushFee} total={total} items={cart} onRemove={removeFromCart} />
              </TabsContent>

              <TabsContent value="orders" className="mt-6">
                <OrderHistory />
              </TabsContent>

              <TabsContent value="assets" className="mt-6">
                <AssetsLibrary />
              </TabsContent>

              <TabsContent value="account" className="mt-6">
                <AccountPanel restaurant={restaurant?.name || ""} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showConfigurator && (
          <Configurator
            key={showConfigurator}
            product={PRODUCTS.find((p) => p.id === showConfigurator)!}
            onClose={() => setShowConfigurator(null)}
            onAddToCart={addToCart}
          />
        )}
      </AnimatePresence>

      <footer className="border-t bg-white/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 text-sm text-slate-500 flex items-center justify-between">
          <p>© {new Date().getFullYear()} Shulman Paper Co. • Print Ordering</p>
          <p className="hidden sm:block">Secure • Fast Reorder • Proof Approval</p>
        </div>
      </footer>
    </div>
  );
}

// =============================
// Header
// =============================
function Header({
  loggedIn,
  restaurant,
  onLogout,
  onLogin,
  loading,
  activeRestaurant,
  setActiveRestaurant,
  visibleRestaurants,
  selectDisabled,
  grayedOutIds,
}: {
  loggedIn: boolean;
  restaurant?: string;
  onLogout: () => void;
  onLogin: () => void;
  loading: boolean;
  activeRestaurant?: string;
  setActiveRestaurant: (id: string) => void;
  visibleRestaurants: typeof RESTAURANTS;
  selectDisabled: boolean;
  grayedOutIds: Set<string>;
}) {
  return (
    <div className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <svg
            role="img"
            aria-label="Shulman Paper — Filling small orders for big ideas"
            className="h-10 w-auto"
            viewBox="0 0 640 120"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="spg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopOpacity="1" />
                <stop offset="1" stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect fill="transparent" width="640" height="120" />
            <text x="0" y="50" fontFamily="Inter, Arial, sans-serif" fontSize="30" fontWeight="700" fill="currentColor">
              SHULMAN PAPER
            </text>
            <text x="0" y="80" fontFamily="Inter, Arial, sans-serif" fontSize="14" fill="#64748b">
              Filling small orders for big ideas • www.shulmanpaper.com
            </text>
          </svg>
        </div>

        {/* Right: Auth + Restaurant selector */}
        <div className="flex items-center gap-3">
          {loggedIn && (
            <div className="hidden md:flex items-center gap-2">
              <Label className="text-xs">Restaurant</Label>
              <Select value={activeRestaurant} onValueChange={setActiveRestaurant} disabled={selectDisabled}>
                <SelectTrigger className="w-64 rounded-2xl">
                  <SelectValue placeholder="Select restaurant" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {visibleRestaurants.map((r) => (
                    <SelectItem
                      key={r.id}
                      value={r.id}
                      disabled={grayedOutIds.has(r.id)}
                      className={grayedOutIds.has(r.id) ? "opacity-50 pointer-events-none" : ""}
                    >
                      {r.name} • {r.brand}
                      {r.address ? " — " + r.address : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!loggedIn ? (
            <Button onClick={onLogin} className="rounded-2xl">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />} {" "}
              Sign in
            </Button>
          ) : (
            <Button variant="outline" onClick={onLogout} className="rounded-2xl">
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================
// Auth
// =============================
function AuthGate({ onLogin, loading }: { onLogin: () => void; loading: boolean }) {
  return (
    <div className="mx-auto max-w-lg mt-16">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Welcome back
          </CardTitle>
          <CardDescription>
            Sign in to access your restaurant’s products, pricing, and order history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="you@restaurant.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <Button onClick={onLogin} className="rounded-2xl">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />} {" "}
              Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================
// Order Toolbar
// =============================
function OrderToolbar({
  query,
  setQuery,
  activeCat,
  setActiveCat,
}: {
  query: string;
  setQuery: (v: string) => void;
  activeCat: string;
  setActiveCat: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className="pl-9 w-72 rounded-2xl"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCat === cat.id ? "default" : "outline"}
            onClick={() => setActiveCat(cat.id)}
            className="rounded-2xl"
          >
            <cat.icon className="h-4 w-4 mr-2" />
            {cat.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

// =============================
// Product Card
// =============================
function ProductCard({
  product,
  onConfigure,
}: {
  product: (typeof PRODUCTS)[number];
  onConfigure: () => void;
}) {
  return (
    <Card className="rounded-2xl hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-base">{product.name}</CardTitle>
        <CardDescription>
          SKU {product.qbSku} • From {currency(product.basePrice)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">Fast reorder • Proofing</div>
          <Button size="sm" className="rounded-2xl" onClick={onConfigure}>
            <Plus className="h-4 w-4 mr-2" /> Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================
// Configurator (Dialog)
// =============================
function Configurator({
  product,
  onClose,
  onAddToCart,
}: {
  product: (typeof PRODUCTS)[number];
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}) {
  const [size, setSize] = useState(product.options.sizes[0]);
  const [stock, setStock] = useState(product.options.stocks[0]);
  const [finish, setFinish] = useState(product.options.finishes[0]);
  const [qty, setQty] = useState(100);
  const [doubleSided, setDoubleSided] = useState(false);
  const [rush, setRush] = useState(false);
  const [notes, setNotes] = useState("");

  // Business fields (PO/Cost Center removed per spec)
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [packByStore, setPackByStore] = useState(true);
  const [proofRequired, setProofRequired] = useState(true); // always PDF when required
  const [approverEmail, setApproverEmail] = useState("ops@brand.com");

  const unitPrice = useMemo(
    () => calculateUnitPrice({ basePrice: product.basePrice }, { size, stock, finish, doubleSided }),
    [product.basePrice, size, stock, finish, doubleSided]
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Configure {product.name}</DialogTitle>
          <DialogDescription>Select options, upload artwork, and add to cart.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-3">
            <Label>Size</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {product.options.sizes.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <Label>Stock</Label>
            <Select value={stock} onValueChange={setStock}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {product.options.stocks.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <Label>Finish</Label>
            <Select value={finish} onValueChange={setFinish}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {product.options.finishes.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <Label>Quantity</Label>
            <Input type="number" min={1} step={1} value={qty} onChange={(e) => setQty(Number(e.target.value || 0))} className="rounded-2xl" />
          </div>

          <div className="flex items-center justify-between border rounded-2xl p-3">
            <div>
              <Label className="mb-0">Double‑sided</Label>
              <p className="text-xs text-slate-500">Adds printing on the back</p>
            </div>
            <Switch checked={doubleSided} onCheckedChange={setDoubleSided} />
          </div>
          <div className="flex items-center justify-between border rounded-2xl p-3">
            <div>
              <Label className="mb-0">Rush</Label>
              <p className="text-xs text-slate-500">+15% rush production</p>
            </div>
            <Switch checked={rush} onCheckedChange={setRush} />
          </div>

          <div className="grid gap-3">
            <Label>Delivery Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between border rounded-2xl p-3">
            <div>
              <Label className="mb-0">Pack by Store</Label>
              <p className="text-xs text-slate-500">Split & label by location</p>
            </div>
            <Switch checked={packByStore} onCheckedChange={setPackByStore} />
          </div>

          <div className="flex items-center justify-between border rounded-2xl p-3 sm:col-span-2">
            <div>
              <Label className="mb-0">Proof Required</Label>
              <p className="text-xs text-slate-500">Send to approver before production</p>
            </div>
            <Switch checked={proofRequired} onCheckedChange={setProofRequired} />
          </div>

          {proofRequired && (
            <>
              <div className="grid gap-3">
                <Label>Approver Email</Label>
                <Input placeholder="approvals@brand.com" value={approverEmail} onChange={(e) => setApproverEmail(e.target.value)} className="rounded-2xl" />
              </div>
            </>
          )}

          <div className="sm:col-span-2 grid gap-2">
            <Label>Artwork</Label>
            <div className="rounded-2xl border p-4 grid place-items-center text-sm text-slate-500">
              <Upload className="h-5 w-5 mr-2" /> Drag & drop PDF/AI/PNG here or click to upload
            </div>
          </div>

          <div className="sm:col-span-2 grid gap-2">
            <Label>Production Notes</Label>
            <Textarea
              rows={3}
              placeholder={'Trim 0.125" all sides, score @ 6", pack 100s by store, etc.'}
              className="rounded-2xl"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <Separator className="my-2" />

        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Unit: <span className="font-semibold">{currency(unitPrice)}</span> • Est. Total: <span className="font-semibold">{currency(unitPrice * qty)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="rounded-2xl"
              onClick={() =>
                onAddToCart({
                  productId: product.id,
                  name: product.name,
                  quantity: qty,
                  size,
                  stock,
                  finish,
                  doubleSided,
                  rush,
                  notes,
                  unitPrice,
                  location,
                  packByStore,
                  proofRequired,
                  approverEmail: proofRequired ? approverEmail : undefined,
                  qbSku: (product as any).qbSku,
                })
              }
            >
              <ShoppingCart className="h-4 w-4 mr-2" /> Add to cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================
// Cart Bar
// =============================
function CartBar({
  items,
  subtotal,
  rushFee,
  total,
  onRemove,
}: {
  items: CartItem[];
  subtotal: number;
  rushFee: number;
  total: number;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto max-w-7xl px-4 pb-4">
        <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-2xl border bg-white shadow-md">
          <div className="p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">Cart ({items.length})</div>
              <div className="text-sm">
                Subtotal <span className="font-semibold">{currency(subtotal)}</span>
                {rushFee > 0 && (
                  <span className="ml-3">
                    Rush <span className="font-semibold">{currency(rushFee)}</span>
                  </span>
                )}
                <span className="ml-3">
                  Total <span className="font-semibold">{currency(total)}</span>
                </span>
              </div>
            </div>

            {items.length > 0 && (
              <div className="grid gap-2 max-h-48 overflow-auto pr-1">
                {items.map((c, i) => (
                  <div key={i} className="flex items-center justify-between border rounded-xl p-2">
                    <div className="text-sm leading-tight">
                      <div className="font-medium">{c.name} • {c.size}</div>
                      <div className="text-slate-500">{c.stock} • {c.finish} {c.doubleSided && "• 2‑sided"} {c.rush && "• Rush"}</div>
                      <div className="text-slate-500">SKU {c.qbSku} {c.location && `• ${c.location}`} {c.packByStore && "• Pack by Store"}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold">{c.quantity} × {currency(c.unitPrice)}</div>
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onRemove(i)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" className="rounded-2xl">Save as Quote</Button>
              <Button className="rounded-2xl" onClick={() => (window as any).FM?.call?.("Create Order", { cart: items, totals: { subtotal, rushFee, total } })}>Place Order</Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// =============================
// Order History
// =============================
function OrderHistory() {
  const mock = [
    { id: "INV‑1045", date: "2025‑10‑18", items: 3, total: 412.25, status: "In Production" },
    { id: "INV‑1044", date: "2025‑09‑05", items: 2, total: 180.0, status: "Delivered" },
    { id: "INV‑1038", date: "2025‑07‑22", items: 1, total: 89.0, status: "Delivered" },
  ];
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Order history</CardTitle>
        <CardDescription>Reorder any past job with one click.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {mock.map((row) => (
          <div key={row.id} className="flex items-center justify-between border rounded-xl p-3">
            <div className="text-sm leading-tight">
              <div className="font-medium">{row.id} • {row.date}</div>
              <div className="text-slate-500">{row.items} item(s) • {row.status}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold">{currency(row.total)}</div>
              <Button size="sm" className="rounded-xl">Reorder</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// =============================
// Assets Library
// =============================
function AssetsLibrary() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileStack className="h-5 w-5" /> Brand assets</CardTitle>
        <CardDescription>Upload logos, menu files, and brand guidelines for quick reuse.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["Logo Pack.zip", "Menu_Template.ai", "Brand_Guide.pdf"].map((f) => (
            <div key={f} className="border rounded-xl p-3 flex items-center justify-between text-sm">
              <div className="truncate max-w-[60%]">{f}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-xl">Download</Button>
                <Button size="sm" variant="outline" className="rounded-xl">Replace</Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button className="rounded-2xl"><Upload className="h-4 w-4 mr-2" /> Upload new</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================
// Account Panel
// =============================
function AccountPanel({ restaurant }: { restaurant: string }) {
  const [taxExempt, setTaxExempt] = useState(true);
  const [defaultApprover, setDefaultApprover] = useState("ops@brand.com");
  const [defaultPOPrefix, setDefaultPOPrefix] = useState("AUTO-");
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> {restaurant}</CardTitle>
        <CardDescription>Manage locations, delivery addresses, approvals, and tax settings.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Default Delivery Address</Label>
          <Input placeholder="123 Main St, New York, NY" className="rounded-2xl" />
        </div>
        <div className="grid gap-2">
          <Label>Approver Email</Label>
          <Input value={defaultApprover} onChange={(e) => setDefaultApprover(e.target.value)} className="rounded-2xl" />
        </div>
        <div className="grid gap-2">
          <Label>PO Prefix</Label>
          <Input value={defaultPOPrefix} onChange={(e) => setDefaultPOPrefix(e.target.value)} className="rounded-2xl" />
        </div>
        <div className="flex items-center justify-between border rounded-2xl p-3">
          <div>
            <Label className="mb-0">Tax Exempt</Label>
            <p className="text-xs text-slate-500">Provide certificate on file</p>
          </div>
          <Switch checked={taxExempt} onCheckedChange={setTaxExempt} />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label>Notes</Label>
          <Textarea rows={3} placeholder="Packing, labeling, or PO instructions" className="rounded-2xl" />
        </div>
        <div className="sm:col-span-2 flex items-center justify-end">
          <Button className="rounded-2xl"><Check className="h-4 w-4 mr-2" /> Save changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================
// Dev-Time Test Cases (lightweight)
// These run in the console at load. Never modify user-facing UI.
// =============================
(function devTests() {
  try {
    // 1) Pricing logic tests
    const base = { basePrice: 100 };
    console.assert(
      calculateUnitPrice(base, { size: "8.5×11", stock: "80# Uncoated", finish: "No Laminate", doubleSided: false }) === 100,
      "Unit price should equal base without adders"
    );
    console.assert(
      calculateUnitPrice(base, { size: "24×36", stock: "100# Silk Cover", finish: "Matte Laminate", doubleSided: true }) ===
        100 + 12 + 8 + 10 + 6,
      "Unit price should include size, stock, finish, and 2-sided adders"
    );

    // 2) Product catalog sanity
    console.assert(PRODUCTS.length >= 6, "Expect at least 6 products defined");
    const hasMenus = PRODUCTS.some((p) => p.category === "menus");
    console.assert(hasMenus, "Expect a menus category present");

    // 3) Category filter behavior (pure predicate check)
    const filteredNames = PRODUCTS.filter((p) => p.category === "menus").map((p) => p.name);
    console.assert(filteredNames.length >= 2, "Expect multiple menu items");

    // 4) Rush fee calculation sample
    const cartSample = [
      {
        productId: "x",
        name: "A",
        quantity: 2,
        size: "8.5×11",
        stock: "80#",
        finish: "No Laminate",
        doubleSided: false,
        rush: true,
        unitPrice: 10,
        packByStore: false,
        proofRequired: false,
      },
    ];
    const sub = (cartSample as any[]).reduce((a, c: any) => a + c.unitPrice * c.quantity, 0);
    const rush = (cartSample as any[]).some((c: any) => c.rush) ? sub * 0.15 : 0;
    console.assert(rush === 3, "Rush fee should be 15% of subtotal (3)");

    // 5) Permission tests (data-driven)
    const allSet = computeAllowedSet("admin");
    const everyIncluded = RESTAURANTS.every((r) => allSet.has(r.id));
    console.assert(everyIncluded, "Admin should allow all restaurants");

    const oneSet = computeAllowedSet("end_user", [RESTAURANTS[0].id]);
    console.assert(oneSet.size === 1 && oneSet.has(RESTAURANTS[0].id), "End user should be limited to assigned restaurant");

    // 6) Header content sanity (no duplicate address)
    const dupAddressCheck = !RESTAURANTS.some((r) => (r.address || "").includes(" —  "));
    console.assert(dupAddressCheck, "Restaurant address should render only once");

    // 7) Banners grommet options present
    const banner = PRODUCTS.find(p => p.id === "banner-1")!;
    console.assert(
      FINISH_PRESETS.banners.length === 4 && FINISH_PRESETS.banners.includes("Every 12\"") && FINISH_PRESETS.banners.includes("Every 6\""),
      "Banner grommet presets should match spec"
    );

    // 8) Menus finish locked to None
    const menuFinishOk = FINISH_PRESETS.menus.length === 1 && FINISH_PRESETS.menus[0] === "None";
    console.assert(menuFinishOk, "Menus should have only 'None' finish option");
  } catch (e) {
    console.error("Dev tests encountered an error:", e);
  }
})();
