import React from "react";
import { FaDownload, FaUpload, FaWifi } from "react-icons/fa";
import SwitchCustom from "./SwitchCustom";
import { Button, Tooltip } from "@nextui-org/react";
import { RiLayout4Fill } from "react-icons/ri";
import { TbFreezeRow, TbLayoutSidebarLeftCollapse } from "react-icons/tb";
import { TbLayoutOff } from "react-icons/tb";
import { TbLayout } from "react-icons/tb";
import ModalVideoWall from "./videowall/ModalVideoWall";
import Swal from "sweetalert2";
import { MdDownload, MdRefresh, MdUpload } from "react-icons/md";

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
  connectionMode,
  setConnectionMode,
  isToggleVideoWall,
  setIsToggleVideoWall,
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
    // const formattedDate = now.toISOString().replace(/:/g, "-");
    a.download = `project.json`;
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
            setVideoWalls(jsonData.displays);
            addMonitorsToScenes(jsonData.displays);
            setCollections(jsonData.collections);
            setScenes((prevScenes) =>
              prevScenes.map((scene) => {
                const updatedScene = jsonData.scenes.find((s) => s.id === scene.id);
                if (updatedScene) {
                  return { ...scene, resources: updatedScene.resources };
                }
                return scene;
              })
            );
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
        <div className="flex gap-2 ml-2">
          <Tooltip content={"رفرش کردن صفحه"}>
            <Button
              className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color={"default"}
              onPress={() => {
                Swal.fire({
                  title: "صفحه رفرش شود؟",
                  showDenyButton: true,
                  showCancelButton: false,
                  confirmButtonText: "بله",
                  denyButtonText: `خیر`,
                  confirmButtonColor: "green",
                  denyButtonColor: "gray",
                }).then((result) => {
                  if (result.isConfirmed) location.reload();
                });
              }}
            >
              <MdRefresh size={20} />
            </Button>
          </Tooltip>

          <Tooltip content="وارد کردن فایل">
            <Button
              className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color="default"
              onPress={handleFileUpload}
            >
              <MdDownload size={20} />
            </Button>
          </Tooltip>
          <Tooltip content="خروجی گرفتن از ویدیووال">
            <Button
              className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color="default"
              onPress={handleExportProject}
            >
              <MdUpload size={20} />
            </Button>
          </Tooltip>
          <Tooltip content="تغییر ظاهر">
            <Button
              className={`${darkMode ? "dark" : "light"} ${
                isToggleLayout ? "bg-blue-500 " : ""
              } min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color="default"
              onPress={toggleLayout}
            >
              <TbLayoutSidebarLeftCollapse size={25} />
            </Button>
          </Tooltip>

          <ModalVideoWall darkMode={darkMode} videoWall={videoWalls} />

          <Tooltip content={connectionMode ? "حالت آنلاین فعال است" : "حالت آفلاین فعال است"}>
            <Button
              className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color={connectionMode ? "success" : "warning"}
              onPress={() => {
                Swal.fire({
                  title: connectionMode ? "حالت آفلاین فعال شود؟" : "حالت آنلاین فعال شود؟",
                  showDenyButton: true,
                  showCancelButton: false,
                  confirmButtonText: "بله",
                  denyButtonText: `خیر`,
                  confirmButtonColor: "green",
                  denyButtonColor: "gray",
                }).then((result) => {
                  if (result.isConfirmed) setConnectionMode(!connectionMode);
                });
              }}
            >
              <FaWifi size={20} />
            </Button>
          </Tooltip>

          <Tooltip
            content={
              isToggleVideoWall ? "حالت تغییر چیدمان فعال است" : "حالت تغییر چیدمان غیرفعال است"
            }
          >
            {isToggleVideoWall ? (
              <Button
                className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
                size="lg"
                variant="solid"
                color={"default"}
                onPress={() => {
                  Swal.fire({
                    title: "چیدمان مانیتورها فریز شود؟",
                    showDenyButton: true,
                    showCancelButton: false,
                    confirmButtonText: "بله",
                    denyButtonText: `خیر`,
                    confirmButtonColor: "green",
                    denyButtonColor: "gray",
                  }).then((result) => {
                    if (result.isConfirmed) setIsToggleVideoWall(false);
                  });
                }}
              >
                <TbLayout size={20} />
              </Button>
            ) : (
              <Button
                className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
                size="lg"
                variant="solid"
                color={"default"}
                onPress={() => {
                  Swal.fire({
                    title: "فعال کردن حالت تغییر چیدمان؟",
                    showDenyButton: true,
                    showCancelButton: false,
                    confirmButtonText: "بله",
                    denyButtonText: `خیر`,
                    confirmButtonColor: "green",
                    denyButtonColor: "gray",
                  }).then((result) => {
                    if (result.isConfirmed) {
                      if (!videoWalls.length > 0) {
                        Swal.fire({
                          title: "!مانیتوری وجود ندارد",
                          icon: "warning",
                          confirmButtonText: "باشه",
                          confirmButtonColor: "gray",
                        });
                        return;
                      } else {
                        setIsToggleVideoWall(true);
                      }
                    }
                  });
                }}
              >
                <TbLayoutOff size={20} />
              </Button>
            )}
          </Tooltip>
        </div>
      </div>

      <div
        className={` ${
          darkMode ? "text-white" : "text-black"
        } flex items-center z-[100] absolute right-0 p-[10px]`}
      >
        {(connecting || !connecting) && !connectionMode ? (
          <div className="mr-2">حالت آفلاین</div>
        ) : !connecting && connectionMode ? (
          <div className="mr-2">در حال اتصال</div>
        ) : connecting && connectionMode ? (
          <div className="mr-2">متصل شد</div>
        ) : (
          <></>
        )}
        {connecting && connectionMode ? (
          <div className="blob"></div>
        ) : (connecting || !connecting) && !connectionMode ? (
          <div className="bloborange"></div>
        ) : (
          <div className="blobred"></div>
        )}
      </div>
    </>
  );
};

export default HeaderBar;
