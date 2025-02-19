import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./style/input.css";
import { MyContextProvider } from "./context/MyContext";
import config from "../public/config.json";

const root = ReactDOM.createRoot(document.getElementById("root"));

const Login = ({ setCheckLogin }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    const username = event.target.username.value;
    const password = event.target.password.value;

    const validUsername = config.username;
    const validPassword = config.password;

    if (username === validUsername && password === validPassword) {
      localStorage.setItem("isLoggedIn", "true");
      setCheckLogin(true);
    } else {
      alert("یوزرنیم یا پسوورد اشتباه است!");
    }
  };

  return (
    <div dir="rtl" className="flex flex-col justify-center items-center h-screen bg-slate-200">
      <div className="max-w-md mx-auto relative overflow-hidden z-10 bg-white p-8 rounded-lg shadow-md before:w-24 before:h-24 before:absolute before:bg-purple-500 before:rounded-full before:-z-10 before:blur-2xl after:w-32 after:h-32 after:absolute after:bg-sky-400 after:rounded-full after:-z-10 after:blur-xl after:top-24 after:-right-12">
        <h2 className="text-2xl text-sky-900 font-bold mb-6">ورود به نرم‌افزار</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600" htmlFor="name">
              یوزرنیم
            </label>
            <input
              dir="ltr"
              name="username"
              className="mt-1 p-2 w-full border rounded-md"
              type="text"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600" htmlFor="password">
              پسوورد
            </label>
            <input
              dir="ltr"
              className="mt-1 p-2 w-full border rounded-md"
              name="password"
              id="password"
              type="password"
              required
            />
          </div>
          <div className="flex justify-end mt-28">
            <button
              className="[background:linear-gradient(144deg,#af40ff,#5b42f3_50%,#00ddeb)] text-white w-full px-4 py-2 font-bold rounded-md hover:opacity-80"
              type="submit"
            >
              ورود
            </button>
          </div>
        </form>
      </div>
      <div className="text-slate-400 text-xs mt-3">تولید شده توسط شرکت مبنا رایانه کیان</div>
      <div className="text-slate-400 text-xs mt-3"> www.mrk.co.ir</div>
    </div>
  );
};

const Main = () => {
  const [checkLogin, setCheckLogin] = useState(false);

  // بررسی localStorage برای وضعیت ورود
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
      setCheckLogin(true);
    }
  }, []);

  return (
    <MyContextProvider>
      {checkLogin ? <App /> : <Login setCheckLogin={setCheckLogin} />}
    </MyContextProvider>
  );
};

root.render(<Main />);
