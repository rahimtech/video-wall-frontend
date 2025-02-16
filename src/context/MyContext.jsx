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

const MyContext = createContext();

export const MyContextProvider = ({ children }) => {
  let anim;
  let motherLayer;
  let motherStage;
  let host = localStorage.getItem("host") ?? config.host;
  let port = localStorage.getItem("port") ?? config.port;

  // INIT DATA Bad-Practice
  let fetchDataScene = [];
  let fetchDataColl = [];

  // States
  const [videoWalls, setVideoWalls] = useState([]);
  const [socket, setSocket] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const openModal = (modalType) => setActiveModal(modalType);
  const closeModal = () => setActiveModal(null);
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
  const [selectedScene, setSelectedScene] = useState(1);
  const [isBottomControlsVisible, setIsBottomControlsVisible] = useState(true);
  const [editingSceneId, setEditingSceneId] = useState(null);

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

  let arrayCollisions = [];
  let counterImages = 0;
  let counterVideos = 0;
  let allDataMonitors = videoWalls;

  function generateBlobURL(newBaseURL, videoName) {
    const newBlobURL = `${newBaseURL}/uploads/${videoName}.mp4`;

    return newBlobURL;
  }

  function generateBlobImageURL(newBaseURL, videoName) {
    const newBlobURL = `${newBaseURL}/${videoName}.mp4`;

    return newBlobURL;
  }

  // const filteredScenes = scenes.filter((scene) =>
  //   collections.find((item) => item.id == selectedCollection).scenes.includes(scene.id)
  // );

  const [filteredScenes, setFilteredScenes] = useState([]);

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
    if (!scenes.length) {
      return;
    }
  }, []);

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

  const getSelectedScene = () => {
    return scenes.find((scene) => scene.id === selectedScene);
  };

  useEffect(() => {
    if (!url) {
      return;
    }
    async function initData() {
      try {
        setIsLoading(true);
        const dataCol = await api.getPrograms(url);
        console.log("dataCol::: ", dataCol);
        fetchDataColl = dataCol;
        setCollections(dataCol ?? []);

        const dataSen = await api.getScenes(url);
        console.log("dataSen::: ", dataSen);
        fetchDataScene =
          dataSen ??
          [].map((item) => ({
            name: item.name,
            id: item.id,
            resources: [],
            stageData: null,
            layer: new Konva.Layer(),
          }));
        setScenes(fetchDataScene);
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    }

    initData();
  }, [url]);

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

  useEffect(() => {
    if (connectionMode) {
      setSocket(io(`http://${host}:${port}`));
      let tempSocket = io(`http://${host}:${port}`);
      tempSocket.on("connect", () => {
        console.log("Connected to WebSocket!");
      });

      tempSocket.on("disconnect", () => {
        console.log("Disconnected from WebSocket");
      });

      return () => {
        tempSocket.disconnect();
      };
    } else {
      setSocket(null);
    }
  }, [connectionMode, host, port]);

  const sendOperation = (action, payload) => {
    console.log("payload::: ", payload);
    if (connectionModeRef.current) {
      console.log("socket::: ", socket);
      socket?.emit(action, payload);
    } else {
      setPendingOperation((prev) => [...prev, { action, payload }]);
    }
  };

  return (
    <MyContext.Provider
      value={{
        host,
        port,
        videoWalls,
        setVideoWalls,
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
