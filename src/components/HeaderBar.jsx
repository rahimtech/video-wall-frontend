import React from "react";
import Setting from "./OLD/Setting";
import SwitchCustom from "./SwitchCustom";

const HeaderBar = ({ darkMode, setDarkMode, connecting }) => {
  return (
    <div
      className={` ${
        darkMode ? " text-white" : " text-black"
      } w-full  px-3 py-2  flex items-center justify-between h-fit z-10`}
    >
      <div id="setting" className="flex items-center">
        {/* <Setting /> */}
        <SwitchCustom setDarkMode={setDarkMode} darkMode={darkMode} />
      </div>

      <div className="flex items-center relative">
        <div className="mr-2">وضعیت اتصال</div>
        {connecting ? <div className="blob"></div> : <div className="blobred"></div>}
      </div>
    </div>
  );
};

export default HeaderBar;
