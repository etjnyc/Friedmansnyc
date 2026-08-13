import React from "react";
import ReactDOM from "react-dom/client";
import ShulmanRestaurantPortalV3 from "./ShulmanRestaurantPortalV3";
import "./index.css";

// Standalone live-test mode: the restaurant portal is intentionally NOT connected
// to the Shulman master production board yet. Production-board transport will be
// enabled only after the portal design and ordering workflow are approved.

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ShulmanRestaurantPortalV3 />
  </React.StrictMode>
);