import React from "react";
import { FaDownload, FaThLarge, FaUpload } from "react-icons/fa";
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
  setScenes,
  collections,
  scenes,
  inputs,
  videoWalls,
  sources,
}) => {
  const handleExportProject = () => {
    const data = {
      collections: collections,
      scenes: scenes.map((scene) => ({
        id: scene.id,
        name: scene.name,
        resources: scene.resources.map((r) => {
          return {
            id: r.id,
            type: r.type,
            content: r.content,
            name: r.name || "resource",
            x: r.x || 0,
            y: r.y || 0,
            z: r.z || 0,
            rotation: r.rotation || 0,
            width: r.width || 400,
            height: r.height || 250,
            created_at: r.created_at || new Date().toISOString(),
          };
        }),
        // stageData: scene.stageData || null,
        // layer: scene.layer || null,
      })),
      sources: sources.map((r) => {
        return {
          id: r.id,
          type: r.deviceId ? "input" : r.type,
          content: r.deviceId ?? r.content,
          name: r.name || "resource",
          x: r.x || 0,
          y: r.y || 0,
          z: r.z || 0,
          rotation: r.rotation || 0,
          width: r.width || 400,
          height: r.height || 250,
          created_at: r.created_at || new Date().toISOString(),
        };
      }),
      inputs: inputs.map((input) => ({
        id: input.id || Math.floor(Math.random() * 1000000000),
        key: input.key || 0,
        deviceId: input.deviceId || "",
        width: input.width || 1920,
        height: input.height || 1080,
        name: input.name || "Input",
        type: input.type || "HDMI",
        created_at: input.created_at || new Date().toISOString(),
      })),
      displays: videoWalls.map((display, idx) => ({
        id: display.id || Math.floor(Math.random() * 1000000000),
        key: display.key || idx,
        x: display.x || 0,
        y: display.y || 0,
        width: display.width || 1920,
        height: display.height || 1080,
        scaleFactor: display.scaleFactor || 1,
        dpi: display.dpi || null,
        refreshRate: display.refreshRate || 60,
        internal: display.internal || false,
        name: display.name || `Display-${idx + 1}`,
        rotation: display.rotation || 0,
        created_at: display.created_at || new Date().toISOString(),
      })),
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
    const formattedDate = now.toISOString().replace(/:/g, "-");
    a.download = `project-${formattedDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            console.log("jsonData.displays::: ", jsonData.displays);
            setVideoWalls(jsonData.displays);
            addMonitorsToScenes(jsonData.displays);
            setCollections(jsonData.collections);
            setScenes(jsonData.scenes);
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
          <Tooltip content="خروجی گرفتن از پروژه">
            <Button
              className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color="default"
              onClick={handleExportProject}
            >
              <FaUpload />
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
