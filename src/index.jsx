import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./input.css";
import { MyContextProvider } from "./context/MyContext";
import Test from "./Test.jsx";
import App3 from "./v1/App.jsx";
import VideoWallController from "./VideoWallController.jsx";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <MyContextProvider>
    <App />
  </MyContextProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
