import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import config from "../../public/config.json";
import api from "../api/api";
import { deleteSourceFromScene } from "../components/konva/common/deleteSourceFromScene";
import { fitToMonitors } from "../components/konva/common/FitToMonitor";
import { addImage } from "../components/konva/items/image/ImageKonva";
import { addInput } from "../components/konva/items/input/InputKonva";
import {
  LayoutDropdownArrMonitor,
  MonitorLayoutModal,
  MonitorPositionEditor,
  updateKonvaMonitorPosition,
  updateMonitorPosition,
} from "../components/konva/items/monitor/position/MonitorPosition";
import {
  addMonitorsToScenes,
  arrangeMForScenes,
  arrangeMonitors,
  generateMonitorsForLayer,
} from "../components/konva/items/monitor/MonitorKonva";
import { addText, editText } from "../components/konva/items/text/TextKonva";
import {
  addVideo,
  pauseVideo,
  playVideo,
  toggleLoopVideo,
} from "../components/konva/items/video/VideoKonva";
import { addWeb, editWeb } from "../components/konva/items/web/WebKonva";
import { IconMenuSidebar } from "../components/sidebar/common/IconMenuSidebar";

import {
  addScene,
  deleteScene,
  handleEditSceneName,
} from "../components/sidebar/scenes/ScenesCrud";
import { io } from "socket.io-client";
import axios from "axios";

const MyContext = createContext();

