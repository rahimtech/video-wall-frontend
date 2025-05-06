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
  Tooltip,
  useDisclosure,
  useDraggable,
} from "@nextui-org/react";
import { FaAngleDown, FaAngleUp, FaTools, FaCogs, FaFileAlt, FaVideo } from "react-icons/fa";
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

    pendingOperations,
    setPendingOperation,
    flagOperations,
    setFlagOperation,

    getSelectedScene,
    MonitorPositionEditor,
    updateMonitorPosition,

    IconMenuSidebar,

    socket,
    connecting,
    trimPrefix,
    monitorConnection,
    setMonitorConnection,
    setSelectedSource,
    selectedSource,
  } = useMyContext();

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
            } else {
              if (rect) rect.fill("#161616");
              if (text) text.setAttr("text", `Monitor ${display.id}`);
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
    console.log("test");
    if (socket && connecting && connectionMode) {
      socket.on("displays-arranged", (e) => {
        setIsLoading(false);
      });
      socket.on("display_error", handleDisplayError);
    } else {
      offDisplays();
    }
  }, [socket, connecting, connectionMode]);

  useEffect(() => {
    if (pendingOperations.length > 0 && connectionMode && socket) {
      socket = io(`http://${host}:${port}`);

      socket.on("connect", () => {
        setConnecting(true);

        if (pendingOperations.length > 0) {
          // const operation = pendingOperations.shift();
          pendingOperations.map((item) => {
            socket.emit(item.action, item.payload);
          });
          setPendingOperation([]);
        }
      });
    }
  }, [connectionMode, socket, pendingOperations]);

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
      {miniLoad && (
        <div className=" z-[1000000] w-fit h-fit flex flex-col gap-3 justify-center items-center  fixed left-0 right-0 top-0 bottom-0  m-auto">
          <CircularProgress label="در حال انجام عملیات ..." />
        </div>
      )}

      {isLoading && (
        <div className="w-full z-[1000000] flex flex-col gap-3 justify-center items-center h-screen fixed left-0 right-0 top-0 bottom-0  m-auto backdrop-blur-[5px]">
          <Spinner size="lg" />
          <div className={`vazirblack  ${darkMode ? "text-white" : "text-black"}`}>
            لطفا صبر کنید عملیات در حال انجام است
          </div>
        </div>
      )}
      <HeaderBar
        toggleLayout={() => {
          localStorage.setItem("layout", !isToggleLayout);
          setIsToggleLayout(!isToggleLayout);
        }}
      />
      {isToggleVideoWall && videoWalls.length > 0 && (
        <div className="flex flex-col absolute right-0 m-4 gap-3 ">
          <MonitorLayoutModal />

          <MonitorPositionEditor
            monitors={videoWalls}
            updateMonitorPosition={updateMonitorPosition}
          />
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
                    id={`containerKonva-${scene.id}`}
                    style={{ display: selectedScene === scene.id ? "block" : "none" }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isToggleLayout ? (
        <motion.div
          className="absolute top-0 left-[-20px] z-[100]"
          style={{ backgroundColor: darkMode ? "#222" : "#fff" }}
          animate={{ x: "20px" }}
          transition={{ duration: 0.2 }}
        >
          <IconMenuSidebar openModal={openModal} />
        </motion.div>
      ) : (
        <>
          <motion.div
            className={`grid grid-cols-4 gap-[10px] p-[10px] w-full h-[350px] border-t overflow-y-auto items-center ${
              darkMode ? "" : "shadow-custome"
            } `}
            style={{ backgroundColor: darkMode ? "#222" : "#fff" }}
            animate={{
              height: isBottomControlsVisible ? "350px" : "0px",
              padding: isBottomControlsVisible ? "10px" : "0px",
            }}
            transition={{ duration: 0.5 }}
          >
            {isBottomControlsVisible && (
              <>
                <UsageSidebar />
                <ResourcesSidebar />
                <ScenesSidebar />

                <CollectionsSidebar />
              </>
            )}
          </motion.div>
          {/* Toggle Bottom Controls Button */}
          <div className="absolute right-0 bottom-0 transform -translate-x-1/2 mb-2 z-[100]">
            <Button
              auto
              ghost
              className="min-w-fit h-fit p-2"
              onPress={() => setIsBottomControlsVisible(!isBottomControlsVisible)}
            >
              {isBottomControlsVisible ? <FaAngleDown /> : <FaAngleUp />}
            </Button>
          </div>
        </>
      )}

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
