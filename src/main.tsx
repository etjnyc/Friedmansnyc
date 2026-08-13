import React from "react";
import ReactDOM from "react-dom/client";
import ShulmanRestaurantPortalV3 from "./ShulmanRestaurantPortalV3";
import { installProductionBoardTransport } from "./productionBoardTransport";
import "./index.css";

installProductionBoardTransport();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ShulmanRestaurantPortalV3 />
  </React.StrictMode>
);