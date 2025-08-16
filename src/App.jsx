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
import { MdCollections, MdCollectionsBookmark, MdOutlineDataUsage } from "react-icons/md";
import { CircularProgress, heroui } from "@heroui/react";
import { MonitorLayoutModal } from "./components/konva/items/monitor/position/MonitorPosition";
import MosaicSetupModal from "./components/konva/items/monitor/position/MosaicSetupModal";
import { addMonitorsToScenes } from "./components/konva/items/monitor/MonitorKonva";
import { FaServer, FaDesktop } from "react-icons/fa";

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

  return (
    <main
      className={`${
        darkMode ? "bg-[#1E232A]" : "bg-[#e3e4e4]"
      }  h-screen w-full flex flex-col z-50  items-center `}
    >
      <div className={`${darkMode ? "text-white" : "text-black"} flex justify-end mt-4 z-[100]`}>
        <div dir="rtl" className="flex gap-4">
          {/* Driver Status */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-sm border
      ${
        connecting && connectionMode
          ? darkMode
            ? "bg-green-600/20 border-green-500 text-green-400"
            : " border-green-500 text-green-400"
          : !connectionMode
          ? darkMode
            ? "bg-orange-600/20 border-orange-500 text-orange-400"
            : " border-orange-500 text-orange-400"
          : darkMode
          ? "bg-red-600/20 border-red-500 text-red-400"
          : " border-red-500 text-red-400"
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
            : " border-green-500 text-green-400"
          : !connectionMode
          ? darkMode
            ? "bg-orange-600/20 border-orange-500 text-orange-400"
            : " border-orange-500 text-orange-400"
          : darkMode
          ? "bg-red-600/20 border-red-500 text-red-400"
          : " border-red-500 text-red-400"
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
        </div>
      </div>
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
      <div className="h-full w-full flex z-50">
        <div id="Video-Wall-Section" className="w-full h-full flex">
          <div
            id="Monitor"
            className={`block w-full overflow-hidden active:cursor-grabbing relative h-full `}
          >
            <div id="infiniteDiv" style={{ scale: 1 }} className={`xxx w-full h-full relative`}>
              <div id="content" className="absolute w-full h-full top-0 left-0">
                {scenes.map((scene) => (
                  <div
                    key={scene.id}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    id={`containerKonva-${scene.id}`}
                    style={{ display: selectedScene === scene.id ? "block" : "none" }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* === Left Sidebar (full-height with Tabs) === */}
      {!isToggleLayout && (
        <>
          <motion.aside
            className={`fixed left-0 top-0 z-[100] h-screen border-r ${
              darkMode ? "bg-[#1b1f25] border-[#2a2f36]" : "bg-white border-[#e5e7eb]"
            }`}
            style={{ width: 360 }}
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
                <Tab key="resources" title="فایل‌ها" />
                <Tab key="scenes" title="صحنه‌ها" />
                <Tab key="collections" title="برنامه‌ها" />
              </Tabs>

              {/* Tabs Content */}
              <div className="flex-1 p-3">
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
            className={`fixed bottom-5 left-0 w-[30px] h-[30px] text-xl z-[101] min-w-fit p-2 rounded-r-2xl shadow-md
        ${darkMode ? "bg-[#232933] text-white" : "bg-white text-black"}
      `}
            style={{ left: isBottomControlsVisible ? 10 : 10 }}
            onPress={() => setIsBottomControlsVisible(!isBottomControlsVisible)}
            aria-label="toggle-left-panel"
          >
            {isBottomControlsVisible ? "‹" : "›"}
          </Button>

          <motion.div
            className="pointer-events-none"
            style={{ width: 360 }}
            initial={{ width: 0 }}
            animate={{ width: isBottomControlsVisible ? 360 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </>
      )}
      {/* === Right Sidebar (full-height with Tabs) === */}
      {!isToggleLayout && (
        <>
          <motion.aside
            className={`fixed right-0 top-0 z-[100]  h-full border-l ${
              darkMode ? "bg-[#1b1f25] border-[#2a2f36]" : "bg-white border-[#e5e7eb]"
            }`}
            style={{ width: 360 }}
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
            className={`fixed bottom-5 right-0 w-[30px] h-[30px] text-xl z-[101] min-w-fit p-2 rounded-l-2xl shadow-md
        ${darkMode ? "bg-[#232933] text-white" : "bg-white text-black"}
      `}
            style={{ right: isRightControlsVisible ? 10 : 10 }}
            onPress={() => setIsRightControlsVisible(!isRightControlsVisible)}
            aria-label="toggle-right-panel"
          >
            {isRightControlsVisible ? "›" : "‹"}
          </Button>

          {/* Spacer so content doesn’t hide under sidebar */}
          <motion.div
            className="pointer-events-none"
            style={{ width: 360 }}
            initial={{ width: 0 }}
            animate={{ width: isRightControlsVisible ? 360 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </>
      )}

      <div className=" overflow-auto scrollbar-hide flex bottom-0 absolute left-0 right-0 m-auto flex-col p-3 space-y-4">
        {/* Header */}
        <HeaderBar
          toggleLayout={() => {
            localStorage.setItem("layout", !isToggleLayout);
            setIsToggleLayout(!isToggleLayout);
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
