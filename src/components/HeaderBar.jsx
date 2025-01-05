import React from "react";
import { FaDownload, FaNetworkWired, FaUpload, FaWifi } from "react-icons/fa";
import SwitchCustom from "./SwitchCustom";
import { Button, Tooltip } from "@nextui-org/react";
import { RiLayout4Fill, RiRefreshFill } from "react-icons/ri";
import { TbFreezeRow, TbLayoutSidebarLeftCollapse, TbRefresh } from "react-icons/tb";
import { TbLayoutOff } from "react-icons/tb";
import { TbLayout } from "react-icons/tb";
import ModalVideoWall from "./videowall/ModalVideoWall";
import Swal from "sweetalert2";
import {
  MdDownload,
  MdLogout,
  MdOutlineResetTv,
  MdRefresh,
  MdSystemUpdateAlt,
  MdUpdate,
  MdUpload,
} from "react-icons/md";
import { PiNetwork } from "react-icons/pi";
import ModalInfo from "./ModalInfo";
import { CgArrangeBack } from "react-icons/cg";
import { TfiPanel } from "react-icons/tfi";
import JSZip from "jszip";
import axios from "axios";

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
  setSources,
  trimPrefix,
  addImage,
  addInput,
  addVideo,
  selectedScene,
  socket,
}) => {
  const handleExportProject = () => {
    const data = {
      collections: collections,
      scenes: scenes.map((scene) => ({
        id: scene.id,
        name: scene.name,
        resources: scene.resources.map((r) => ({
          id: r.id,
          type: r.type,
          content: r.content,
          name: r.name || "resource",
          x: r.x || 0,
          y: r.y || 0,
          rotation: r.rotation || 0,
          width: r.width || 400,
          height: r.height || 250,
          created_at: r.created_at || new Date().toISOString(),
        })),
      })),
      sources: sources.map((r) => ({
        id: r.uniqId || r.id,
        type: r.deviceId ? "input" : r.type,
        source: r.deviceId ? `input:${r.deviceId}` : r.content,
        name: r.name || "resource",
        x: r.x || 0,
        y: r.y || 0,
        sceneId: r.sceneId || 1,
        rotation: r.rotation || 0,
        width: r.width || 400,
        height: r.height || 250,
        created_at: r.created_at || new Date().toISOString(),
      })),
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
      displays: videoWalls.map((display) => {
        return {
          id: display.id, // شناسه یکتا
          monitorUniqId: display.monitorUniqId || display["Monitor ID"], // شناسه سخت‌افزاری نمایشگر
          key: display.numberMonitor || 0, // کلید یکتا برای React
          x: display.x || 0, // مختصات افقی
          y: display.y || 0, // مختصات عمودی
          width: display.width || 1920, // عرض نمایشگر
          height: display.height || 1080, // ارتفاع نمایشگر
          Resolution: display.resolution || `${display.width || 1920} X ${display.height || 1080}`, // رزولوشن
          ScaleFactor: display.scaleFactor || 1, // نسبت مقیاس
          Dpi: display.dpi || null, // تراکم پیکسلی
          RefreshRate: display.refreshRate || display["Frequency"] || 60, // نرخ تازه‌سازی
          Internal: display.internal || false, // داخلی یا خارجی بودن نمایشگر
          Name: display.name || `مانیتور ${display.numberMonitor || 0}`, // نام نمایشگر
          Primary: display.Primary || display.Primary === "Yes", // آیا نمایشگر اصلی است؟
          Orientation: display.orientation || display.Orientation || "Default", // جهت‌گیری
          connected: display.connected || display["Active"] === "Yes", // آیا متصل است؟
          Adapter: display.adapter || display.Adapter || "", // آداپتور
          created_at: display.created_at || new Date().toISOString(), // زمان ایجاد
          "Left-Top": display["Left-Top"] || null, // مختصات بالا-چپ
          "Right-Bottom": display["Right-Bottom"] || null, // مختصات پایین-راست
        };
      }),
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
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
            let x = jsonData.sources;
            const newSources = x.map((item) => {
              console.log("item::: ", item);
              let type;
              let content;
              let endObj = {};

              let fixedContent = item.source?.replace(/\\/g, "/");

              console.log("item.source::: ", item.source);
              if (item.source?.startsWith("input:")) {
                type = "input";
                content = trimPrefix(item.source, "input:");
                endObj = { name: item.name ?? "input", deviceId: content };
              } else if (item.source?.startsWith("image:")) {
                type = "image";
                content = trimPrefix(item.source, "image:");
                const imageURL = content;
                let img = new Image();
                img.src = imageURL;
                const imageName = "image" + counterImages++;
                endObj = {
                  name: item.name ?? imageName,
                  imageElement: img,
                };
              } else if (item.source?.startsWith("video:")) {
                type = "video";
                content = trimPrefix(item.source, "video:");
                console.log("content::: ", content);
                const video = document.createElement("video");
                video.src = content;
                const videoName = item.name;

                video.setAttribute("name", videoName);

                video.setAttribute("id", item.id);
                endObj = {
                  videoElement: video,
                  name: item.name ?? videoName,
                };
              } else if (item.source.startsWith("iframe:")) {
                type = "iframe";
                content = trimPrefix(item.source, "iframe:");
              }
              console.log(endObj);
              endObj = {
                ...endObj,
                id: item.id,
                sceneId: selectedScene,
                type,
                content: type === "input" ? content : fixedContent,
                width: item.width,
                height: item.height,
                x: item.x,
                y: item.y,
                rotation: parseInt(item.rotation),
              };

              if (type === "image") {
                addImage(endObj, false);
              } else if (type === "input") {
                console.log("endObj::: ", endObj);
                addInput(endObj, false);
              } else if (type === "video") {
                addVideo(endObj, false);
                // addRectangle();
              }
              return endObj;
            });
            setSources(newSources);
          } catch (error) {
            alert("خطا در خواندن فایل JSON. لطفاً یک فایل معتبر انتخاب کنید.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleUpdate = async () => {
    try {
      Swal.fire({
        title: "در حال دانلود به‌روزرسانی...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await axios.get("/dist.zip", {
        responseType: "arraybuffer",
      });

      const zip = new JSZip();
      console.log("zip::: ", zip);
      const extractedZip = await zip.loadAsync(response.data);
      console.log("extractedZip::: ", extractedZip);

      // فایل‌ها را استخراج کنید
      const files = Object.keys(extractedZip.files);
      console.log("files::: ", files);
      files.forEach(async (filename) => {
        const fileData = await extractedZip.files[filename].async("blob");
        console.log(`Extracted file: ${filename}`, fileData);

        // در اینجا می‌توانید فایل‌ها را ذخیره کنید
        // اما توجه کنید این بخش در مرورگر انجام نمی‌شود
      });

      Swal.close();
      Swal.fire({
        icon: "success",
        title: "به‌روزرسانی با موفقیت انجام شد!",
        showConfirmButton: false,
        timer: 1500,
      });

      // تازه‌سازی برنامه
      window.location.reload();
    } catch (error) {
      console.error("Error updating application:", error);
      Swal.fire({
        icon: "error",
        title: "خطا در به‌روزرسانی",
        text: "دانلود یا جایگزینی فایل‌ها با خطا مواجه شد.",
      });
    }
  };

  return (
    <>
      <div
        id="setting"
        className={` ${isToggleLayout ? "" : ""} ${
          darkMode ? "text-white" : "text-black"
        } flex items-center z-[100] absolute left-0 p-[10px]`}
      >
        <div className="flex gap-2">
          <Tooltip content={"خروج از اکانت"}>
            <Button
              className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="flat"
              color={"danger"}
              onPress={() => {
                Swal.fire({
                  title: "آیا مطمئن هستید؟",
                  showDenyButton: true,
                  showCancelButton: false,
                  confirmButtonText: "بله",
                  denyButtonText: `خیر`,
                  confirmButtonColor: "green",
                  denyButtonColor: "gray",
                }).then((result) => {
                  if (result.isConfirmed) {
                    localStorage.setItem("isLoggedIn", "false");
                    location.reload();
                  }
                });
              }}
            >
              <MdLogout size={20} />
            </Button>
          </Tooltip>
          <SwitchCustom setDarkMode={setDarkMode} darkMode={darkMode} />

          <ModalInfo darkMode={darkMode} />

          <Tooltip content={"آپدیت نرم‌افزار"}>
            <Button
              className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color={"default"}
              onPress={() => {
                Swal.fire({
                  title: "آپدیت انجام شود؟",
                  text: "! نیازمند اینترنت ",
                  showDenyButton: true,
                  showCancelButton: false,
                  confirmButtonText: "بله",
                  denyButtonText: `خیر`,
                  confirmButtonColor: "green",
                  denyButtonColor: "gray",
                }).then((result) => {
                  if (result.isConfirmed) {
                    handleUpdate();
                  }
                });
              }}
            >
              <MdSystemUpdateAlt size={20} />
            </Button>
          </Tooltip>

          <Tooltip content={"تازه‌سازی کامل"}>
            <Button
              className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color={"default"}
              onPress={() => {
                Swal.fire({
                  title: "نرم‌افزار کامل تازه‌سازی شود؟",
                  showDenyButton: true,
                  showCancelButton: false,
                  confirmButtonText: "بله",
                  denyButtonText: `خیر`,
                  confirmButtonColor: "green",
                  denyButtonColor: "gray",
                }).then((result) => {
                  if (result.isConfirmed) {
                    socket.emit("recreate-window", true);
                    socket.emit("run-batch", true);
                    location.reload();
                  }
                });
              }}
            >
              <MdRefresh size={20} />
            </Button>
          </Tooltip>

          <Tooltip content={"تازه‌سازی کنترلر"}>
            <Button
              className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color={"default"}
              onPress={() => {
                Swal.fire({
                  title: "کنترلر تازه‌سازی شود؟",
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
              <TfiPanel size={20} />
            </Button>
          </Tooltip>

          <Tooltip content={"تازه‌سازی نمایشگر"}>
            <Button
              className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color={"default"}
              onPress={() => {
                Swal.fire({
                  title: "نمایشگر تازه‌سازی شود؟",
                  showDenyButton: true,
                  showCancelButton: false,
                  confirmButtonText: "بله",
                  denyButtonText: `خیر`,
                  confirmButtonColor: "green",
                  denyButtonColor: "gray",
                }).then((result) => {
                  if (result.isConfirmed) {
                    socket.emit("recreate-window", true);
                  }
                });
              }}
            >
              <MdOutlineResetTv size={20} />
            </Button>
          </Tooltip>

          <Tooltip content={"تازه‌سازی چیدمان"}>
            <Button
              className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color={"default"}
              onPress={() => {
                Swal.fire({
                  title: "چیدمان تازه‌سازی شود؟",
                  showDenyButton: true,
                  showCancelButton: false,
                  confirmButtonText: "بله",
                  denyButtonText: `خیر`,
                  confirmButtonColor: "green",
                  denyButtonColor: "gray",
                }).then((result) => {
                  if (result.isConfirmed) {
                    socket.emit("run-batch", true);
                  }
                });
              }}
            >
              <CgArrangeBack size={20} />
            </Button>
          </Tooltip>

          <Tooltip content="تنظیمات شبکه">
            <Button
              className={`${darkMode ? "dark" : "light"} min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color="default"
              onPress={async () => {
                const { value: formValues } = await Swal.fire({
                  confirmButtonColor: "gray",
                  title: "تنظیمات شبکه",
                  html: `
                  
                  <input type="text" id="swal-input1" class="swal2-input">
                  <p>Static Ip</p>
                  <input type="text" id="swal-input2" class="swal2-input">
                  <p>Subnet Mask</p>
                  <input type="text" id="swal-input3" class="swal2-input">
                  <p>Gateway</p>
                  <input type="text" id="swal-input4" class="swal2-input">
                  <p>Interface</p>
                  `,
                  focusConfirm: false,
                  preConfirm: () => {
                    return [
                      document.getElementById("swal-input1").value,
                      document.getElementById("swal-input2").value,
                      document.getElementById("swal-input3").value,
                      document.getElementById("swal-input4").value,
                    ];
                  },
                });
                if (formValues) {
                  Swal.fire(JSON.stringify(formValues));
                }
              }}
            >
              <PiNetwork size={25} />
            </Button>
          </Tooltip>

          <Tooltip content="وارد کردن فایل کانفیگ">
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
          <Tooltip content="خروجی گرفتن از کانفیگ ویدئووال">
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
                  if (result.isConfirmed) {
                    localStorage.setItem("onlineMode", !connectionMode);
                    setConnectionMode(!connectionMode);
                  }
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