export const MyContextProvider = ({ children }) => {
  let anim;

  let host = localStorage.getItem("host") ?? config.host;
  let port = localStorage.getItem("port") ?? config.port;

  // let initSofware = false;

  // INIT DATA Bad-Practice
  let fetchDataScene = [];
  let fetchDataColl = [];

  // States
  const [videoWalls, setVideoWalls] = useState([
    {
      id: 1,
      name: "TV1",
      x: 0,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 12,
      monitorNumber: 13,
    },
    {
      id: 2,
      name: "TV2",
      x: 1440,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 14,
      monitorNumber: 15,
    },
    {
      id: 3,
      name: "TV3",
      x: 0,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 16,
      monitorNumber: 17,
    },
    {
      id: 4,
      name: "TV4",
      x: 1440,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 18,
      monitorNumber: 19,
    },
  ]);

  const [monitorConnection, setMonitorConnection] = useState([]);
  const [initSofware, setInitSoftwaew] = useState(false);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  const [activeModal, setActiveModal] = useState(null);
  const openModal = (modalType) => setActiveModal(modalType);
  const closeModal = () => setActiveModal(null);
  let tempSocket = null;

  const [isToggleLayout, setIsToggleLayout] = useState(
    localStorage.getItem("layout") === "true" ? true : false || false
  );
  const [isRightControlsVisible, setIsRightControlsVisible] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [miniLoad, setMiniLoad] = useState(false);
  const [isToggleVideoWall, setIsToggleVideoWall] = useState(false);
  const [loopVideos, setLoopVideos] = useState({});
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true" ? true : false || false
  );
  const [connecting, setConnecting] = useState(false);
  const [connectionMode, setConnectionMode] = useState(
    localStorage.getItem("onlineMode") === "true" ? true : false || false
  );
  const [inputs, setInputs] = useState([]);
  const videoWallsRef = useRef(videoWalls);
  const connectionModeRef = useRef(connectionMode);
  const [selectedScene, setSelectedScene] = useState(null);
  const selectedSceneRef = useRef(selectedScene);

  const [isBottomControlsVisible, setIsBottomControlsVisible] = useState(true);
  const [editingSceneId, setEditingSceneId] = useState(null);

  //Scheduling Checks...
  const [activeSceneId, setActiveSceneId] = useState(null);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [activeProgram, setActiveProgram] = useState(null);

  const [timeLine, setTimeLine] = useState([]);

  const [collections, setCollections] = useState([]);
  const [scenes, setScenes] = useState([]);
  const scenesRef = useRef(scenes);
  const [url, setUrl] = useState(null);
  const urlRef = useRef(url);

  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(1);
  const [sources, setSources] = useState([]);
  const [pendingOperations, setPendingOperation] = useState([]);
  const [flagOperations, setFlagOperation] = useState(false);
  const [resources, setResources] = useState([]);
  const [flagReset, setFlagReset] = useState(false);
  const [dataDrag, setDataDrag] = useState({});
  const [filteredScenes, setFilteredScenes] = useState([]);

  let arrayCollisions = [];
  let counterImages = 0;
  let counterVideos = 0;
  let allDataMonitors = videoWalls;
  let motherLayer;
  let motherStage;

  // addMonitorsToScenes({ jsonData: videoWalls, scenes: fetchDataScene, setScenes });

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    if (dataDrag.type == "IMAGE") {
      addImage(dataDrag);
    } else if (dataDrag.type == "VIDEO") {
      addVideo(dataDrag);
    } else if (dataDrag.type == "IFRAME") {
      addWeb(dataDrag);
    } else if (dataDrag.type == "INPUT") {
      addInput(dataDrag);
    }
  };

  const getSelectedScene = () => {
    let scn = scenes.find((scene) => scene.id === selectedScene);
    return scn;
  };

  function generateBlobURL(newBaseURL, videoName) {
    const newBlobURL = `${newBaseURL}/uploads/${videoName}.mp4`;

    return newBlobURL;
  }

  function generateBlobImageURL(newBaseURL, videoName) {
    const newBlobURL = `${newBaseURL}/${videoName}.mp4`;

    return newBlobURL;
  }

  function trimPrefix(str, prefix) {
    if (str.startsWith(prefix)) {
      return str.slice(prefix.length);
    }
    return str;
  }

  function contentGenerator(type, item) {
    let endObj;
    if (type === "INPUT") {
      endObj = { name: item.name ?? "INPUT", externalId: item.externalId };
    } else if (type === "IMAGE") {
      const imageURL = `${urlRef.current}/${item.media?.content || item.content}`;
      const img = new Image();
      img.src = imageURL;
      const imageName = "image" + counterImages++;
      endObj = {
        name: item.name ?? imageName,
        imageElement: img,
        externalId: item.externalId,
      };
    } else if (type === "VIDEO") {
      const video = document.createElement("video");
      video.src = `${urlRef.current}/${item.media?.content || item.content}`;
      const videoName = "video" + counterVideos++;
      video.setAttribute("name", videoName);
      video.setAttribute("id", item.id);
      endObj = {
        videoElement: video,
        name: item.name ?? videoName,
        externalId: item.externalId,
      };
    } else if (type === "IFRAME") {
      endObj = { externalId: item.externalId };
    }

    console.log("endObj:::1231 ", endObj);
    endObj = {
      ...endObj,
      id: item.id,
      sceneId: item.sceneId,
      type,
      content: item.media?.content || item.content,
      width: item.width,
      height: item.height,
      x: item.x,
      y: item.y,
      name: item.name ?? "",
      rotation: parseInt(item.rotation) || 0,
    };

    return { endObj, type };
  }

  const removeSource = (id) => {
    const scene = scenesRef.current.find((s) => s.id === selectedSceneRef.current);
    if (!scene) return;
    const toRemove = scene.layer.find(`#${id}`);
    toRemove.forEach((g) => g.destroy());
    scene.layer.draw();
    setSources((prev) => prev.filter((item) => item.externalId !== id));
  };

  const updateSource = (id, attrs) => {
    const scene = scenesRef.current.find(
      (s) => s.id === (attrs?.sceneId ?? selectedSceneRef.current)
    );
    if (!scene) return;

    const group = scene.layer.findOne(`#${id}`);
    if (!group) return;

    if (attrs.x !== undefined || attrs.y !== undefined) {
      group.position({
        x: attrs.x !== undefined ? attrs.x : group.x(),
        y: attrs.y !== undefined ? attrs.y : group.y(),
      });
    }

    const imageNode = group.findOne(".object") || group.findOne("Image");

    if (imageNode && (attrs.width !== undefined || attrs.height !== undefined)) {
      if (attrs.width !== undefined) imageNode.width(attrs.width);
      if (attrs.height !== undefined) imageNode.height(attrs.height);
      group.scale({ x: 1, y: 1 });
    }

    if (attrs.rotation !== undefined) {
      group.rotation(attrs.rotation);
    }

    scene.layer.batchDraw();

    setSources((prev) => prev.map((src) => (src.externalId === id ? { ...src, ...attrs } : src)));
  };

  const handleSourceEvent = useCallback(({ action, payload, id }) => {
    const getScene = () => scenesRef.current.find((s) => s.id === selectedSceneRef.current);
    const scene = getScene();
    if (!scene || !scene.layer) return;
    switch (action) {
      case "add": {
        const { endObj, type } = contentGenerator(payload.type, payload);
        const getSelected = () => getScene();
        if (type === "VIDEO") {
          addVideo({
            videoItem: endObj,
            mode: false,
            getSelectedScene: getSelected,
            setSources,
            sendOperation,
            url: urlRef.current,
            loopVideos,
          });
        } else if (type === "IMAGE") {
          addImage({
            img: endObj,
            mode: false,
            getSelectedScene: getSelected,
            setSources,
            sendOperation,
            url: urlRef.current,
            generateBlobImageURL,
          });
        } else if (type === "INPUT") {
          addInput({
            input: endObj,
            mode: false,
            getSelectedScene: getSelected,
            setSources,
            sendOperation,
          });
        } else if (type === "IFRAME") {
          addWeb({
            webResource: endObj,
            mode: false,
            getSelectedScene: getSelected,
            setSources,
            sendOperation,
          });
        }
        break;
      }
      case "remove":
        removeSource(id);
        break;
      case "update":
      case "move":
      case "resize":
        updateSource(id, payload);
      case "rotate":
        updateSource(id, payload);
        break;
      case "play":
        playVideo(id);
        break;
      case "pause":
        pauseVideo(id);
        break;
      case "loop":
        toggleLoopVideo(id);
        break;
      case "fit":
        fitToMonitors({
          uniqId: id,
          selectedMonitors: payload?.selectedMonitors || [],
          getSelectedScene: getScene,
          allDataMonitors,
          sendOperation,
          id,
        });
        break;
      case "reset":
        console.log("Resetting all sources and the entire driver canvas");
        break;
      default:
        console.log(`Unsupported action ${action}:${id}`, payload);
        break;
    }
  }, []);

  function generateScene(data, sceneData) {
    data.forEach((item) => {
      let { endObj, type } = contentGenerator(item.media?.type, item);

      //Just convert to fuction
      const convertToFunction = () => {
        return sceneData;
      };
      if (type === "IMAGE") {
        addImage({
          img: endObj,
          mode: false,
          getSelectedScene: convertToFunction,
          setSources,
          sendOperation,
          url: urlRef.current,
          generateBlobImageURL,
        });
      } else if (type === "INPUT") {
        addInput({
          input: endObj,
          mode: false,
          getSelectedScene: convertToFunction,
          setSources,
          sendOperation,
        });
      } else if (type === "VIDEO") {
        addVideo({
          videoItem: endObj,
          mode: false,
          getSelectedScene: convertToFunction,
          setSources,
          sendOperation,
          url: urlRef.current,
          loopVideos,
        });
      } else if (type == "IFRAME") {
        addWeb({
          webResource: endObj,
          mode: false,
          getSelectedScene: convertToFunction,
          setSources,
          sendOperation,
        });
      }
    });
  }

  // const filteredScenes = scenes.filter((scene) =>
  //   collections.find((item) => item.id == selectedCollection).scenes.includes(scene.id)
  // );

  const createNewStage = (isLayer) => {
    const stage = new Konva.Stage({
      container: `containerKonva-${selectedScene}`,
      width: window.innerWidth,
      height: window.innerHeight,
      draggable: true,
    });
    const newLayer = new Konva.Layer();

    var scaleBy = 1.04;
    stage.on("wheel", (e) => {
      e.evt.preventDefault();
      var oldScale = stage.scaleX();
      var pointer = stage.getPointerPosition();
      var mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      let direction = e.evt.deltaY > 0 ? -1 : 1;
      if (e.evt.ctrlKey) direction = -direction;
      var newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      stage.scale({ x: newScale, y: newScale });
      var newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      stage.position(newPos);
      localStorage.setItem("wheelX", e.currentTarget.attrs.scaleX);
      localStorage.setItem("wheelY", e.currentTarget.attrs.scaleY);
      localStorage.setItem("positionX", e.currentTarget.attrs.x);
      localStorage.setItem("positionY", e.currentTarget.attrs.y);
    });
    let x = eval(window.innerWidth / 2) - 170;
    let y = eval(window.innerHeight / 2) - 100;
    let oldX = localStorage.getItem("wheelX");
    let oldY = localStorage.getItem("wheelY");
    let oldPX = localStorage.getItem("positionX");
    let oldPY = localStorage.getItem("positionY");

    stage.position({ x: x, y: y });
    stage.scale({ x: 0.25, y: 0.25 });
    // stage.position({ x: parseInt(oldX) ?? 380, y: parseInt(oldY) ?? 200 });
    // stage.scale({ x: parseInt(oldPX) ?? 0.09, y: parseInt(oldPY) ?? 0.09 });

    stage.add(isLayer ?? newLayer);
    motherLayer = newLayer;
    motherStage = stage;
    return { stage, layer: isLayer ?? newLayer };
  };
  const sendOperation = (action, payload) => {
    if (connectionModeRef.current) {
      if (socketRef.current) {
        socketRef.current?.emit(action, payload);
      } else {
        socket?.emit(action, payload);
      }
      // api.createSource(url, payload.payload);
    } else {
      setPendingOperation((prev) => [...prev, { action, payload }]);
    }
  };

  const addTempMonitorToScreen = () => {
    if (!connectionMode || !socketRef.current) {
      console.log(
        "%cCONNECTION DOWN",
        "color: red; font-weight: bold; font-size: 20px; background: yellow; padding: 5px; border: 2px solid red; border-radius: 5px;"
      );
      if (scenesRef.current.length <= 0) {
        console.log("test");
        setScenes([
          {
            name: "صحنه پیش فرض",
            id: 1,
            resources: [],
            stageData: null,
            layer: new Konva.Layer(),
          },
        ]);
        const result = addMonitorsToScenes({
          jsonData: videoWalls,
          scenes: [
            {
              name: "صحنه پیش فرض",
              id: 1,
              resources: [],
              stageData: null,
              layer: new Konva.Layer(),
            },
          ],
          setScenes,
        });
        setScenes(result);
        setSelectedScene(1);
      }
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("host")) {
      localStorage.setItem("host", config.host);
      localStorage.setItem("port", config.port);
    } else {
      host = localStorage.getItem("host");
      port = localStorage.getItem("port");
    }
    const u = `http://${host}:${port}`;
    setUrl(u);
    urlRef.current = u;
  }, [config.host, config.port, localStorage.getItem("host"), localStorage.getItem("port")]);

  useEffect(() => {
    scenesRef.current = scenes;
  }, [scenes]);

  useEffect(() => {
    selectedSceneRef.current = selectedScene;
  }, [selectedScene]);

  useEffect(() => {
    if (!url) {
      return;
    }
    async function initializeSocket() {
      try {
        if (!connectionMode) {
          addTempMonitorToScreen();
          return;
        }

        const response = await axios.get("/config.json");
        const data = response.data;
        if (data.host) host = localStorage.getItem("host") ?? data.host;
        if (data.port) port = localStorage.getItem("port") ?? data.port;

        const s = io(`http://${host}:${port}`);
        socketRef.current = s;
        setSocket(s);

        s.on("source", handleSourceEvent);

        s.on("connect", () => {
          console.log("✅ Socket connected");
          setConnecting(true);

          if (pendingOperations.length > 0) {
            pendingOperations.forEach((op) => s.emit(op.action, op.payload));
            setPendingOperation([]);
          }
        });

        s.on("disconnect", () => {
          setConnecting(false);
        });

        if (!s.connected) addTempMonitorToScreen();
        s.on("source", handleSourceEvent);

        s.on("connect", () => {
          console.log("✅ Socket connected");
        });
        s.on("disconnect", () => {
          setConnecting(false);
        });

        s.on("init", async (data) => {
          setIsLoading(false);
          console.log(
            "%c❇️ CONNECTED INIT DATA",
            "color: green; font-weight: bold; font-size: 20px; background: limegreen; padding: 5px; border: 2px solid green; border-radius: 5px;",
            data
          );

          if (data.activeProgram >= 0) {
            setActiveProgram(data.activeProgram);
          }

          if (flagOperations) {
            setFlagOperation(false);
            return;
          }

          if (data.inputs) {
            const inputs = data.inputs.map((item) => ({
              ...item,
              id: item?.id,
              deviceId: item?.content,
              width: item?.width,
              height: item?.height,
              name: item?.name,
              type: item?.type,
            }));
            setInputs(inputs);
            // setResources([inputs, ...resources]);
          }

          // if (data.mosaicDisplays) {
          //   const displays = data.mosaicDisplays.map((monitor, index) => {
          //     return {
          //       ...monitor,
          //       // numberMonitor: parseInt(monitor.index), // if software have error return this parametr
          //       id: monitor.id,
          //       name: monitor.name,
          //       x: monitor.x,
          //       y: monitor.y,
          //       width: monitor.width,
          //       height: monitor.height,
          //       connected: monitor.connected,
          //       monitorUniqId: monitor.monitorUniqId,
          //       monitorNumber: monitor.monitorNumber,
          //     };
          //   });

          //   await initData();
          //   setVideoWalls(displays);

          //   addMonitorsToScenes({ jsonData: displays, scenes: fetchDataScene, setScenes });
          //   const newScene = await api.getSceneById(`http://${host}:${port}`, fetchDataScene[0].id);
          //   console.log("newScene.sources::: ", newScene.sources);
          //   setSources(newScene.sources);
          //   generateScene(newScene.sources, fetchDataScene[0]);
          // }

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
              };
            });

            await initData();
            setVideoWalls(displays);

            addMonitorsToScenes({ jsonData: displays, scenes: fetchDataScene, setScenes });
            const newScene = await api.getSceneById(`http://${host}:${port}`, fetchDataScene[0].id);
            setSources(newScene.sources);
            generateScene(newScene.sources, fetchDataScene[0]);
            setMonitorConnection(true);
          }

          // if (data.sources && false) {
          //   const sources = data.sources.map((item) => {
          //     let type;
          //     let content;
          //     let endObj = {};
          //     let fixedContent = item.source?.replace(/\\/g, "/");

          //     if (item.source?.startsWith("input:")) {
          //       type = "input";
          //       content = trimPrefix(item.source, "input:");
          //       endObj = { name: item.name ?? "input", deviceId: content };
          //     } else if (item.source?.startsWith("image:")) {
          //       type = "image";
          //       content = trimPrefix(item.source, "image:");
          //       const imageURL = content;
          //       let img = new Image();
          //       img.src = imageURL;
          //       let imageName = "image" + counterImages++;
          //       endObj = {
          //         name: item.name ?? imageName,
          //         imageElement: img,
          //       };
          //     } else if (item.source?.startsWith("video:")) {
          //       type = "video";
          //       content = trimPrefix(item.source, "video:");
          //       const video = document.createElement("video");
          //       video.src = content;
          //       const videoName = "video" + counterVideos++;
          //       video.setAttribute("name", videoName);
          //       video.setAttribute("id", item.id);
          //       endObj = {
          //         videoElement: video,
          //         name: item.name ?? videoName,
          //       };
          //     } else if (item.source.startsWith("iframe:")) {
          //       type = "iframe";
          //       content = trimPrefix(item.source, "iframe:");
          //     }

          //     endObj = {
          //       ...endObj,
          //       id: item.id,
          //       sceneId: selectedScene,
          //       type,
          //       content: type === "input" ? content : fixedContent,
          //       width: item.width,
          //       height: item.height,
          //       x: item.x,
          //       y: item.y,
          //       name: item.name ?? "",
          //       rotation: parseInt(item.rotation),
          //     };

          //     if (type === "image") {
          //       addImage({
          //         img: endObj,
          //         mode: false,
          //         getSelectedScene,
          //         setSources,
          //         sendOperation,
          //         url,
          //         generateBlobImageURL,
          //       });
          //     } else if (type === "input") {
          //       addInput({
          //         input: endObj,
          //         mode: false,
          //         getSelectedScene,
          //         setSources,
          //         sendOperation,
          //       });
          //     } else if (type === "video") {
          //       addVideo({
          //         videoItem: endObj,
          //         mode: false,
          //         getSelectedScene,
          //         setSources,
          //         sendOperation,
          //         url,
          //         loopVideos,
          //       });
          //       // addRectangle();
          //     } else if (type == "iframe") {
          //       addWeb({ webResource: endObj, mode: false, getSelectedScene, setSources });
          //     }
          //     return endObj;
          //   });
          //   setSources(sources);
          // }

          //resources
          if (data.media) {
            const newResource = data.media
              .map((item) => {
                let type;
                let url;
                let endObj = {};
                if (item.type === "INPUT") {
                  return null;
                }
                if (
                  item.content.endsWith(".jpeg") ||
                  item.content.endsWith(".jpg") ||
                  item.content.endsWith(".png") ||
                  item.content.endsWith(".webp")
                ) {
                  url = `http://${host}:${port}/${item.content}`;
                  type = "IMAGE";
                  let img = new Image();
                  img.src = url;
                  let imageName = "imageBase" + counterImages++;
                  endObj = {
                    imageElement: img,
                  };
                } else if (item.content.endsWith(".mp4")) {
                  type = "VIDEO";
                  url = `http://${host}:${port}/${item.content}`;
                  const video = document.createElement("video");
                  video.src = url;
                  const videoName = "videoBase" + counterVideos++;
                  video.setAttribute("name", videoName);
                  endObj = {
                    videoElement: video,
                  };
                } else {
                  type = "IFRAME";
                }

                let dataOBJ = {
                  ...item,
                  name: item.name || "نامشخص",
                  type: type,
                  ...endObj,
                };

                return dataOBJ;
              })
              .filter((item) => item !== null);

            setResources(newResource);
            // updateSceneResources([...newResource, ...getSelectedScene().resources]);
          }
        });

        // s.on("currentScene", (e) => {
        //   console.log(e);
        // });

        // s.on("source", (e) => {
        //   console.log("incoming", e);
        //   // initializeSocket();
        // });

        s.on("update-cameras", (data) => {
          setInputs(data);
        });

        s.on("connect", () => {
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
        console.warn("Failed to fetch config.json or initialize s", err);
      }
    }

    async function initData() {
      try {
        setIsLoading(true);
        const dataCol = await api.getPrograms(url);
        fetchDataColl = dataCol;
        setCollections(dataCol ?? []);
        setSelectedCollection(fetchDataColl[0]?.id);

        const dataSen = await api.getScenes(url);
        fetchDataScene =
          dataSen?.map((item) => ({
            name: item.name,
            id: item.id,
            resources: [],
            stageData: null,
            layer: new Konva.Layer(),
          })) ?? [];
        if (fetchDataScene.length >= 0) {
          setScenes(fetchDataScene);
        } else {
          setScenes({
            name: "صحنه پیش فرض",
            id: 0,
            resources: [],
            stageData: null,
            layer: new Konva.Layer(),
          });
        }

        const selectedScene = fetchDataScene[0];
        setSelectedScene(fetchDataScene[0].id);
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    }

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.off("source", handleSourceEvent);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // if (getSelectedScene()?.stageData) getSelectedScene()?.stageData.destroy();
      // if (motherLayer) motherLayer.destroy();
    };
  }, [connectionMode, url]);

  useEffect(() => {
    const selectedScene = getSelectedScene();
    if (!selectedScene || selectedScene.stageData) return;
    const containerId = `containerKonva-${selectedScene.id}`;
    const container = document.getElementById(containerId);
    if (container) {
      const { stage, layer } = createNewStage(selectedScene.layer);
      if ((scenes.length > 1 || scenes.length === 0) && initSofware) {
        generateMonitorsForLayer(layer, videoWalls, setMonitorConnection);
      } else {
        setInitSoftwaew(true);
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
  }, [selectedScene, initSofware]);

  useEffect(() => {
    if (!collections.length) {
      return;
    }
    const selectedCollectionObj = collections.find((c) => c.id == selectedCollection);
    if (!selectedCollectionObj)
      return console.warn(
        "No collection selected!",
        selectedCollectionObj,
        selectedCollection,
        collections
      );
    const selectedCollectionScenes = selectedCollectionObj?.schedules?.map((s) => ({
      ...s.scene,
      resources: [],
      stageData: null,
      layer: new Konva.Layer(),
    }));
    setFilteredScenes(
      selectedCollectionScenes
      // scenes.filter((scene) =>
      //   collections.find((item) => item.id == selectedCollection)?.scenes?.includes(scene.id)
      // )
    );
  }, [collections, selectedCollection, flagReset]);

  return (
    <MyContext.Provider
      value={{
        host,
        port,
        videoWalls,
        setVideoWalls,
        monitorConnection,
        setMonitorConnection,
        activeModal,
        setActiveModal,
        openModal,
        closeModal,
        isToggleLayout,
        setIsToggleLayout,
        isLoading,
        setIsLoading,
        miniLoad,
        setMiniLoad,
        isToggleVideoWall,
        setIsToggleVideoWall,
        loopVideos,
        setLoopVideos,
        darkMode,
        setDarkMode,
        connecting,
        setConnecting,
        connectionMode,
        setConnectionMode,
        inputs,
        setInputs,
        scenes,
        setScenes,
        scenesRef,
        videoWallsRef,
        connectionModeRef,
        selectedScene,
        setSelectedScene,
        isBottomControlsVisible,
        setIsBottomControlsVisible,
        editingSceneId,
        setEditingSceneId,
        collections,
        setCollections,
        selectedCollection,
        setSelectedCollection,
        sources,
        setSources,
        pendingOperations,
        setPendingOperation,
        flagOperations,
        setFlagOperation,
        resources,
        setResources,
        filteredScenes,
        arrayCollisions,
        counterImages,
        counterVideos,
        allDataMonitors,
        getSelectedScene,
        url,
        flagReset,
        setFlagReset,
        generateBlobURL,
        generateBlobImageURL,
        LayoutDropdownArrMonitor,
        MonitorLayoutModal,
        MonitorPositionEditor,
        updateKonvaMonitorPosition,
        updateMonitorPosition,

        isRightControlsVisible,
        setIsRightControlsVisible,

        addMonitorsToScenes,
        arrangeMForScenes,
        arrangeMonitors,
        generateMonitorsForLayer,

        addVideo,
        pauseVideo,
        playVideo,
        toggleLoopVideo,

        addScene,
        deleteScene,
        handleEditSceneName,
        deleteSourceFromScene,
        fitToMonitors,
        addImage,
        addInput,
        addText,
        editText,
        addWeb,
        editWeb,
        IconMenuSidebar,
        createNewStage,
        sendOperation,
        socket,
        anim,
        trimPrefix,
        generateScene,

        activeSceneId,
        setActiveSceneId,
        activeSchedule,
        setActiveSchedule,
        activeProgram,
        setActiveProgram,

        setFilteredScenes,

        timeLine,
        setTimeLine,
        motherLayer,

        selectedSource,
        setSelectedSource,

        handleDragOver,
        handleDrop,

        dataDrag,
        setDataDrag,
      }}
    >
      {children}
    </MyContext.Provider>
  );
};

export const MCPC = ({ children }) => {
  return <MyContext.Consumer>{children}</MyContext.Consumer>;
};

export const useMyContext = () => {
  return useContext(MyContext);
};
