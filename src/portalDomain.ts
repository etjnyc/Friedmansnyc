export type PortalUser = {
  id: string;
  name: string;
  role: "admin" | "end_user";
  defaultRestaurantId?: string;
  allowedRestaurantIds?: string[];
};

export type Restaurant = {
  id: string;
  name: string;
  brand: string;
  address: string;
};

export type ProductionMode = "digital" | "wide" | "other";

export type Product = {
  id: string;
  name: string;
  category: string;
  qbSku: string;
  sizes: string[];
  stocks: string[];
  finishes: string[];
  recipe: {
    mode: ProductionMode;
    machine: string;
    upsBySize?: Record<string, number>;
    wastePct?: number;
    clicksPerMinute?: number;
    setupMinutes: number;
    squareFeetPerMinute?: number;
    finishingMinutesPer100?: number;
  };
};

export type ProductionEstimate = {
  machine: string;
  estimatedSheets?: number;
  estimatedClicks?: number;
  estimatedSquareFeet?: number;
  estimatedMachineMinutes: number;
  estimatedFinishingMinutes: number;
};

export type CartItem = {
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
};

export type SubmittedOrder = {
  orderId: string;
  createdAt: string;
  status: string;
  items: CartItem[];
};

export const RESTAURANTS: Restaurant[] = [
  { id: "suram-31-serano", name: "Suram 31 (Serano)", brand: "Suram", address: "132 W 31st St, New York, NY 10001" },
  { id: "suram-31", name: "Suram 31", brand: "Suram", address: "132 W 31st St, New York, NY 10001" },
  { id: "suram-61", name: "Suram 61", brand: "Suram", address: "21 West End Ave, New York, NY 10023" },
  { id: "wu-nussbaum", name: "Wu & Nussbaum", brand: "Wu & Nussbaum", address: "2897 Broadway, New York, NY 10025" },
  { id: "picka-vesey", name: "Pick-a-Bagel Vesey", brand: "Pick-a-Bagel", address: "251 Vesey St, New York, NY 10282" },
  { id: "picka-37-west-end", name: "Pick-a-Bagel 37 West End", brand: "Pick-a-Bagel", address: "New York, NY" },
  { id: "pq-uws", name: "Pastrami Queen – Upper West Side", brand: "Pastrami Queen", address: "138 W 72nd St, New York, NY" },
  { id: "kossars-72", name: "Kossar’s West End 72nd", brand: "Kossar’s", address: "260 W 72nd St, New York, NY 10023" },
];

