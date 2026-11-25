import React from "react";
import { createRoot } from "react-dom/client";
import { ImportWorkbench } from "./app/ImportWorkbench";
import "./style.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ImportWorkbench />
  </React.StrictMode>,
);
