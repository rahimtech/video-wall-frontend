import { Button, Input, CircularProgress } from "@nextui-org/react";
import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorHandle, setErrorHandle] = useState(false);
  const [mode, setMode] = useState("login");
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(`${config.url}/login`, {
        username,
        password,
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem("role", response.data.nameRole);
      localStorage.setItem("id", response.data.id);
      localStorage.setItem("city", response.data.userCity);
      window.location.reload();
    } catch (error) {
      if (!error.response) {
        Swal.fire({
          title: "!خطا",
          text: "خطا در اتصال به اینترنت",
          icon: "error",
          confirmButtonText: "فهمیدم",
        });
      } else {
        Swal.fire({
          title: "!خطا",
          text: "نام کاربری یا رمز عبور اشتباه است",
          icon: "error",
          confirmButtonText: "فهمیدم",
        });
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex justify-between min-h-screen max-sm:flex-wrap">
      {loading && (
        <div className="w-full z-50 absolute backdrop-blur-lg min-h-screen flex items-center justify-center">
          <CircularProgress aria-label="Loading..." />
        </div>
      )}
      <div
        id="left"
        className="w-full text-4xl bg-gradient-to-r from-blue-500 to-blue-600 text-white gap-6 flex flex-col justify-center items-center vazirblack"
      >
        <div>
          <img src="/logo512.png" className="w-[200px]" />
        </div>
        <div>خوش‌ آمدید</div>
      </div>
      {mode == "login" ? (
        <>
          <div id="right" className="w-full bg-gray-200 flex flex-col justify-center items-center">
            <form dir="rtl" onSubmit={handleLogin}>
              <div className="w-[300px] flex flex-col gap-5 rtl">
                <div className="vazirblack text-blue-600 text-2xl">ورود به داشبورد</div>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  size="md"
                  label="نام کاربری"
                />
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  size="md"
                  label="رمز عبور"
                />
                <Button type="submit" variant="solid" color="primary">
                  ورود
                </Button>
                <div className="text-center">
                  <a
                    onClick={() => setMode("resetpass")}
                    className=" text-blue-600 text-sm cursor-pointer"
                  >
                    فراموشی رمز عبور
                  </a>
                  <span> / </span>
                  <a
                    onClick={() => setMode("register")}
                    className=" text-blue-600 text-sm cursor-pointer"
                  >
                    ثبت ‌نام
                  </a>
                </div>
              </div>
            </form>
          </div>
        </>
      ) : mode == "register" ? (
        <>
          <div id="right" className="w-full bg-gray-200 flex flex-col justify-center items-center">
            <form dir="rtl" onSubmit={handleLogin}>
              <div className="w-[300px] flex flex-col gap-5 rtl">
                <div className="vazirblack text-blue-600 text-2xl">ثبت نام</div>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  size="md"
                  label="نام کاربری"
                />
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  size="md"
                  label="رمز عبور"
                />
                <Input
                  onChange={(e) => {
                    console.log("password::: ", password);
                    console.log("e.target.value::: ", e.target.value);
                    if (e.target.value != password) {
                      setErrorHandle(true);
                    } else {
                      setErrorHandle(false);
                    }
                  }}
                  isInvalid={errorHandle}
                  errorMessage="با رمز عبور اصلی تفاوت دارد"
                  type="password"
                  size="md"
                  label="تکرار رمز"
                />
                <Button type="submit" variant="solid" color="primary">
                  ثبت نام
                </Button>
                <div className="text-center">
                  <a
                    onClick={() => setMode("resetpass")}
                    className=" text-blue-600 text-sm cursor-pointer"
                  >
                    فراموشی رمز عبور
                  </a>
                  <span> / </span>
                  <a
                    onClick={() => setMode("login")}
                    className=" text-blue-600 text-sm cursor-pointer"
                  >
                    ورود
                  </a>
                </div>
              </div>
            </form>
          </div>
        </>
      ) : mode == "resetpass" ? (
        <>
          <div id="right" className="w-full bg-gray-200 flex flex-col justify-center items-center">
            <form dir="rtl" onSubmit={handleLogin}>
              <div className="w-[300px] flex flex-col gap-5 rtl">
                <div className="vazirblack text-blue-600 text-2xl">فراموشی رمز</div>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  size="md"
                  label="نام کاربری"
                />

                <Button type="submit" variant="solid" color="primary">
                  ارسال کد
                </Button>
                <div className="text-center">
                  <a
                    onClick={() => setMode("login")}
                    className=" text-blue-600 text-sm cursor-pointer"
                  >
                    ورود
                  </a>
                  <span> / </span>
                  <a
                    onClick={() => setMode("register")}
                    className=" text-blue-600 text-sm cursor-pointer"
                  >
                    ثبت ‌نام
                  </a>
                </div>
              </div>
            </form>
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
