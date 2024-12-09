import React from "react";
import { FaDownload, FaThLarge } from "react-icons/fa";
import SwitchCustom from "./SwitchCustom";
import { Button, Tooltip } from "@nextui-org/react";
import { RiLayout4Fill } from "react-icons/ri";

const HeaderBar = ({
  darkMode,
  setDarkMode,
  connecting,
  toggleLayout,
  isToggleLayout,
  setVideoWalls,
  setInputs,
  addMonitorsToScenes,
  setCollections,
  addResource,
}) => {
  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        if (file.type !== "application/json") {
          alert("لطفاً فقط فایل JSON بارگذاری کنید.");
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = JSON.parse(e.target.result);
            setVideoWalls(jsonData.displays);
            setCollections(jsonData.collections);
            addMonitorsToScenes(jsonData.displays);
            setInputs(jsonData.inputs);
          } catch (error) {
            alert("خطا در خواندن فایل JSON. لطفاً یک فایل معتبر انتخاب کنید.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <>
      <div
        id="setting"
        className={` ${isToggleLayout ? "" : ""} ${
          darkMode ? "text-white" : "text-black"
        } flex items-center z-[100] absolute left-0 p-[10px]`}
      >
        <SwitchCustom setDarkMode={setDarkMode} darkMode={darkMode} />
        <div className="flex gap-2">
          <Tooltip content="وارد کردن پروژه">
            <Button
              className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color="default"
              onClick={handleFileUpload}
            >
              <FaDownload />
            </Button>
          </Tooltip>
          <Tooltip content="تغییر چیدمان">
            <Button
              className={`${darkMode ? "dark" : "light"} ${
                isToggleLayout ? "bg-blue-500 " : ""
              } min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color="default"
              onClick={toggleLayout}
            >
              <RiLayout4Fill />
            </Button>
          </Tooltip>
          <Tooltip content="ویدیو وال">
            <Button
              className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color="default"
            >
              <FaThLarge />
            </Button>
          </Tooltip>
        </div>
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
