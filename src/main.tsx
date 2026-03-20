import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import App from "./App";
import { SiteDataProvider } from "./context/SiteDataContext";
import "./styles.css";

gsap.registerPlugin(ScrollTrigger);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <SiteDataProvider>
        <App />
      </SiteDataProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
