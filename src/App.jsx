import React, { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Button,
  ButtonGroup,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Tab,
  Tabs,
  Tooltip,
  useDisclosure,
  useDraggable,
} from "@nextui-org/react";
import {
  FaAngleDown,
  FaAngleUp,
  FaTools,
  FaCogs,
  FaFileAlt,
  FaVideo,
  FaAngleLeft,
  FaAngleRight,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { AnimatePresence, motion } from "framer-motion";
import { useMyContext } from "./context/MyContext";
import axios from "axios";
import io, { connect } from "socket.io-client";
import config from "../public/config.json";
import ResourcesSidebar from "./components/sidebar/resources/screen/ResourcesSidebar";
import ScenesSidebar from "./components/sidebar/scenes/screen/ScenesSidebar";
import HeaderBar from "./components/headerbar/screen/HeaderBar";
import Konva from "konva";
import CollectionsSidebar from "./components/sidebar/program/CollectionsSidebar";
import UsageSidebar from "./components/sidebar/sources/UsageSidebar";
import {
  MdCancel,
  MdCollections,
  MdCollectionsBookmark,
  MdDone,
  MdOutlineDataUsage,
  MdUpgrade,
} from "react-icons/md";
import { CircularProgress, heroui } from "@heroui/react";
import { MonitorLayoutModal } from "./components/konva/items/monitor/position/MonitorPosition";
import MosaicSetupModal from "./components/konva/items/monitor/position/MosaicSetupModal";
import { addMonitorsToScenes } from "./components/konva/items/monitor/MonitorKonva";
import { FaServer, FaDesktop } from "react-icons/fa";
import Canvas from "./Canvas";

function App() {
  let {
    host,
    port,
    videoWalls,
    setVideoWalls,
    activeModal,
    openModal,
    closeModal,
    isToggleLayout,
    setIsToggleLayout,

    isLoading,
    setIsLoading,
    miniLoad,
    isToggleVideoWall,
    loopVideos,
    darkMode,
    setConnecting,
    connectionMode,
    setInputs,
    scenes,
    setScenes,
    scenesRef,
    videoWallsRef,
    connectionModeRef,
    selectedScene,
    isBottomControlsVisible,
    setIsBottomControlsVisible,

    isRightControlsVisible,
    setIsRightControlsVisible,

    pendingOperations,
    setPendingOperation,
    flagOperations,
    setFlagOperation,

    getSelectedScene,
    MonitorPositionEditor,
    updateMonitorPosition,

    IconMenuSidebar,
    fetchDataScene,

    socket,
    connecting,
    trimPrefix,
    monitorConnection,
    setMonitorConnection,
    setSelectedSource,
    selectedSource,
    handleDragOver,
    handleDrop,
    fitStageToMonitors,
    selectedSceneRef,
    isChangeRealTime,
    setIsChangeRealTime,
  } = useMyContext();

  const [leftTab, setLeftTab] = useState("Sources");

  useEffect(() => {
    scenesRef.current = scenes;
  }, [scenes]);

  useEffect(() => {
    connectionModeRef.current = connectionMode;
    if (connectionMode) {
      setFlagOperation(true);
    }
  }, [connectionMode]);

  useEffect(() => {
    videoWallsRef.current = videoWalls;
  }, [videoWalls]);

  //Unreaggble scenes items ...
  useEffect(() => {
    let updated = false;

    const updatedScenes = scenes.map((scene) => {
      const layer = scene.layer;
      if (!layer) return scene;

      layer.children.forEach((group) => {
        if (group.attrs.catFix === "monitor") {
          const currentDraggable = group.draggable();
          const newDraggable = isToggleVideoWall;

          if (currentDraggable !== newDraggable) {
            group.draggable(newDraggable);
            updated = true;
          }
        }
      });

      layer.draw();
      return scene;
    });
    if (updated) {
      setScenes(updatedScenes);
    }
  }, [isToggleVideoWall, scenes]);

  function handleDisplayError(updatedDisplays) {
    if (!connectionModeRef.current) return;
    // console.log("🟠 Updated displays received from server:", updatedDisplays);

    setScenes((prevScenes) =>
      prevScenes.map((scene) => {
        const { layer } = scene;
        if (!layer) return scene;

        updatedDisplays?.forEach((display) => {
          const group = layer.findOne(`#monitor-group-${display.id}`);

          if (group) {
            const rect = group.findOne("Rect");
            const text = group.findOne(".monitorText");

            if (!display.connected) {
              setMonitorConnection(false);
              if (rect) rect.fill("red");
              if (text) text.text(`Monitor ${display.name} (Disconnected)`);

              if (!group.findOne(".disconnectIcon")) {
                const disconnectIcon = new Konva.Text({
                  text: "❌",
                  fontSize: 30,
                  fill: "white",
                  x: rect.width() / 2 - 15,
                  y: rect.height() / 2 - 15,
                  name: "disconnectIcon",
                });
                group.add(disconnectIcon);
              }
            } else {
              // addMonitorsToScenes({
              //   jsonData: updatedDisplays,
              //   scenes: scenesRef.current,
              //   setScenes,
              // });

              if (rect) rect.fill("#161616");
              if (text) text.setAttr("text", `Monitor ${display.name}`);
              setMonitorConnection(true);

              const disconnectIcon = group.findOne(".disconnectIcon");
              if (disconnectIcon) disconnectIcon.destroy();
            }
          }
        });
        setVideoWalls(updatedDisplays);
        layer.draw();
        return scene;
      })
    );
  }

  function offDisplays() {
    setMonitorConnection(false);

    setScenes((prevScenes) =>
      prevScenes.map((scene) => {
        const { layer } = scene;
        if (!layer) return scene;

        videoWalls?.forEach((display) => {
          const group = layer.findOne(`#monitor-group-${display.id}`);

          if (group) {
            const rect = group.findOne("Rect");
            const text = group.findOne(".monitorText");

            if (rect) rect.fill("red");
            if (text) text.text(`Monitor ${display.id} (Disconnected)`);

            if (!group.findOne(".disconnectIcon")) {
              const disconnectIcon = new Konva.Text({
                text: "❌",
                fontSize: 30,
                fill: "white",
                x: rect.width() / 2 - 15,
                y: rect.height() / 2 - 15,
                name: "disconnectIcon",
              });
              group.add(disconnectIcon);
            }
          }
        });

        layer.draw();
        return scene;
      })
    );
  }

  useEffect(() => {
    if (socket && connecting && connectionMode) {
      socket.on("displays-arranged", (e) => {
        setIsLoading(false);
      });
      socket.on("display_error", handleDisplayError);
    } else {
      offDisplays();
    }
  }, [socket, connecting, connectionMode]);

  // useEffect(() => {
  //   if (pendingOperations.length > 0 && connectionMode && socket) {
  //     socket = io(`http://${host}:${port}`);

  //     socket.on("connect", () => {
  //       setConnecting(true);

  //       if (pendingOperations.length > 0) {
  //         // const operation = pendingOperations.shift();
  //         pendingOperations.map((item) => {
  //           socket.emit(item.action, item.payload);
  //         });
  //         setPendingOperation([]);
  //       }
  //     });
  //   }
  // }, [connectionMode, socket, pendingOperations]);

  // useEffect(() => {
  //   getSelectedScene()?.resources?.forEach((item) => {
  //     if (item.type === "video") {
  //       const videoElement = item.videoElement;
  //       if (videoElement) {
  //         videoElement.loop = loopVideos[item.id] || false;
  //       }
  //     }
  //   });
  // }, [loopVideos, getSelectedScene()?.resources]);

  useEffect(() => {
    const selectedSceneLayer = getSelectedScene()?.layer;
    getSelectedScene()?.stageData?.on("click", (e) => {
      setSelectedSource(e.target.attrs.uniqId);

      if (e.target === getSelectedScene()?.stageData || e.target.attrs.catFix == "monitor") {
        selectedSceneLayer.find("Transformer").forEach((tr) => tr.detach());
        setSelectedSource(null);

        selectedSceneLayer.find("Group").forEach((group) => {
          group.draggable(false);
        });

        selectedSceneLayer.draw();
      } else {
        // console.log("e::: ", e.currentTarget.id());

        selectedSceneLayer.find("Transformer").forEach((tr) => {
          if (tr.attrs.id != e.target.attrs.uniqId) {
            tr.detach();
          }
        });

        selectedSceneLayer.find("Group").forEach((group) => {
          if (group.attrs.id != e.target.attrs.uniqId) {
            group.draggable(false);
          }
        });

        selectedSceneLayer.draw();
      }
    });
  }, [getSelectedScene()?.stageData, getSelectedScene()?.layer, selectedSource]);

  function fitStageToMonitorsSmart({
    stage,
    layer,
    monitorSelector = (n) => n.getAttr("catFix") === "monitor",
    paddingAuto = true,
    padding = 60, // اگر paddingAuto=false
    maxScaleAuto = true,
    maxScale = 1, // اگر maxScaleAuto=false
  }) {
    if (!stage || !layer) return;

    // --- مونیتورها را پیدا کن
    const monitors = layer.find(monitorSelector);
    if (!monitors.length) return;

    // --- ترنسفورم فعلی را ذخیره و صفر کن (تا باکس محتوا دقیق شود)
    const prevScale = { x: stage.scaleX(), y: stage.scaleY() };
    const prevPos = { x: stage.x(), y: stage.y() };
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });

    // --- باکس کل مانیتورها
    let rect = monitors[0].getClientRect({ skipShadow: true, skipStroke: false });
    for (let i = 1; i < monitors.length; i++) {
      const r = monitors[i].getClientRect({ skipShadow: true, skipStroke: false });
      const minX = Math.min(rect.x, r.x);
      const minY = Math.min(rect.y, r.y);
      const maxX = Math.max(rect.x + rect.width, r.x + r.width);
      const maxY = Math.max(rect.y + rect.height, r.y + r.height);
      rect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    // اگر چیزی اشتباه بود
    if (!(rect.width > 0 && rect.height > 0)) {
      // ترنسفورم قبل را برگردان
      stage.scale(prevScale);
      stage.position(prevPos);
      stage.batchDraw();
      return;
    }

    // --- اندازه‌ی ویو
    const viewW = stage.width();
    const viewH = stage.height();

    // --- padding و maxScale هوشمند
    const smartPad = Math.round(
      clamp(Math.min(viewW, viewH) * 0.06, 24, 120) // 6% حداقل 24 حداکثر 120px
    );
    const usePad = paddingAuto ? smartPad : padding;

    const scaleX = (viewW - usePad * 2) / rect.width;
    const scaleY = (viewH - usePad * 2) / rect.height;
    let scale = Math.min(scaleX, scaleY);

    // حداکثر اسکیل: کمی بزرگتر از ۱ تا اگه محتوا کوچیکه، ملایم بزرگ شه (نه غلو)
    const smartMax = 1.15;
    const useMax = maxScaleAuto ? smartMax : maxScale;
    scale = Math.min(scale, useMax);

    // --- سنتر کردن
    const contentCX = rect.x + rect.width / 2;
    const contentCY = rect.y + rect.height / 2;
    const viewCX = viewW / 2;
    const viewCY = viewH / 2;

    stage.scale({ x: scale, y: scale });
    stage.position({
      x: viewCX - contentCX * scale,
      y: viewCY - contentCY * scale,
    });

    stage.batchDraw();
  }

  function centerStageOnMonitors({
    stage,
    layer,
    monitorSelector = (n) => n.getAttr("catFix") === "monitor",
  }) {
    if (!stage || !layer) return;
    const monitors = layer.find(monitorSelector);
    if (!monitors.length) return;

    const prevScale = { x: stage.scaleX(), y: stage.scaleY() };
    const prevPos = { x: stage.x(), y: stage.y() };

    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });

    let rect = monitors[0].getClientRect({ skipShadow: true, skipStroke: false });
    for (let i = 1; i < monitors.length; i++) {
      const r = monitors[i].getClientRect({ skipShadow: true, skipStroke: false });
      const minX = Math.min(rect.x, r.x);
      const minY = Math.min(rect.y, r.y);
      const maxX = Math.max(rect.x + rect.width, r.x + r.width);
      const maxY = Math.max(rect.y + rect.height, r.y + r.height);
      rect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    const viewW = stage.width();
    const viewH = stage.height();
    const scale = prevScale.x || 1;

    const contentCX = rect.x + rect.width / 2;
    const contentCY = rect.y + rect.height / 2;
    const viewCX = viewW / 2;
    const viewCY = viewH / 2;

    stage.scale({ x: scale, y: scale });
    stage.position({
      x: viewCX - contentCX * scale,
      y: viewCY - contentCY * scale,
    });
    stage.batchDraw();
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  return (
    <main
      className={`${
        darkMode ? "bg-[#1E232A]" : "bg-[#e3e4e4]"
      }  h-screen w-full flex flex-col z-50  items-center `}
    >
      {/* Loader */}
      {miniLoad && (
        <div className=" z-[1000000] w-fit h-fit flex flex-col gap-3 justify-center items-center  m-auto">
          <CircularProgress label="در حال انجام عملیات ..." />
        </div>
      )}
      {isLoading && (
        <div className="w-full z-[1000000] flex flex-col gap-3 justify-center items-center h-full backdrop-blur-[5px]">
          <Spinner size="lg" />
          <div className={`vazirblack  ${darkMode ? "text-white" : "text-black"}`}>
            لطفا صبر کنید عملیات در حال انجام است
          </div>
        </div>
      )}
      <Canvas
        darkMode={darkMode}
        title={
          getSelectedScene()?.name ? `${getSelectedScene()?.name} فعال است` : "خطا در دریافت صحنه"
        }
        subtitle={
          connectionMode
            ? connecting
              ? "اتصال برقرار است"
              : "اتصال صحنه دچار مشکل شده"
            : "حالت آفلاین فعال شده"
        }
        scenes={scenes}
        selectedScene={selectedScene}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        onFit={() => {
          const scn = getSelectedScene();
          if (!scn?.stageData) return;
          if (!videoWalls?.length) return;
          fitStageToMonitors({
            stage: scn.stageData,
            monitors: videoWalls,
          });
        }}
        onCenter={() => {
          const scn = getSelectedScene();
          if (!scn?.stageData || !scn?.layer) return;
          centerStageOnMonitors({ stage: scn.stageData, layer: scn.layer });
        }}
        onReset={() => {
          const scn = getSelectedScene();
          if (!scn?.stageData) return;
          scn.stageData.scale({ x: 1, y: 1 });
          scn.stageData.position({ x: 0, y: 0 });
          scn.stageData.batchDraw();
        }}
        footerSlot={
          <div className="rounded-xl px-3 py-2 backdrop-blur-sm bg-black/10 dark:bg-white/10 shadow-sm">
            {/* <div></ */}
          </div>
        }
      />
      {/* === Left Sidebar (full-height with Tabs) === */}
      {!isToggleLayout && (
        <>
          <motion.aside
            className={`fixed left-0 top-0 z-[10] h-screen border-r ${
              darkMode ? "bg-[#1b1f25] border-[#2a2f36]" : "bg-white border-[#e5e7eb]"
            }`}
            style={{ width: "20%" }}
            initial={{ x: -360 }}
            animate={{ x: isBottomControlsVisible ? 0 : -360 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <div className="h-full overflow-auto scrollbar-hide flex flex-col">
              {/* Tabs Header */}
              <Tabs
                selectedKey={leftTab}
                onSelectionChange={setLeftTab}
                aria-label="پنل مدیریت"
                variant="underlined"
                classNames={{
                  base: "sticky w-full top-0 z-10 px-3 pt-3 bg-inherit",
                  tabList: "gap-4",
                  tab: "data-[hover=true]:opacity-80",
                  tabContent: `
                    font-medium
                    ${
                      darkMode
                        ? "text-gray-200 group-data-[selected=true]:text-blue-400"
                        : "text-gray-700 group-data-[selected=true]:text-blue-600"
                    }
                  `,
                  cursor: darkMode ? "bg-blue-400" : "bg-blue-600",
                }}
              >
                <Tab key="resources" title="منابع" />
                <Tab key="scenes" title="صحنه‌ها" />
                <Tab key="collections" title="برنامه‌ها" />
              </Tabs>

              {/* Tabs Content */}
              <div className="flex-1 p-1">
                {leftTab === "resources" && (
                  <div
                    className={`${
                      darkMode ? "bg-[#232933]" : "bg-[#f8fafc]"
                    } rounded-2xl h-full  p-2`}
                  >
                    <ResourcesSidebar />
                  </div>
                )}

                {leftTab === "scenes" && (
                  <div
                    className={`${
                      darkMode ? "bg-[#232933]" : "bg-[#f8fafc]"
                    } rounded-2xl h-full  p-2`}
                  >
                    <ScenesSidebar />
                  </div>
                )}

                {leftTab === "collections" && (
                  <div
                    className={`${
                      darkMode ? "bg-[#232933]" : "bg-[#f8fafc]"
                    } rounded-2xl h-full p-2`}
                  >
                    <CollectionsSidebar />
                  </div>
                )}

                {/* فاصله‌ی انتهایی برای تنفس */}
                <div className="h-16" />
              </div>
            </div>
          </motion.aside>

          <Button
            className={`fixed bottom-5 left-0 w-[30px] h-[30px] text-xl z-[10] min-w-fit p-2 rounded-r-2xl shadow-md
        ${darkMode ? "bg-[#232933] text-white" : "bg-white text-black"}
      `}
            style={{ left: isBottomControlsVisible ? 20 : 20 }}
            onPress={() => setIsBottomControlsVisible(!isBottomControlsVisible)}
            aria-label="toggle-left-panel"
          >
            {isBottomControlsVisible ? "‹" : "›"}
          </Button>

          <motion.div
            className="pointer-events-none"
            style={{ width: "20%" }}
            initial={{ width: 0 }}
            animate={{ width: isBottomControlsVisible ? "20%" : 0 }}
            transition={{ duration: 0.3 }}
          />
        </>
      )}
      {/* === Right Sidebar (full-height with Tabs) === */}
      {!isToggleLayout && (
        <>
          <motion.aside
            className={`fixed right-0 top-0 z-[10]  h-full border-l ${
              darkMode ? "bg-[#1b1f25] border-[#2a2f36]" : "bg-white border-[#e5e7eb]"
            }`}
            style={{ width: "20%" }}
            initial={{ x: 360 }}
            animate={{ x: isRightControlsVisible ? 0 : 360 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <div className="flex-1 h-full p-3">
              <div
                className={`${darkMode ? "bg-[#232933]" : "bg-[#f8fafc]"} rounded-2xl h-full   p-2`}
              >
                <UsageSidebar />
              </div>
            </div>
          </motion.aside>

          {/* Toggle button on right edge */}
          <Button
            className={`fixed bottom-5 right-0 w-[30px] h-[30px] text-xl z-[10] min-w-fit p-2 rounded-l-2xl shadow-md
        ${darkMode ? "bg-[#232933] text-white" : "bg-white text-black"}
      `}
            style={{ right: isRightControlsVisible ? 20 : 20 }}
            onPress={() => setIsRightControlsVisible(!isRightControlsVisible)}
            aria-label="toggle-right-panel"
          >
            {isRightControlsVisible ? "›" : "‹"}
          </Button>

          {/* Spacer so content doesn’t hide under sidebar */}
          <motion.div
            className="pointer-events-none"
            style={{ width: "20%" }}
            initial={{ width: 0 }}
            animate={{ width: isRightControlsVisible ? "20%" : 0 }}
            transition={{ duration: 0.3 }}
          />
        </>
      )}

      <div className=" overflow-auto h-[6%] scrollbar-hide flex top-0 absolute left-0  right-0 m-auto flex-col p-3 space-y-4">
        {/* Header */}
        <HeaderBar
          toggleLayout={() => {
            localStorage.setItem("layout", !isToggleLayout);
            setIsToggleLayout(!isToggleLayout);
            const scn = getSelectedScene();
            if (!scn?.stageData) return;
            if (!videoWalls?.length) return;
            setTimeout(() => {
              fitStageToMonitors({
                stage: scn.stageData,
                monitors: videoWalls,
              });
            }, [10]);
          }}
        />

        {/* Mosaic tools */}
        {isToggleVideoWall && videoWalls.length > 0 && (
          <div className="flex flex-col gap-3">
            <MosaicSetupModal />
            {/* <MonitorLayoutModal /> */}
            {/* 
            <MonitorPositionEditor
              monitors={videoWalls}
              updateMonitorPosition={updateMonitorPosition}
            /> 
            */}
          </div>
        )}
      </div>

      <div
        className={`${isToggleLayout ? "w-[98%]  justify-center" : "w-[59%] justify-end"} ${
          darkMode ? "text-white bg-gray-800" : "text-black bg-gray-100"
        } z-[10] bottom-3 relative p-2 rounded-xl h-[5%] items-center flex left-0 right-0  `}
      >
        <div dir="rtl" className="flex gap-4">
          {/* Driver Status */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-sm border
      ${
        connecting && connectionMode
          ? darkMode
            ? "bg-green-600/20 border-green-500 text-green-400"
            : " border-green-500 bg-green-100 text-green-400"
          : !connectionMode
          ? darkMode
            ? "bg-orange-600/20 border-orange-500 text-orange-400"
            : " border-orange-500 bg-orange-100 text-orange-400"
          : darkMode
          ? "bg-red-600/20 border-red-500 text-red-400"
          : " border-red-500 bg-red-100 text-red-400"
      }`}
          >
            <FaServer className="text-lg" />
            <span className="text-sm font-medium">
              {connecting && connectionMode
                ? "اتصال به درایور"
                : !connectionMode
                ? "درایور آفلاین"
                : "در حال اتصال به درایور"}
            </span>
          </div>

          {/* Monitor Status */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-sm border
      ${
        monitorConnection && connectionMode
          ? darkMode
            ? "bg-green-600/20 border-green-500 text-green-400"
            : " border-green-500 bg-green-100 text-green-400"
          : !connectionMode
          ? darkMode
            ? "bg-orange-600/20 border-orange-500 text-orange-400"
            : " border-orange-500 bg-orange-100 text-orange-400"
          : darkMode
          ? "bg-red-600/20 border-red-500 text-red-400"
          : " border-red-500 bg-red-100 text-red-400"
      }`}
          >
            <FaDesktop className="text-lg" />
            <span className="text-sm font-medium">
              {monitorConnection && connectionMode
                ? "مانیتورها متصل‌اند"
                : !connectionMode
                ? "مانیتورها آفلاین"
                : "منتظر اتصال مانیتورها"}
            </span>
          </div>
          {isChangeRealTime === "Yes" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-sm border">
              <span className="text-sm font-medium">تغییرات جدید</span>
              <Button onPress={() => setIsChangeRealTime("Done")} size="sm" variant="flat">
                تایید
              </Button>
              <Button onPress={() => setIsChangeRealTime("Cancle")} size="sm" variant="flat">
                انصراف
              </Button>
            </div>
          )}
        </div>
      </div>
      <Modal scrollBehavior="outside" isOpen={activeModal === "resources"} onClose={closeModal}>
        <ModalContent>
          <ModalBody className="p-0 ">
            <ResourcesSidebar />
          </ModalBody>
        </ModalContent>
      </Modal>
      <Modal scrollBehavior="outside" isOpen={activeModal === "UsageSidebar"} onClose={closeModal}>
        <ModalContent>
          <ModalBody className="p-0">
            <UsageSidebar />
          </ModalBody>
        </ModalContent>
      </Modal>
      <Modal scrollBehavior="outside" isOpen={activeModal === "scenes"} onClose={closeModal}>
        <ModalContent>
          <ModalBody className="p-0">
            <ScenesSidebar />
          </ModalBody>
        </ModalContent>
      </Modal>
      <Modal scrollBehavior="outside" isOpen={activeModal === "collections"} onClose={closeModal}>
        <ModalContent>
          <ModalBody className="p-0">
            <CollectionsSidebar />
          </ModalBody>
        </ModalContent>
      </Modal>
    </main>
  );
}

export default App;
