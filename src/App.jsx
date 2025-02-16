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
    sources,
    setSources,
    pendingOperations,
    setPendingOperation,
    flagOperations,
    setFlagOperation,
    resources,
    setResources,
    arrayCollisions,
    counterImages,
    counterVideos,
    getSelectedScene,
    MonitorPositionEditor,
    updateMonitorPosition,
    addMonitorsToScenes,
    generateMonitorsForLayer,
    addVideo,
    addImage,
    addInput,
    addWeb,
    IconMenuSidebar,
    sendOperation,
    createNewStage,
    generateBlobImageURL,
    url,
    anim,
    socket,
    connecting,
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

              const disconnectIcon = group.findOne(".disconnectIcon");
              if (disconnectIcon) disconnectIcon.destroy();
            }
          }
        });

        layer.draw();
        return scene;
      })
    );
  }

  function offDisplays() {
    setScenes((prevScenes) =>
      prevScenes.map((scene) => {
        const { layer } = scene;
        if (!layer) return scene;

        console.log("videoWalls::: ", videoWalls);
        videoWalls?.forEach((display) => {
          const group = layer.findOne(`#monitor-group-${display.id}`);
          console.log("group::: ", group);

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
    if (socket && connecting) {
      console.log("01");
      socket.on("displays-arranged", (e) => {
        setIsLoading(false);
      });
      socket.on("display_error", handleDisplayError);
    } else {
      offDisplays();
    }
  }, [socket, connecting]);

  function trimPrefix(str, prefix) {
    // console.log(`Trimming prefix ${prefix} from ${str}...`);
    if (str.startsWith(prefix)) {
      return str.slice(prefix.length);
    }
    // console.log(`Returning trimmed str ${str}`);
    return str;
  }

  useEffect(() => {
    async function initializeSocket() {
      try {
        if (!connectionMode) {
          return;
        }
        const response = await axios.get("/config.json");
        const data = response.data;
        if (data.host) host = localStorage.getItem("host") ?? data.host;
        if (data.port) port = localStorage.getItem("port") ?? data.port;

        socket = io(`${url}`);

        socket.on("disconnect", () => {
          setConnecting(false);
        });

        socket.on("init", (data) => {
          setIsLoading(false);

          console.log("INIT DATA: ", data);
          if (flagOperations) {
            setFlagOperation(false);
            return;
          }

          if (data.inputs) {
            const inputs = data.inputs.map((item) => ({
              id: item?.deviceId,
              deviceId: item?.deviceId,
              width: item?.width,
              height: item?.height,
              name: item?.label,
              type: "input",
            }));
            setInputs(inputs);
            // setResources([inputs, ...resources]);
          }

          if (data.displays) {
            const displays = data.displays.map((monitor, index) => {
              return {
                ...monitor,
                // numberMonitor: parseInt(monitor.index), // if software have error return this parametr
                id: monitor.id,
                name: monitor.name,
                x: monitor.x,
                y: monitor.y,
                width: monitor.width,
                height: monitor.height,
                connected: monitor.connected,
                monitorUniqId: monitor.monitorUniqId,
                monitorNumber: monitor.monitorNumber,
              };
            });

            setVideoWalls(displays);
            addMonitorsToScenes({ jsonData: displays, scenes, setScenes });
          }

          if (data.sources) {
            const sources = data.sources.map((item) => {
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
                const videoName = "video" + counterVideos++;
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
                name: item.name ?? "",
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
              } else if (type == "iframe") {
                addWeb(endObj, false);
              }
              return endObj;
            });
            setSources(sources);
          }

          //resources
          if (data.files) {
            const newResource = data.files.map((item) => {
              let type;
              let url;
              let endObj = {};
              if (item.endsWith(".jpeg") || item.endsWith(".jpg") || item.endsWith(".png")) {
                url = `http://${host}:${port}/uploads/${item}`;
                type = "image";
                let img = new Image();
                img.src = url;
                let imageName = "imageBase" + counterImages++;
                endObj = {
                  name: item || imageName,
                  imageElement: img,
                };
              } else if (item.endsWith(".mp4")) {
                type = "video";
                url = `http://${host}:${port}/uploads/${item}`;
                const video = document.createElement("video");
                video.src = url;
                const videoName = "videoBase" + counterVideos++;
                video.setAttribute("name", videoName);
                endObj = {
                  videoElement: video,
                  name: item || videoName,
                };
              }

              endObj = {
                ...endObj,
                id: "uploads/" + item,
                fileName: item,
                sceneId: 1,
                type,
                content: url,
                width: 100,
                height: 100,
                x: 0,
                y: 0,
                rotation: 0,
              };

              return endObj;
            });
            setResources(newResource);
            // updateSceneResources([...newResource, ...getSelectedScene().resources]);
          }
        });

        socket.on("update-cameras", (data) => {
          setInputs(data);
        });

        socket.on("connect", () => {
          setConnecting(true);
        });

        const width = window.innerWidth;
        const height = window.innerHeight;
        const stage = new Konva.Stage({
          container: "containerKonva",
          width,
          height,
          draggable: true,
        });

        const layer = new Konva.Layer();
        stage.add(layer);

        anim = new Konva.Animation(() => {}, layer);

        layer.on("dragmove", function (e) {
          var absPos = e.target.absolutePosition();
          e.target.absolutePosition(absPos);

          var target = e.target;
          var targetRect = e.target.getClientRect();
          layer.children.forEach(function (group) {
            if (group === target) return;
            if (haveIntersection(group.getClientRect(), targetRect)) {
              if (group instanceof Konva.Group) {
                const shape = group.findOne(".fillShape");
                if (shape) {
                  shape.stroke("red");
                  let x = arrayCollisions.find((item) => item == shape.getAttr("id"));
                  if (!x) arrayCollisions.push(shape.getAttr("id"));
                }
              }
            } else {
              if (group instanceof Konva.Group) {
                const shape = group.findOne(".fillShape");
                if (shape) {
                  let x = arrayCollisions.find((item) => item == shape.getAttr("id"));
                  if (x) {
                    let y = arrayCollisions.indexOf(x);
                    if (y !== -1) arrayCollisions.splice(y, 1);
                  }
                  shape.stroke("white");
                }
              }
            }
          });

          // let searchIndexArray = e.target.children[0].getAttr("id");
        });

        layer.on("dragend", (e) => {
          layer.find(".guid-line").forEach((l) => l.destroy());
        });
      } catch (err) {
        console.warn("Failed to fetch config.json or initialize socket", err);
      }
    }

    initializeSocket();

    return () => {
      if (socket) socket.disconnect();
      // if (getSelectedScene()?.stageData) getSelectedScene()?.stageData.destroy();
      // if (motherLayer) motherLayer.destroy();
    };
  }, [connectionMode]);

  useEffect(() => {
    if (pendingOperations.length > 0 && connectionMode && socket) {
      socket = io(`http://${host}:${port}`);

      socket.on("connect", () => {
        setConnecting(true);

        if (pendingOperations.length > 0) {
          // const operation = pendingOperations.shift();
          pendingOperations.map((item) => {
            console.log("sending:", item);
            socket.emit(item.action, item.payload);
          });
          setPendingOperation([]);
        }
      });
    }
  }, [connectionMode, socket, pendingOperations]);

  useEffect(() => {
    getSelectedScene()?.resources.forEach((item) => {
      if (item.type === "video") {
        const videoElement = item.videoElement;
        if (videoElement) {
          videoElement.loop = loopVideos[item.id] || false;
        }
      }
    });
  }, [loopVideos, getSelectedScene()?.resources]);

  useEffect(() => {
    const selectedSceneLayer = getSelectedScene()?.layer;

    getSelectedScene()?.stageData?.on("click", (e) => {
      if (e.target === getSelectedScene()?.stageData || e.target.attrs.catFix == "monitor") {
        selectedSceneLayer.find("Transformer").forEach((tr) => tr.detach());

        selectedSceneLayer.find("Group").forEach((group) => {
          group.draggable(false);
        });

        selectedSceneLayer.draw();
      }
    });
  }, [getSelectedScene()?.stageData, getSelectedScene()?.layer]);

  useEffect(() => {
    const selectedScene = getSelectedScene();
    if (!selectedScene || selectedScene.stageData) return;

    const containerId = `containerKonva-${selectedScene.id}`;
    const container = document.getElementById(containerId);

    if (container) {
      const { stage, layer } = createNewStage(selectedScene.layer);
      if (scenes.length > 1 || scenes.length === 0) {
        generateMonitorsForLayer(layer, videoWalls);
      } else {
        anim = new Konva.Animation(() => {}, scenes[0].newLayer);
      }

      setScenes((prevScenes) =>
        prevScenes.map((scene) =>
          scene.id === selectedScene.id
            ? { ...scene, stageData: stage, layer: scene.layer ?? layer }
            : scene
        )
      );
    }
  }, [scenes, selectedScene]);

  return (
    <main
      className={`${
        darkMode ? "bg-[#1E232A]" : "bg-[#e3e4e4]"
      }  h-screen w-full flex flex-col z-50  items-center `}
    >
      {miniLoad && (
        <div className=" z-[1000000] w-fit h-fit flex flex-col gap-3 justify-center items-center  fixed left-0 right-0 top-0 bottom-0  m-auto">
          <CircularProgress label="در حال آپلود لطفا صبر کنید ..." />
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
          {/* <MonitorLayoutModal /> */}
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

      <Modal
        scrollBehavior="outside"
        className=""
        isOpen={activeModal === "resources"}
        onClose={closeModal}
      >
        <ModalContent>
          <ModalBody className="p-0">
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
