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
import { addText } from "../components/konva/items/text/TextKonva";
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
    // --- Row 1 ---
    {
      id: 1,
      name: "TV1",
      x: 0,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 101,
      monitorNumber: 1,
    },
    {
      id: 2,
      name: "TV2",
      x: 1440,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 102,
      monitorNumber: 2,
    },
    {
      id: 3,
      name: "TV3",
      x: 2880,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 103,
      monitorNumber: 3,
    },
    {
      id: 4,
      name: "TV4",
      x: 4320,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 104,
      monitorNumber: 4,
    },
    {
      id: 5,
      name: "TV5",
      x: 5760,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 105,
      monitorNumber: 5,
    },
    {
      id: 6,
      name: "TV6",
      x: 7200,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 106,
      monitorNumber: 6,
    },
    {
      id: 7,
      name: "TV7",
      x: 8640,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 107,
      monitorNumber: 7,
    },
    {
      id: 8,
      name: "TV8",
      x: 10080,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 108,
      monitorNumber: 8,
    },

    // --- Row 2 ---
    {
      id: 9,
      name: "TV9",
      x: 0,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 109,
      monitorNumber: 9,
    },
    {
      id: 10,
      name: "TV10",
      x: 1440,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 110,
      monitorNumber: 10,
    },
    {
      id: 11,
      name: "TV11",
      x: 2880,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 111,
      monitorNumber: 11,
    },
    {
      id: 12,
      name: "TV12",
      x: 4320,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 112,
      monitorNumber: 12,
    },
    {
      id: 13,
      name: "TV13",
      x: 5760,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 113,
      monitorNumber: 13,
    },
    {
      id: 14,
      name: "TV14",
      x: 7200,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 114,
      monitorNumber: 14,
    },
    {
      id: 15,
      name: "TV15",
      x: 8640,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 115,
      monitorNumber: 15,
    },
    {
      id: 16,
      name: "TV16",
      x: 10080,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 116,
      monitorNumber: 16,
    },

    // --- Row 3 ---
    {
      id: 17,
      name: "TV17",
      x: 0,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 117,
      monitorNumber: 17,
    },
    {
      id: 18,
      name: "TV18",
      x: 1440,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 118,
      monitorNumber: 18,
    },
    {
      id: 19,
      name: "TV19",
      x: 2880,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 119,
      monitorNumber: 19,
    },
    {
      id: 20,
      name: "TV20",
      x: 4320,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 120,
      monitorNumber: 20,
    },
    {
      id: 21,
      name: "TV21",
      x: 5760,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 121,
      monitorNumber: 21,
    },
    {
      id: 22,
      name: "TV22",
      x: 7200,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 122,
      monitorNumber: 22,
    },
    {
      id: 23,
      name: "TV23",
      x: 8640,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 123,
      monitorNumber: 23,
    },
    {
      id: 24,
      name: "TV24",
      x: 10080,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 124,
      monitorNumber: 24,
    },

    // --- Row 4 ---
    {
      id: 25,
      name: "TV25",
      x: 0,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 125,
      monitorNumber: 25,
    },
    {
      id: 26,
      name: "TV26",
      x: 1440,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 126,
      monitorNumber: 26,
    },
    {
      id: 27,
      name: "TV27",
      x: 2880,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 127,
      monitorNumber: 27,
    },
    {
      id: 28,
      name: "TV28",
      x: 4320,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 128,
      monitorNumber: 28,
    },
    {
      id: 29,
      name: "TV29",
      x: 5760,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 129,
      monitorNumber: 29,
    },
    {
      id: 30,
      name: "TV30",
      x: 7200,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 130,
      monitorNumber: 30,
    },
    {
      id: 31,
      name: "TV31",
      x: 8640,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 131,
      monitorNumber: 31,
    },
    {
      id: 32,
      name: "TV32",
      x: 10080,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 132,
      monitorNumber: 32,
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
  const [isChangeRealTime, setIsChangeRealTime] = useState("Cancle");
  const [dataChangeRealTime, setDataChangeRealTime] = useState([]);
  const [isRealTime, setIsRealTime] = useState(true);
  const isRealTimeRef = useRef(isRealTime);

  const [isRunFitStage, setIsRunFitStage] = useState(false);

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

  function getContentPointerFromDomEvent(stage, evt) {
    const ne = evt?.nativeEvent ?? evt;
    if (!ne) return null;

    stage.setPointersPositions({ clientX: ne.clientX, clientY: ne.clientY });

    const p = stage.getPointerPosition(); // مختصات روی کانواس نمایش (screen coords)
    if (!p) return null;

    const inv = stage.getAbsoluteTransform().copy().invert();
    return inv.point(p); // {x, y} در فضای محتوای استیج
  }

  function forcePlaceById({ layer, id, x, y, center = false }) {
    requestAnimationFrame(() => {
      // گروه را پیدا کن
      const g = layer.findOne(`#${id}`) || layer.findOne(`[id="${id}"]`) || layer.findOne(`.${id}`);
      if (!g) return;

      if (center) {
        // اگر می‌خواهی مرکز شیء زیر موس بیفتد:
        const node = g.findOne(".object") || g.findOne("Image") || g.findOne("Rect") || g;
        const w = (node.width?.() ?? 0) * (g.scaleX?.() ?? 1);
        const h = (node.height?.() ?? 0) * (g.scaleY?.() ?? 1);
        g.absolutePosition({ x: x - w / 2, y: y - h / 2 });
      } else {
        // گوشه‌ی بالا-چپ دقیقا زیر موس
        g.absolutePosition({ x, y });
      }

      g.getLayer()?.batchDraw();
    });
  }

  // 3) یک کمک کوچک برای درآوردن id بیرونیِ آیتمِ درَگ شده
  function pickExternalId(payload) {
    // بسته به ساختار شما:
    return (
      payload?.externalId ||
      payload?.id ||
      payload?.img?.externalId ||
      payload?.videoItem?.externalId ||
      payload?.webResource?.externalId ||
      payload?.input?.externalId
    );
  }

  // ---- handler اصلی
  const handleDrop = (e) => {
    e.preventDefault();

    const scn = getSelectedScene();
    const stage = scn?.stageData;
    const layer = scn?.layer;
    if (!stage || !layer) return;

    if (e.nativeEvent) stage.setPointersPositions(e.nativeEvent);

    let screenPt = stage.getPointerPosition();
    if (!screenPt) {
      const rect = stage.container().getBoundingClientRect();
      screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    const inv = stage.getAbsoluteTransform().copy().invert();
    const contentPt = inv.point(screenPt);
    const baseSceneId = scn.id;

    if (dataDrag.type === "IMAGE" && dataDrag.img) {
      addImage({
        ...dataDrag,
        img: { ...dataDrag.img, x: contentPt.x, y: contentPt.y, sceneId: baseSceneId },
      });
    } else if (dataDrag.type === "VIDEO" && dataDrag.videoItem) {
      addVideo({
        ...dataDrag,
        videoItem: { ...dataDrag.videoItem, x: contentPt.x, y: contentPt.y, sceneId: baseSceneId },
      });
    } else if (dataDrag.type === "IFRAME" && dataDrag.webResource) {
      addWeb({
        ...dataDrag,
        webResource: {
          ...dataDrag.webResource,
          x: contentPt.x,
          y: contentPt.y,
          sceneId: baseSceneId,
        },
      });
    } else if (dataDrag.type === "INPUT" && dataDrag.input) {
      addInput({
        ...dataDrag,
        input: { ...dataDrag.input, x: contentPt.x, y: contentPt.y, sceneId: baseSceneId },
      });
    } else if (dataDrag.type === "TEXT" && dataDrag.textItem) {
      addText({
        ...dataDrag,
        textItem: { ...dataDrag.textItem, x: contentPt.x, y: contentPt.y, sceneId: baseSceneId },
      });
    }
  };

  // --- helper: تبدیل مختصات client به مختصات استیج
  function clientToStagePoint(stage, evtOrReactEvent) {
    const ev = evtOrReactEvent?.nativeEvent ?? evtOrReactEvent;
    const rect = stage.container().getBoundingClientRect();
    const clientX = ev?.clientX ?? 0;
    const clientY = ev?.clientY ?? 0;

    // نقطه در مختصات «کانتینر»
    const point = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    // اعمال اسکیل و ترنسلیت استیج
    const transform = stage.getAbsoluteTransform().copy();
    const inv = transform.invert();
    return inv.point(point);
  }

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

  const updateSourceRealTime = (id, attrs) => {
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

    const imageNode = group.findOne("Image");
    const rectNode = group.findOne("Rect");

    if (imageNode && (attrs.width !== undefined || attrs.height !== undefined)) {
      if (attrs.width !== undefined) imageNode.width(attrs.width);
      if (attrs.height !== undefined) imageNode.height(attrs.height);
      group.scale({ x: 1, y: 1 });
    }

    if (rectNode && (attrs.width !== undefined || attrs.height !== undefined)) {
      if (attrs.width !== undefined) rectNode.width(attrs.width);
      if (attrs.height !== undefined) rectNode.height(attrs.height);
      group.scale({ x: 1, y: 1 });
    }

    if (attrs.rotation !== undefined) {
      group.rotation(attrs.rotation);
    }

    scene.layer.batchDraw();

    setSources((prev) => prev.map((src) => (src.externalId === id ? { ...src, ...attrs } : src)));
  };

  const handleSourceEvent = useCallback(({ action, payload, id }) => {
    if (isRealTimeRef.current) {
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
          updateSourceRealTime(id, payload);
        case "rotate":
          updateSourceRealTime(id, payload);
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
    } else {
      setIsChangeRealTime("Yes");
      setDataChangeRealTime((prev) => [...prev, { action, payload, id }]);
    }
  }, []);

  useEffect(() => {
    if (isRealTime) return;
    if (isChangeRealTime === "Done" && dataChangeRealTime.length) {
      const getScene = () => scenesRef.current.find((s) => s.id === selectedSceneRef.current);
      const scene = getScene();
      if (!scene || !scene.layer) return;
      for (const { action, payload, id } of dataChangeRealTime) {
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
            updateSourceRealTime(id, payload);
            break;
          case "rotate":
            updateSourceRealTime(id, payload);
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
        setDataChangeRealTime([]);
        setIsChangeRealTime("Cancle");
      }
    } else if (isChangeRealTime === "Cancle") {
      // رد کردن تغییرات
      setDataChangeRealTime([]);
    }
  }, [isChangeRealTime, dataChangeRealTime, isRealTime]);

  useEffect(() => {
    isRealTimeRef.current = isRealTime;
  }, [isRealTime]);

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

  function fitStageToMonitors({ stage, monitors, padding = 40, clampTo1 = true }) {
    if (!stage || !monitors?.length) return;

    // 0) اندازه‌ی واقعی استیج را از DOM بگیر (گاهی stage.width/height قدیمی است)
    const rect = stage.container().getBoundingClientRect();
    const viewW = Math.max(1, rect.width);
    const viewH = Math.max(1, rect.height);
    if (
      Math.round(stage.width()) !== Math.round(viewW) ||
      Math.round(stage.height()) !== Math.round(viewH)
    ) {
      stage.size({ width: viewW, height: viewH });
    }

    // 1) BBox کل مانیتورها
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const m of monitors) {
      if (m.x < minX) minX = m.x;
      if (m.y < minY) minY = m.y;
      if (m.x + m.width > maxX) maxX = m.x + m.width;
      if (m.y + m.height > maxY) maxY = m.y + m.height;
    }
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);

    // 2) مقیاس لازم برای جا شدن داخل "inner view" با درنظر گرفتن padding از هر طرف
    const innerW = Math.max(1, viewW - 2 * padding);
    const innerH = Math.max(1, viewH - 2 * padding);
    let scale = Math.min(innerW / contentW, innerH / contentH);
    if (clampTo1) scale = Math.min(scale, 1); // بزرگ‌نمایی بیش از ۱ نکن

    // 3) مرکز محتوا و مرکز ویو
    const contentCenter = { x: (minX + contentW / 2) * scale, y: (minY + contentH / 2) * scale };
    const viewCenter = { x: viewW / 2, y: viewH / 2 };

    // 4) اعمال اسکیل و جابه‌جایی برای هم‌مرکز کردن
    stage.scale({ x: scale, y: scale });
    stage.position({
      x: viewCenter.x - contentCenter.x,
      y: viewCenter.y - contentCenter.y,
    });

    stage.batchDraw();
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
    let x = eval(window.innerWidth / 2);
    let y = eval(window.innerHeight / 2);
    let oldX = localStorage.getItem("wheelX");
    let oldY = localStorage.getItem("wheelY");
    let oldPX = localStorage.getItem("positionX");
    let oldPY = localStorage.getItem("positionY");

    stage.position({ x: x, y: y });
    stage.scale({ x: 0.35, y: 0.35 });
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

  function getGridCellAtPointer(layer, pointer) {
    if (!layer || !pointer) return null;

    // شکلی که زیر پوینتره
    const target = layer.getStage().getIntersection(pointer);
    if (!target) return null;

    // رفتن به بالا تا برسیم به گروپ مانیتور
    let group = target.getParent();
    while (
      group &&
      !(group.getClassName() === "Group" && String(group.id()).startsWith("monitor-group-"))
    ) {
      group = group.getParent();
    }
    if (!group) return null;

    const gridMeta = group.getAttr("gridMeta");
    if (!gridMeta?.rows || !gridMeta?.cols) return null;

    const rect = group.findOne("Rect");
    if (!rect) return null;

    // تبدیل مختصات pointer به لوکال مانیتور
    const abs = group.getAbsoluteTransform().copy();
    const inv = abs.invert();

    const local = inv.point(pointer); // pointer در مختصات خود مانیتور
    const { rows, cols } = gridMeta;
    const cellW = rect.width() / cols;
    const cellH = rect.height() / rows;

    // ایندکس سطر/ستون
    const ci = Math.floor(local.x / cellW);
    const ri = Math.floor(local.y / cellH);
    if (ci < 0 || ci >= cols || ri < 0 || ri >= rows) return null;

    const cellLocal = { x: ci * cellW, y: ri * cellH, width: cellW, height: cellH };

    const cellTLAbs = abs.point({ x: cellLocal.x, y: cellLocal.y });
    const cellBRAbs = abs.point({
      x: cellLocal.x + cellLocal.width,
      y: cellLocal.y + cellLocal.height,
    });

    return {
      monitorGroup: group,
      rows,
      cols,
      rowIndex: ri,
      colIndex: ci,
      // مستطیل سلول در مختصات لایه/استیج:
      rect: {
        x: cellTLAbs.x,
        y: cellTLAbs.y,
        width: cellBRAbs.x - cellTLAbs.x,
        height: cellBRAbs.y - cellTLAbs.y,
      },
    };
  }

  function fitGroupToRect(sourceGroup, cellRect) {
    if (!sourceGroup || !cellRect) return;

    // جابه‌جایی خود گروه
    sourceGroup.position({ x: cellRect.x, y: cellRect.y });

    // تغییر اندازه نود محتوایی داخل گروه (Image/Rect/Video-Rect/...)
    const contentNode =
      sourceGroup.findOne(".object") || sourceGroup.findOne("Image") || sourceGroup.findOne("Rect");

    if (contentNode) {
      contentNode.width(cellRect.width);
      contentNode.height(cellRect.height);
    }

    // هرگونه scale قبلی رو خنثی کن
    sourceGroup.scale({ x: 1, y: 1 });
  }

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
            requestAnimationFrame(() => {
              const scn = scenesRef.current.find((s) => s.id === selectedSceneRef.current);
              if (scn?.stageData) {
                fitStageToMonitors({
                  stage: scn.stageData,
                  monitors: displays,
                });
              }
            });
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

  useEffect(() => {
    const scn = getSelectedScene();
    if (!scn?.stageData) return;
    if (!videoWalls?.length) return;
    if (isRunFitStage) return;
    setIsRunFitStage(true);
    fitStageToMonitors({
      stage: scn.stageData,
      monitors: videoWalls,
    });
  }, [selectedScene, videoWalls, scenes]);

  useEffect(() => {
    const scn = getSelectedScene();
    if (!scn?.stageData) return;

    const onResize = () => {
      fitStageToMonitors({
        stage: scn.stageData,
        monitors: videoWalls,
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [selectedScene, videoWalls]);

  useEffect(() => {
    const scn = getSelectedScene();
    if (!scn?.stageData) return;

    fitStageToMonitors({
      stage: scn.stageData,
      monitors: videoWalls,
    });
  }, [selectedSceneRef.current]);
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

        fitStageToMonitors,
        selectedSceneRef,

        isChangeRealTime,
        setIsChangeRealTime,
        isRealTime,
        setIsRealTime,
        contentGenerator,
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
