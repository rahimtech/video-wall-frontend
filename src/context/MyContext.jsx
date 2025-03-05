import React, { createContext, useContext, useEffect, useRef, useState } from "react";
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
  const [videoWalls, setVideoWalls] = useState([]);
  const [monitorConnection, setMonitorConnection] = useState([]);
  const [initSofware, setInitSoftwaew] = useState(false);
  const [socket, setSocket] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const openModal = (modalType) => setActiveModal(modalType);
  const closeModal = () => setActiveModal(null);
  let tempSocket = null;

  const [isToggleLayout, setIsToggleLayout] = useState(
    localStorage.getItem("layout") === "true" ? true : false || false
  );
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
  const [isBottomControlsVisible, setIsBottomControlsVisible] = useState(true);
  const [editingSceneId, setEditingSceneId] = useState(null);

  //Scheduling Checks ...
  const [activeSceneId, setActiveSceneId] = useState(null);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [activeProgram, setActiveProgram] = useState(null);

  const [collections, setCollections] = useState([]);
  const [scenes, setScenes] = useState([]);
  const scenesRef = useRef(scenes);
  const [url, setUrl] = useState(null);

  const [selectedCollection, setSelectedCollection] = useState(1);
  const [sources, setSources] = useState([]);
  const [pendingOperations, setPendingOperation] = useState([]);
  const [flagOperations, setFlagOperation] = useState(false);
  const [resources, setResources] = useState([]);
  const [flagReset, setFlagReset] = useState(false);

  const [filteredScenes, setFilteredScenes] = useState([]);

  let arrayCollisions = [];
  let counterImages = 0;
  let counterVideos = 0;
  let allDataMonitors = videoWalls;
  let motherLayer;
  let motherStage;

  const getSelectedScene = () => {
    return scenes.find((scene) => scene.id === selectedScene);
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

  function generateScene(data, sceneData) {
    const sceneDataFuncConvertor = () => {
      return sceneData;
    };
    data.forEach((item) => {
      let type;
      let content;
      let endObj = {};

      if (item.media?.type == "INPUT") {
        type = "INPUT";
        content = item.media.content;
        endObj = { name: item.name ?? "INPUT", externalId: item.externalId };
      } else if (item.media?.type == "IMAGE") {
        type = "IMAGE";
        content = item.media.content;
        const imageURL = `${url}/${content}`;
        let img = new Image();
        img.src = imageURL;
        let imageName = "image" + counterImages++;
        endObj = {
          name: item.name ?? imageName,
          imageElement: img,
          externalId: item.externalId,
        };
      } else if (item.media?.type == "VIDEO") {
        type = "VIDEO";
        content = item.media.content;
        const video = document.createElement("video");
        video.src = `${url}/${item.media.content}`;
        const videoName = "video" + counterVideos++;
        video.setAttribute("name", videoName);
        video.setAttribute("id", item.id);
        endObj = {
          videoElement: video,
          name: item.name ?? videoName,
          externalId: item.externalId,
        };
      } else if (item.media?.type == "IFRAME") {
        type = "IFRAME";
        content = item.media.content;
        endObj = {
          externalId: item.externalId,
        };
      }

      endObj = {
        ...endObj,
        id: item.id,
        sceneId: item.sceneId,
        type,
        content: item.media.content,
        width: item.width,
        height: item.height,
        x: item.x,
        y: item.y,
        name: item.name ?? "",
        rotation: parseInt(item.rotation),
      };

      if (type === "IMAGE") {
        addImage({
          img: endObj,
          mode: false,
          getSelectedScene: sceneDataFuncConvertor,
          setSources,
          sendOperation,
          url,
          generateBlobImageURL,
        });
      } else if (type === "INPUT") {
        addInput({
          input: endObj,
          mode: false,
          getSelectedScene: sceneDataFuncConvertor,
          setSources,
          sendOperation,
        });
      } else if (type === "VIDEO") {
        addVideo({
          videoItem: endObj,
          mode: false,
          getSelectedScene: sceneDataFuncConvertor,
          setSources,
          sendOperation,
          url,
          loopVideos,
        });
      } else if (type == "IFRAME") {
        addWeb({
          webResource: endObj,
          mode: false,
          getSelectedScene: sceneDataFuncConvertor,
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
    });

    stage.position({ x: 380, y: 200 });
    stage.scale({ x: 0.09, y: 0.09 });

    stage.add(isLayer ?? newLayer);
    motherLayer = newLayer;
    motherStage = stage;
    return { stage, layer: isLayer ?? newLayer };
  };

  const sendOperation = (action, payload) => {
    console.log("action::: ", action);
    console.log("payload::: ", payload);

    if (connectionModeRef.current) {
      if (tempSocket) {
        tempSocket?.emit(action, payload);
      } else {
        socket?.emit(action, payload);
      }
      // api.createSource(url, payload.payload);
    } else {
      setPendingOperation((prev) => [...prev, { action, payload }]);
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
    setUrl(`http://${host}:${port}`);
  }, [config.host, config.port, localStorage.getItem("host"), localStorage.getItem("port")]);

  useEffect(() => {
    if (!url) {
      return;
    }
    async function initializeSocket() {
      try {
        if (!connectionMode) {
          return;
        }
        const response = await axios.get("/config.json");
        const data = response.data;
        if (data.host) host = localStorage.getItem("host") ?? data.host;
        if (data.port) port = localStorage.getItem("port") ?? data.port;

        setSocket(io(`http://${host}:${port}`));
        tempSocket = io(`http://${host}:${port}`);

        tempSocket.on("disconnect", () => {
          setConnecting(false);
        });

        tempSocket.on("init", async (data) => {
          setIsLoading(false);

          console.log("INIT DATA: ", data);

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

          if (data.mosaicDisplays) {
            const displays = data.mosaicDisplays.map((monitor, index) => {
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

            await initData();
            setVideoWalls(displays);

            addMonitorsToScenes({ jsonData: displays, scenes: fetchDataScene, setScenes });
            const newScene = await api.getSceneById(`http://${host}:${port}`, fetchDataScene[0].id);
            console.log("newScene.sources::: ", newScene.sources);
            setSources(newScene.sources);
            generateScene(newScene.sources, fetchDataScene[0]);
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

        tempSocket.on("update-cameras", (data) => {
          setInputs(data);
        });

        tempSocket.on("connect", () => {
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
        console.warn("Failed to fetch config.json or initialize tempSocket", err);
      }
    }

    async function initData() {
      try {
        setIsLoading(true);
        const dataCol = await api.getPrograms(url);
        console.log("dataCol::: ", dataCol);
        fetchDataColl = dataCol;
        setCollections(dataCol ?? []);
        setSelectedCollection(fetchDataColl[0]?.id);

        const dataSen = await api.getScenes(url);
        console.log("dataSen::: ", dataSen);
        fetchDataScene =
          dataSen?.map((item) => ({
            name: item.name,
            id: item.id,
            resources: [],
            stageData: null,
            layer: new Konva.Layer(),
          })) ?? [];
        setScenes(fetchDataScene);

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
      if (tempSocket) tempSocket.disconnect();
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
    console.log("selectedCollectionScenes::: ", selectedCollectionScenes);
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
