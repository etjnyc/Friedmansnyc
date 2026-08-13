import React from "react";
import ReactDOM from "react-dom/client";
import ShulmanRestaurantPortalV2 from "./ShulmanRestaurantPortalV2";
import { installProductionBoardTransport } from "./productionBoardTransport";
import "./index.css";

installProductionBoardTransport();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ShulmanRestaurantPortalV2 />
  </React.StrictMode>
);
