import React from "react";
import ReactDOM from "react-dom/client";
import ShulmanRestaurantPortalV3 from "./ShulmanRestaurantPortalV3";
import "./index.css";

// Standalone live-test mode: the restaurant portal is intentionally NOT connected
// to the Shulman master production board yet. Production-board transport will be
// enabled only after the portal design and ordering workflow are approved.
//
// During this design-test phase we also bypass restaurant authentication so the
// Shulman tester can switch among all restaurant profiles without depending on
// Netlify environment variables. Real restaurant credentials remain a later phase.
if (typeof window !== "undefined") {
  const userKey = "friedmans_portal_user";
  const tokenKey = "friedmans_portal_session_token";
  if (!window.sessionStorage.getItem(userKey)) {
    window.sessionStorage.setItem(userKey, JSON.stringify({
      id: "portal:standalone-test",
      name: "Shulman Portal Tester",
      role: "admin",
    }));
  }
  if (!window.sessionStorage.getItem(tokenKey)) {
    window.sessionStorage.setItem(tokenKey, "standalone-design-test");
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ShulmanRestaurantPortalV3 />
  </React.StrictMode>
);