import React from "react";
import { FaThLarge } from "react-icons/fa";
import SwitchCustom from "./SwitchCustom";
import { Button } from "@nextui-org/react";

const HeaderBar = ({ darkMode, setDarkMode, connecting, toggleLayout, isToggleLayout }) => {
  return (
    <>
      <div
        id="setting"
        className={` ${isToggleLayout ? "" : ""} ${
          darkMode ? "text-white" : "text-black"
        } flex items-center z-[100] absolute left-0 p-[10px]`}
      >
        {/* <Setting /> */}
        <SwitchCustom setDarkMode={setDarkMode} darkMode={darkMode} />
        <Button
          className={`${darkMode ? "dark" : "light"} ${
            isToggleLayout ? "bg-blue-500 " : ""
          } min-w-[35px] h-[33px] rounded-lg  p-1`}
          size="lg"
          variant="solid"
          color="default"
          onClick={toggleLayout}
        >
          <FaThLarge /> {/* Icon for layout toggle */}
        </Button>
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
