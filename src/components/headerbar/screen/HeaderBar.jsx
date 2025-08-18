import React, { useState } from "react";
import {
  FaDownload,
  FaExpand,
  FaNetworkWired,
  FaPlug,
  FaPowerOff,
  FaUpload,
  FaWifi,
} from "react-icons/fa";
import SwitchCustom from "../SwitchCustom";
import {
  Alert,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip,
} from "@nextui-org/react";
import { RiLayout4Fill, RiRefreshFill } from "react-icons/ri";
import { TbFreezeRow, TbLayoutSidebarLeftCollapse, TbRefresh } from "react-icons/tb";
import { TbLayoutOff } from "react-icons/tb";
import { TbLayout } from "react-icons/tb";
import ModalVideoWall from "../ModalVideoWall";
import Swal from "sweetalert2";
import {
  MdConnectingAirports,
  MdDownload,
  MdLogout,
  MdOutlineResetTv,
  MdRefresh,
  MdSettings,
  MdUpload,
} from "react-icons/md";
import { PiNetwork } from "react-icons/pi";
import ModalInfo from "../ModalInfo";
import { CgArrangeBack } from "react-icons/cg";
import { TfiPanel } from "react-icons/tfi";
import JSZip from "jszip";
import axios from "axios";
import { AiOutlinePoweroff } from "react-icons/ai";
import { useMyContext } from "../../../context/MyContext";
import { BsEyeSlash } from "react-icons/bs";
import { Link } from "@heroui/react";
import SettingsModal from "../SettingsModal";

