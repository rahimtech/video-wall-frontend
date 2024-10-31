import React from "react";
import SwitchCustom from "./SwitchCustom";

const HeaderBar = ({ darkMode, setDarkMode, connecting }) => {
  return (
    <>
      <div
        id="setting"
        className={` ${
          darkMode ? "text-white" : "text-black"
        } flex items-center z-[100] absolute left-0 p-[10px]`}
      >
        {/* <Setting /> */}
        <SwitchCustom setDarkMode={setDarkMode} darkMode={darkMode} />
      </div>

      <div
        className={` ${
          darkMode ? "text-white" : "text-black"
        } flex items-center z-[100] absolute right-0 p-[10px]`}
      >
        <div className="mr-2">وضعیت اتصال</div>
        {connecting ? <div className="blob"></div> : <div className="blobred"></div>}
      </div>
    </>
  );
};

export default HeaderBar;