export const PRODUCTS: Product[] = [
  {
    id: "menu-dine",
    name: "Dine-In Menu",
    category: "Menus",
    qbSku: "MENU-DINE",
    sizes: ["8.5×11", "8.5×14", "11×17"],
    stocks: ["White Card Stock", "Cream Card Stock", "Synthetic 12 mil", "Flyer Paper"],
    finishes: ["None"],
    recipe: {
      mode: "digital",
      machine: "Canon imagePRESS V1000",
      upsBySize: { "8.5×11": 2, "8.5×14": 1, "11×17": 1 },
      wastePct: 0.03,
      clicksPerMinute: 80,
      setupMinutes: 8,
    },
  },
  {
    id: "menu-togo",
    name: "Takeout Menu",
    category: "Menus",
    qbSku: "MENU-TOGO",
    sizes: ["8.5×11", "8.5×14"],
    stocks: ["White Card Stock", "Cream Card Stock", "Synthetic 12 mil", "Flyer Paper"],
    finishes: ["None", "Score & Fold"],
    recipe: {
      mode: "digital",
      machine: "Canon imagePRESS V1000",
      upsBySize: { "8.5×11": 2, "8.5×14": 1 },
      wastePct: 0.03,
      clicksPerMinute: 80,
      setupMinutes: 8,
      finishingMinutesPer100: 3,
    },
  },
  {
    id: "flyer-standard",
    name: "Promo Flyers",
    category: "Flyers",
    qbSku: "FLYER-STD",
    sizes: ["4×6", "5×7", "8.5×11"],
    stocks: ["100# Gloss Cover", "100# Silk Cover", "80# Uncoated"],
    finishes: ["No Coat", "AQ Coat", "UV Gloss"],
    recipe: {
      mode: "digital",
      machine: "Canon imagePRESS V1000",
      upsBySize: { "4×6": 8, "5×7": 4, "8.5×11": 2 },
      wastePct: 0.03,
      clicksPerMinute: 80,
      setupMinutes: 8,
      finishingMinutesPer100: 2,
    },
  },
  {
    id: "poster-large",
    name: "Large Poster",
    category: "Posters",
    qbSku: "POSTER-LG",
    sizes: ["12×18", "18×24", "24×36"],
    stocks: ["Photo Paper", "Mounted to 3/16” white foam core", "Printed direct on 3mm PVC Plastic"],
    finishes: ["No Laminate", "Matte Laminate", "Gloss Laminate"],
    recipe: {
      mode: "wide",
      machine: "HP DesignJet Z5400",
      setupMinutes: 10,
      squareFeetPerMinute: 2.5,
      finishingMinutesPer100: 12,
    },
  },
  {
    id: "banner-vinyl",
    name: "Vinyl Banner",
    category: "Banners",
    qbSku: "BANNER-VNYL",
    sizes: ["24×48", "36×72", "48×96"],
    stocks: ["13oz Vinyl", "18oz Heavy Vinyl"],
    finishes: ["Top corners", "All Corners", "Every 12\"", "Every 6\""],
    recipe: {
      mode: "wide",
      machine: "HP DesignJet Z5400",
      setupMinutes: 10,
      squareFeetPerMinute: 2.2,
      finishingMinutesPer100: 15,
    },
  },
  {
    id: "label-roll",
    name: "Product Labels",
    category: "Labels",
    qbSku: "LABEL-ROLL",
    sizes: ["2×2", "3×3", "3×5", "4×6"],
    stocks: ["Paper Permanent", "Poly Waterproof", "Kraft"],
    finishes: ["Matte", "Gloss"],
    recipe: {
      mode: "other",
      machine: "Label workflow / assign at preflight",
      setupMinutes: 10,
      finishingMinutesPer100: 2,
    },
  },
  {
    id: "tent-standard",
    name: "Table Tents",
    category: "Other",
    qbSku: "TENT-STD",
    sizes: ["4×6 (flat 4×12)", "5×7 (flat 5×14)"],
    stocks: ["120# Cover Uncoated", "14pt C2S", "16pt C2S"],
    finishes: ["Score & Fold", "Score Only"],
    recipe: {
      mode: "digital",
      machine: "Canon imagePRESS V1000",
      upsBySize: { "4×6 (flat 4×12)": 2, "5×7 (flat 5×14)": 1 },
      wastePct: 0.04,
      clicksPerMinute: 70,
      setupMinutes: 10,
      finishingMinutesPer100: 5,
    },
  },
];

export const STATUS_STYLES: Record<string, string> = {
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

export function estimateProduction(product: Product, qty: number, size: string, doubleSided: boolean): ProductionEstimate {
  const safeQty = Math.max(1, qty || 1);
  const recipe = product.recipe;
  const finishingMinutes = Math.ceil(((recipe.finishingMinutesPer100 || 0) * safeQty) / 100);

  if (recipe.mode === "digital") {
    const ups = Math.max(1, recipe.upsBySize?.[size] || 1);
    const sheets = Math.ceil((safeQty / ups) * (1 + (recipe.wastePct || 0)));
    const clicks = sheets * (doubleSided ? 2 : 1);
    return {
      machine: recipe.machine,
      estimatedSheets: sheets,
      estimatedClicks: clicks,
      estimatedMachineMinutes: Math.ceil(recipe.setupMinutes + clicks / Math.max(1, recipe.clicksPerMinute || 60)),
      estimatedFinishingMinutes: finishingMinutes,
    };
  }

  if (recipe.mode === "wide") {
    const dimensions = parseDimensions(size);
    const squareFeet = dimensions ? (dimensions.width * dimensions.height * safeQty) / 144 : 0;
    return {
      machine: recipe.machine,
      estimatedSquareFeet: Math.round(squareFeet * 10) / 10,
      estimatedMachineMinutes: Math.ceil(recipe.setupMinutes + squareFeet / Math.max(0.1, recipe.squareFeetPerMinute || 1)),
      estimatedFinishingMinutes: finishingMinutes,
    };
  }

  return {
    machine: recipe.machine,
    estimatedMachineMinutes: recipe.setupMinutes,
    estimatedFinishingMinutes: finishingMinutes,
  };
}

export function initialStatus(item: CartItem) {
  if (item.artworkMode === "replacement" && !item.artworkFileName) return "Awaiting Artwork";
  if (item.proofRequired) return "Awaiting Proof";
  return "Ready to Print";
}

export function makeOrderId() {
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

export function buildProductionJobs(cart: CartItem[], orderId: string, createdAt: string, user: PortalUser, restaurant: Restaurant) {
  return cart.map((item, index) => ({
    source: "Friedmans Portal",
    source_system: "friedmans_portal",
    source_order_id: orderId,
    job_id: `${orderId}-${String(index + 1).padStart(2, "0")}`,
    customer: restaurant.brand,
    restaurant: restaurant.name,
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
}
