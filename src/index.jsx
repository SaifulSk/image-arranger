import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import ImageArranger from "./ImageArranger";

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ImageArranger />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);