const HeaderBar = ({ toggleLayout }) => {
  let {
    videoWalls,
    setVideoWalls,
    isToggleLayout,
    isToggleVideoWall,
    setIsToggleVideoWall,
    darkMode,
    setDarkMode,
    connecting,
    connectionMode,
    setConnectionMode,
    inputs,
    setInputs,
    scenes,
    setScenes,
    selectedScene,
    collections,
    sources,
    setSources,
    counterImages,
    addMonitorsToScenes,
    addVideo,
    addImage,
    addInput,
    getSelectedScene,
    sendOperation,
    url,
    loopVideos,
    generateBlobImageURL,
    trimPrefix,
    socket,
    monitorConnection,
  } = useMyContext();
  const [openSettings, setOpenSettings] = useState(false);

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
          id: display.id,
          monitorUniqId: display.monitorUniqId || display["Monitor ID"],
          key: display.id || 0,
          x: display.x || 0,
          y: display.y || 0,
          width: display.width || 1920,
          height: display.height || 1080,
          Resolution: display.resolution || `${display.width || 1920} X ${display.height || 1080}`,
          ScaleFactor: display.scaleFactor || 1,
          Dpi: display.dpi || null,
          RefreshRate: display.refreshRate || display["Frequency"] || 60,
          Internal: display.internal || false,
          Name: display.name || `مانیتور ${display.id || 0}`,
          Primary: display.Primary || display.Primary === "Yes",
          Orientation: display.orientation || display.Orientation || "Default",
          connected: display.connected || display["Active"] === "Yes",
          Adapter: display.adapter || display.Adapter || "",
          created_at: display.created_at || new Date().toISOString(),
          "Left-Top": display["Left-Top"] || null,
          "Right-Bottom": display["Right-Bottom"] || null,
          index: display.id,
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
              let type;
              let content;
              let endObj = {};

              let fixedContent = item.source?.replace(/\\/g, "/");

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
                let imageName = "image" + counterImages++;
                endObj = {
                  name: item.name ?? imageName,
                  imageElement: img,
                };
              } else if (item.source?.startsWith("video:")) {
                type = "video";
                content = trimPrefix(item.source, "video:");
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
                addImage({
                  img: endObj,
                  mode: false,
                  getSelectedScene,
                  setSources,
                  sendOperation,
                  url,
                  generateBlobImageURL,
                });
              } else if (type === "input") {
                addInput({
                  input: endObj,
                  mode: false,
                  getSelectedScene,
                  setSources,
                  sendOperation,
                });
              } else if (type === "video") {
                addVideo({
                  videoItem: endObj,
                  mode: false,
                  getSelectedScene,
                  setSources,
                  sendOperation,
                  url,
                  loopVideos,
                });
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
        title: "در حال دانلود و استخراج فایل...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await axios.get("/dist.zip", {
        responseType: "arraybuffer",
      });

      const zip = new JSZip();
      const extractedZip = await zip.loadAsync(response.data);

      const files = Object.keys(extractedZip.files);
      for (const filename of files) {
        const file = extractedZip.files[filename];

        if (!file.dir) {
          const fileContent = await file.async("blob");
          saveFileLocally(filename, fileContent);
        }
      }

      Swal.close();
      Swal.fire({
        icon: "success",
        title: "به‌روزرسانی با موفقیت انجام شد و فایل‌ها استخراج شدند!",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error("Error updating application:", error);
      Swal.fire({
        icon: "error",
        title: "خطا در به‌روزرسانی",
        text: "دانلود یا استخراج فایل‌ها با خطا مواجه شد.",
      });
    }
  };

  const saveFileLocally = (filename, blobContent) => {
    const url = URL.createObjectURL(blobContent);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Fullscreen error:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <>
      <div
        id="setting"
        className={` ${isToggleLayout ? "w-[100%]" : "w-[59%]"} ${
          darkMode ? "text-white bg-gray-800" : "text-black bg-gray-100"
        } flex items-center z-[10] mb-2 p-2 rounded-xl   justify-center left-0 right-0 mx-auto `}
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

          {/* <Tooltip content={"آپدیت نرم‌افزار"}>
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
          </Tooltip> */}

          <Dropdown>
            <DropdownTrigger>
              <Button
                className={`${darkMode ? "dark" : "light"}  min-w-[35px] h-[33px] rounded-lg  p-1`}
                size="lg"
                variant="solid"
                color={"default"}
              >
                <AiOutlinePoweroff size={20} />
              </Button>
            </DropdownTrigger>

            <DropdownMenu
              onAction={(e) => {
                if (e == "reset") {
                  Swal.fire({
                    title: "آیا سیستم ری‌استارت شود؟",
                    showDenyButton: true,
                    showCancelButton: false,
                    confirmButtonText: "بله",
                    denyButtonText: `خیر`,
                    confirmButtonColor: "green",
                    denyButtonColor: "gray",
                  }).then((result) => {
                    if (result.isConfirmed) {
                      socket.emit("shell", "shutdown.exe /r /f /t 0");
                    }
                  });
                } else if (e == "off") {
                  Swal.fire({
                    title: "آیا سیستم خاموش شود؟",
                    showDenyButton: true,
                    showCancelButton: false,
                    confirmButtonText: "بله",
                    denyButtonText: `خیر`,
                    confirmButtonColor: "green",
                    denyButtonColor: "gray",
                  }).then((result) => {
                    if (result.isConfirmed) {
                      socket.emit("shell", "shutdown.exe /s /f /t 0");
                    }
                  });
                }
              }}
              dir="rtl"
            >
              <DropdownItem key="reset">ریست کردن</DropdownItem>
              <DropdownItem key="off">خاموش کردن</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* <Tooltip content={"تازه‌سازی کامل ویدئووال و کنترلر"}>
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
          </Tooltip> */}

          {/* <Tooltip content={"تازه‌سازی کنترلر"}>
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
          </Tooltip> */}

          {/* <Tooltip content={"تازه‌سازی نمایشگر"}>
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
          </Tooltip> */}

          <Tooltip content={connecting ? "تنظیمات شبکه(متصل)" : "تنظیمات شبکه(اشکال در اتصال)"}>
            <Button
              className={`${darkMode ? "dark" : "light"} min-w-[35px] h-[33px] rounded-lg p-1`}
              size="lg"
              variant="solid"
              color={connecting ? "default" : "danger"}
              onPress={async () => {
                const defaultStaticIP = localStorage.getItem("host") ?? "192.168.1.101";
                const defaultSubnetMask = "255.255.255.0";
                const defaultGateway = "192.168.1.1";
                const defaultDNS = "8.8.8.8";
                let flagDHCP = false;
                const { value: formValues } = await Swal.fire({
                  confirmButtonColor: "gray",
                  title: "تنظیمات شبکه",
                  html: `
                    <label>Static IP</label>
                    <input type="text" value="${defaultStaticIP}" id="swal-input1" class="swal2-input">
                    
                   `,
                  didOpen: () => {
                    // const ipTypeSelect = document.getElementById("swal-ip-type");
                    const staticFields = [document.getElementById("swal-input1")];

                    ipTypeSelect.addEventListener("change", (e) => {
                      const isStatic = e.target.value === "static";
                      staticFields.forEach((field) => {
                        field.disabled = !isStatic;
                        if (!isStatic) field.value = "";
                      });
                    });
                  },
                  focusConfirm: false,
                  preConfirm: () => {
                    // const ipType = document.getElementById("swal-ip-type").value;
                    const staticIP = document.getElementById("swal-input1").value.trim();
                    // const subnetMask = document.getElementById("swal-input2").value.trim();
                    // const gateway = document.getElementById("swal-input3").value.trim();
                    // const dns = document.getElementById("swal-input4").value.trim();

                    if (true) {
                      const ipRegex =
                        /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
                      const subnetMaskRegex =
                        /^(128|192|224|240|248|252|254|255)\.0\.0\.0$|^255\.(0|128|192|224|240|248|252|254)\.0\.0$|^255\.255\.(0|128|192|224|240|248|252|254)\.0$|^255\.255\.255\.(0|128|192|224|240|248|252|254|255)$/;

                      if (!ipRegex.test(staticIP)) {
                        Swal.showValidationMessage(
                          "لطفاً یک Static IP معتبر وارد کنید (مثال: 192.168.1.101)"
                        );
                        return false;
                      }
                      // if (!subnetMaskRegex.test(subnetMask)) {
                      //   Swal.showValidationMessage(
                      //     "لطفاً یک Subnet Mask معتبر وارد کنید (مثال: 255.255.255.0)"
                      //   );
                      //   return false;
                      // }
                      // if (!ipRegex.test(gateway)) {
                      //   Swal.showValidationMessage(
                      //     "لطفاً یک Gateway معتبر وارد کنید (مثال: 192.168.1.1)"
                      //   );
                      //   return false;
                      // }
                      // if (!ipRegex.test(dns)) {
                      //   Swal.showValidationMessage("لطفاً یک DNS معتبر وارد کنید (مثال: 8.8.8.8)");
                      //   return false;
                      // }
                      localStorage.setItem("host", staticIP);
                      return { staticIP };
                    }
                    flagDHCP = true;
                    return { ipType };
                  },
                });

                if (flagDHCP) {
                  const newIp = prompt("لطفا آی‌ پی جدید را از درایور خوانده و وارد کنید");
                  localStorage.setItem("host", newIp);
                  location.reload();
                  flagDHCP = false;
                }

                if (formValues) {
                  if (true) {
                    socket.emit("state", {
                      ipType: formValues.ipType,
                      staticIP: formValues.staticIP,
                      subnetMask: formValues.subnetMask,
                      gateway: formValues.gateway,
                      dns: formValues.dns,
                    });
                  } else {
                    // localStorage.setItem('host',dhcp)
                    socket.emit("state", { ipType: "dhcp" });
                  }

                  Swal.fire({
                    icon: "success",
                    title: "تنظیمات با موفقیت اعمال شد!",
                    text:
                      formValues.ipType === "static"
                        ? `Static IP: ${formValues.staticIP}\nSubnet Mask: ${formValues.subnetMask}\nGateway: ${formValues.gateway}\nDNS: ${formValues.dns}`
                        : "تنظیمات برای IP Dynamic اعمال شد!",
                  });
                  location.reload();
                }
              }}
            >
              <PiNetwork size={25} />
            </Button>
          </Tooltip>

          {/* <Tooltip content="وارد کردن فایل کانفیگ">
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
          </Tooltip> */}
          <Tooltip content="پنهان کردن منوها">
            <Button
              className={`${darkMode ? "dark" : "light"} ${
                isToggleLayout ? "bg-blue-500 " : ""
              } min-w-[35px] h-[33px] rounded-lg  p-1`}
              size="lg"
              variant="solid"
              color="default"
              onPress={toggleLayout}
            >
              <BsEyeSlash size={25} />
            </Button>
          </Tooltip>

          {/* <Tooltip content="معرفی و راهنمای نرم افزار">
            <Link href="/doc">لینک</Link>
          </Tooltip> */}

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
              <FaPlug size={20} />
            </Button>
          </Tooltip>

          <Tooltip content="نمایش تمام صفحه">
            <Button
              className={`${darkMode ? "dark" : "light"} min-w-[35px] h-[33px] rounded-lg p-1`}
              size="lg"
              variant="solid"
              color="default"
              onPress={() => {
                handleFullscreen();
              }}
            >
              <FaExpand size={20} />
            </Button>
          </Tooltip>

          <SettingsModal isOpen={openSettings} onClose={() => setOpenSettings(false)} />

          {/* <Tooltip
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
                      if (videoWalls.length <= 0) {
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
          </Tooltip> */}
        </div>
      </div>
    </>
  );
};

export default HeaderBar;
