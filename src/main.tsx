import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // oder ./App.css je nachdem was du hast

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
