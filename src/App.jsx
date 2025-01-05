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
import ResourcesSidebar from "./components/sidebar/ResourcesSidebar";
import ScenesSidebar from "./components/sidebar/ScenesSidebar";
import HeaderBar from "./components/HeaderBar";
import Konva from "konva";
import VideoWallSidebar from "./components/sidebar/VideoWallSidebar";
import CollectionsSidebar from "./components/sidebar/CollectionsSidebar";
import UsageSidebar from "./components/sidebar/UsageSidebar";
import { MdCollections, MdCollectionsBookmark, MdOutlineDataUsage } from "react-icons/md";
import { BsDatabase, BsDatabaseFill, BsDatabaseFillAdd } from "react-icons/bs";
import { RiPagesFill } from "react-icons/ri";

let anim;
let motherLayer;
let motherStage;
let socket = null;

function App() {
  const [videoWalls, setVideoWalls] = useState([]);
  console.log("videoWalls::: ", videoWalls);

  // console.log("videoWalls::: ", videoWalls);

  const [activeModal, setActiveModal] = useState(null);
  const openModal = (modalType) => setActiveModal(modalType);
  const closeModal = () => setActiveModal(null);
  const [isToggleLayout, setIsToggleLayout] = useState(
    localStorage.getItem("layout") === "true" ? true : false || false
  );
  const [isLoading, setIsLoading] = useState(false);
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
  //New-Commands

  const [scenes, setScenes] = useState([
    { id: 1, name: "صحنه 1", resources: [], stageData: null, layer: new Konva.Layer() },
  ]);
  const scenesRef = useRef(scenes);
  const videoWallsRef = useRef(videoWalls);
  const connectionModeRef = useRef(connectionMode);

  const [selectedScene, setSelectedScene] = useState(1);
  const [isBottomControlsVisible, setIsBottomControlsVisible] = useState(true);
  const [editingSceneId, setEditingSceneId] = useState(null);
  const [collections, setCollections] = useState([
    {
      id: 1,
      name: "مجموعه ۱",
      scenes: [1],
    },
  ]);

  const [selectedCollection, setSelectedCollection] = useState(1);
  const [sources, setSources] = useState([]);
  console.log("sources::: ", sources);
  const [pendingOperations, setPendingOperation] = useState([]);
  const [flagOperations, setFlagOperation] = useState(false);

  const filteredScenes = scenes.filter((scene) => {
    return collections.find((item) => item.id == selectedCollection).scenes.includes(scene.id);
  });

  let host = config.host;
  let port = config.port;

  const con = useMyContext();
  let arrayCollisions = [];
  let counterImages = 0;
  let counterVideos = 0;
  let allData = [];
  let allDataMonitors = videoWalls;

  const getSelectedScene = () => scenes.find((scene) => scene.id === selectedScene);
  const getSelectedCollection = () => collections.find((coll) => coll.id === selectedCollection.id);
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
    if (connectionModeRef.current) {
      socket?.emit(action, payload);
    } else {
      setPendingOperation((prev) => [...prev, { action, payload }]);
    }
  };

  const addMonitorsToScenes = (jsonData) => {
    console.log("jsonData::: ", jsonData);
    if (!jsonData || !Array.isArray(jsonData)) {
      Swal.fire({
        title: "خطا",
        text: "فرمت داده‌های JSON اشتباه است.",
        icon: "error",
        confirmButtonText: "باشه",
      });
      return;
    }

    const step = 5;

    const updatedScenes = scenes.map((scene) => {
      const layer = scene.layer;
      if (layer) {
        layer.destroyChildren();
      }

      let updatedVideoWalls = [...jsonData];

      jsonData.forEach((monitor, index) => {
        const group = new Konva.Group({
          x: monitor.x,
          y: monitor.y,
          clip: { x: 0, y: 0, width: monitor.width, height: monitor.height },
          draggable: true,
          id: `monitor-group-${monitor.numberMonitor}`,
          catFix: "monitor",
        });

        const rect = new Konva.Rect({
          x: 0,
          y: 0,
          catFix: "monitor",
          width: monitor.width,
          height: monitor.height,
          fill: monitor.connected ? "#161616" : "red", // وضعیت اتصال
          stroke: "white",
          name: "fillShape",
          strokeWidth: 3,
          id: `monitor-${index}`,
        });

        const text2 = new Konva.Text({
          x: 10,
          y: 10,
          text: monitor.connected
            ? `Monitor ${monitor.numberMonitor}\nX: ${monitor.x}, Y: ${monitor.y}`
            : `Monitor ${monitor.numberMonitor} (Disconnected)`, // متن بر اساس اتصال
          fontSize: 50,
          fill: "white",
          align: "left",
          verticalAlign: "top",
          name: "monitorText",
        });

        const text = new Konva.Text({
          x: 10,
          y: 10,
          text: monitor.connected
            ? `Monitor ${monitor.numberMonitor}`
            : `Monitor ${monitor.numberMonitor} (Disconnected)`, // متن بر اساس وضعیت اتصال
          fontSize: 50,
          fill: "white",
          align: "left",
          verticalAlign: "top",
          name: "monitorText",
        });

        if (!monitor.connected) {
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

        let previousPosition = { x: monitor.x, y: monitor.y };

        group.on("dragmove", (e) => {
          const { x, y } = e.target.position();
          const newX = Math.round(x / step) * step; // گام‌های ۵ پیکسلی
          const newY = Math.round(y / step) * step;

          const textNode = group.findOne(".monitorText");
          textNode.text(`Monitor ${index + 1}\nX: ${newX}, Y: ${newY}`); // به‌روزرسانی متن

          e.target.position({ x: newX, y: newY }); // اعمال موقعیت جدید با گام‌های ۵ پیکسلی
        });

        group.on("dragend", (e) => {
          const targetRect = group.getClientRect();

          let hasCollision = false;

          layer.children.forEach((otherGroup) => {
            if (otherGroup === group) return;
            const otherRect = otherGroup.getClientRect();
            if (
              !(
                targetRect.x + targetRect.width <= otherRect.x ||
                targetRect.x >= otherRect.x + otherRect.width ||
                targetRect.y + targetRect.height <= otherRect.y ||
                targetRect.y >= otherRect.y + otherRect.height
              )
            ) {
              hasCollision = true;
            }
          });

          if (hasCollision) {
            rect.fill("red");
            setTimeout(() => {
              rect.fill(monitor.connected ? "#161616" : "red");
              layer.draw();
            }, 500);
            e.target.position(previousPosition);
          } else {
            const newX = e.target.x();
            const newY = e.target.y();
            previousPosition = { x: newX, y: newY };

            updatedVideoWalls = videoWallsRef.current;
            const monitorIndex = updatedVideoWalls.findIndex((m) => m.id === monitor.id);
            if (monitorIndex !== -1) {
              updatedVideoWalls[monitorIndex] = {
                ...updatedVideoWalls[monitorIndex],
                x: newX,
                y: newY,
              };
            }
            arrangeMForScenes(updatedVideoWalls);
          }

          layer.draw();
          setVideoWalls(updatedVideoWalls);
        });

        group.add(rect);
        group.add(text);
        group.add(text2);

        layer.add(group);
      });

      layer.draw();
      return scene;
    });

    setScenes(updatedScenes);
  };

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

  const arrangeMForScenes = (updatedVideoWalls) => {
    // شناسایی بالاچپ‌ترین مانیتور
    let minX = Infinity;
    let minY = Infinity;
    let primaryMonitor = null;

    // یافتن مانیتور بالاچپ
    updatedVideoWalls.forEach((wall) => {
      if (wall.x < minX || (wall.x === minX && wall.y < minY)) {
        minX = wall.x;
        minY = wall.y;
        primaryMonitor = wall["Monitor ID"];
      }
    });

    // اضافه کردن ویژگی `primary` به هر مانیتور
    updatedVideoWalls.forEach((wall) => {
      wall.primary = wall["Monitor ID"] === primaryMonitor ? "Yes" : "No";
    });

    // ارسال عملیات به سرور برای به‌روزرسانی مختصات و ویژگی `primary`
    sendOperation(
      "arrange-displays",
      updatedVideoWalls.map((item) => ({
        "Monitor ID": item["Monitor ID"],
        x: item.x,
        y: item.y,
        primary: item.primary, // ارسال ویژگی `primary`
      }))
    );

    // فعال‌سازی حالت لودینگ اگر اتصال برقرار است
    if (connectionMode === true) {
      setIsLoading(true);
    }

    // به‌روزرسانی صحنه‌ها با مختصات جدید مانیتورها
    const updatedScenesIn = scenesRef.current.map((scene) => {
      const layer = scene.layer;
      if (!layer) return scene;

      const monitors = layer.children;

      monitors.forEach((group) => {
        if (group.attrs.catFix === "monitor") {
          group.draggable(isToggleVideoWall);

          const monitorId = parseInt(group.id().split("-")[2], 10);

          const matchingWall = updatedVideoWalls.find(
            (wall) => parseInt(wall.numberMonitor) === monitorId
          );

          if (matchingWall) {
            const { x: newX, y: newY } = matchingWall;
            group.position({ x: newX, y: newY });

            // به‌روزرسانی متن مربوط به مانیتور
            const textNode = group.findOne(".monitorText");
            if (textNode) {
              textNode.text(`Monitor ${monitorId}\nX: ${newX}, Y: ${newY}`);
            }
          }
        }
      });

      layer.draw();
      return scene;
    });

    setScenes(updatedScenesIn);
  };

  const arrangeMonitors = (rows, cols) => {
    let x = null;
    const updatedScenes = scenes.map((scene) => {
      const layer = scene.layer;

      if (!layer) return scene;

      const monitors = layer.children;
      const totalMonitors = monitors.length;

      const gap = 10;

      const updatedVideoWalls = [...videoWalls];
      const monitorWidth = videoWalls[0].width;
      const monitorHeight = videoWalls[0].height;

      let monitorIndex = 0;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (monitorIndex >= totalMonitors) break;

          const x = col * (monitorWidth + gap);
          const y = row * (monitorHeight + gap);

          const group = monitors[monitorIndex];
          const monitorId = parseInt(group.id().split("-")[2], 10);

          group.position({ x, y });

          const textNode = group.findOne("Text");
          if (textNode) {
            textNode.text(`Monitor ${monitorId}\nX: ${x}, Y: ${y}`);
          }

          const wallIndex = updatedVideoWalls.findIndex((m) => m.numberMonitor === monitorId);
          if (wallIndex !== -1) {
            updatedVideoWalls[wallIndex] = { ...updatedVideoWalls[wallIndex], x, y };
          }

          monitorIndex++;
        }
      }

      layer.draw();
      x = updatedVideoWalls;
      setVideoWalls(updatedVideoWalls);

      return scene;
    });

    setIsLoading(true);
    sendOperation(
      "arrange-displays",
      x.map((item, i) => ({
        "Monitor ID": item["Monitor ID"],
        x: item.x,
        y: item.y,
        primary: i === 0 ? "Yes" : "No",
      }))
    );

    setScenes(updatedScenes);
  };

  const generateMonitorsForLayer = (layer, monitors) => {
    if (!layer || !monitors) return;
    const step = 5;

    if (layer) {
      layer.destroyChildren();
    }

    let updatedVideoWalls = [...monitors];

    monitors.forEach((monitor, index) => {
      const group = new Konva.Group({
        x: monitor.x,
        y: monitor.y,
        clip: { x: 0, y: 0, width: monitor.width, height: monitor.height },
        draggable: true,
        id: `monitor-group-${monitor.numberMonitor}`,
        catFix: "monitor",
      });

      // رنگ و متن بر اساس وضعیت اتصال
      const isConnected = monitor.connected;
      const rect = new Konva.Rect({
        x: 0,
        y: 0,
        catFix: "monitor",
        width: monitor.width,
        height: monitor.height,
        fill: isConnected ? "#161616" : "red", // رنگ بر اساس اتصال
        stroke: "white",
        name: "fillShape",
        strokeWidth: 3,
        id: `monitor-${monitor.numberMonitor}`,
      });

      const text = new Konva.Text({
        x: 10,
        y: 10,
        text: isConnected
          ? `Monitor ${monitor.numberMonitor}\nX: ${monitor.x}, Y: ${monitor.y}`
          : `Monitor ${monitor.numberMonitor} (Disconnected)`, // متن بر اساس اتصال
        fontSize: 50,
        fill: "white",
        align: "left",
        verticalAlign: "top",
        name: "monitorText",
      });

      if (!isConnected) {
        const disconnectIcon = new Konva.Text({
          text: "❌",
          fontSize: 30,
          fill: "white",
          x: monitor.width / 2 - 15,
          y: monitor.height / 2 - 15,
          name: "disconnectIcon",
        });
        group.add(disconnectIcon);
      }

      let previousPosition = { x: monitor.x, y: monitor.y };

      group.on("dragmove", (e) => {
        const { x, y } = e.target.position();
        const newX = Math.round(x / step) * step; // گام‌های ۵ پیکسلی
        const newY = Math.round(y / step) * step;

        const textNode = group.findOne(".monitorText");
        textNode.text(`Monitor ${index + 1}\nX: ${newX}, Y: ${newY}`); // به‌روزرسانی متن

        e.target.position({ x: newX, y: newY }); // اعمال موقعیت جدید با گام‌های ۵ پیکسلی
      });

      group.on("dragend", (e) => {
        const targetRect = group.getClientRect();

        let hasCollision = false;

        layer.children.forEach((otherGroup) => {
          if (otherGroup === group) return;
          const otherRect = otherGroup.getClientRect();
          if (
            !(
              targetRect.x + targetRect.width <= otherRect.x ||
              targetRect.x >= otherRect.x + otherRect.width ||
              targetRect.y + targetRect.height <= otherRect.y ||
              targetRect.y >= otherRect.y + otherRect.height
            )
          ) {
            hasCollision = true;
          }
        });

        if (hasCollision) {
          // تغییر رنگ مستطیل در حال حرکت به قرمز
          rect.fill("red");
          setTimeout(() => {
            rect.fill(isConnected ? "#161616" : "red"); // بازگشت به رنگ بر اساس اتصال
            layer.draw();
          }, 500);
          e.target.position(previousPosition); // بازگشت به موقعیت قبلی
        } else {
          // ذخیره موقعیت جدید
          const newX = e.target.x();
          const newY = e.target.y();
          previousPosition = { x: newX, y: newY };

          // به‌روزرسانی در آرایه videoWalls
          updatedVideoWalls = videoWallsRef.current;

          const monitorIndex = updatedVideoWalls.findIndex((m) => m.id === monitor.id);
          if (monitorIndex !== -1) {
            updatedVideoWalls[monitorIndex] = {
              ...updatedVideoWalls[monitorIndex],
              x: newX,
              y: newY,
            };
          }

          arrangeMForScenes(updatedVideoWalls);
        }

        layer.draw(); // بازسازی لایه
        setVideoWalls(updatedVideoWalls); // به‌روزرسانی state
      });

      group.add(rect);
      group.add(text);

      layer.add(group);
    });

    layer.draw();
  };

  const addScene = () => {
    const newId = scenes.length > 0 ? Math.max(...scenes.map((scene) => scene.id)) + 1 : 1;

    const newLayer = new Konva.Layer();
    const newScene = {
      id: newId,
      name: `صحنه ${newId}`,
      resources: [],
      layer: newLayer,
    };

    setCollections((prev) =>
      prev.map((item) =>
        item.id == selectedCollection ? { ...item, scenes: [...item.scenes, newId] } : item
      )
    );
    setScenes((prevScenes) => [...prevScenes, newScene]);
    setSelectedScene(newId);
    // selectedCollection();

    // Swal.fire({
    //   title: "صحنه اضافه شد",
    //   icon: "success",
    //   confirmButtonText: "متوجه شدم",
    //   confirmButtonColor: "green",
    // });
  };

  const deleteScene = (id) => {
    Swal.fire({
      title: "آيا مطمئن هستید؟",
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: "بله",
      denyButtonText: `خیر`,
      confirmButtonColor: "green",
      denyButtonColor: "gray",
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedScenes = scenes.filter((scene) => scene.id !== id);
        const updatedSourcesUsage = sources.filter((item) => item.sceneId !== id);
        // console.log("updatedSourcesUsage::: ", updatedSourcesUsage);
        setScenes(updatedScenes);
        setSources(updatedSourcesUsage);
        if (selectedScene === id && updatedScenes.length > 0) {
          setSelectedScene(updatedScenes[0].id);
        }
      }
    });
  };

  const handleEditSceneName = (id, newName) => {
    setScenes((prevScenes) =>
      prevScenes.map((scene) => (scene.id === id ? { ...scene, name: newName } : scene))
    );
    setEditingSceneId(null);
  };

  function generateBlobURL(newBaseURL, videoName) {
    const newBlobURL = `${newBaseURL}/uploads/${videoName}.mp4`;

    return newBlobURL;
  }

  function generateBlobImageURL(newBaseURL, videoName) {
    const newBlobURL = `${newBaseURL}/${videoName}.mp4`;

    return newBlobURL;
  }

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
    console.log("🟠 Updated displays received from server:", updatedDisplays);

    // به‌روزرسانی scenes با setScenes
    setScenes((prevScenes) =>
      prevScenes.map((scene) => {
        const { layer } = scene; // دسترسی به لایه هر صحنه
        if (!layer) return scene;

        // پردازش هر نمایشگر
        updatedDisplays.forEach((display) => {
          const rawName = display["Name"] || `display-${index}`;
          const match = rawName.match(/DISPLAY(\d+)/i);
          const parsedNumber = match && match[1] ? match[1] : index + 1;
          const group = layer.findOne(`#monitor-group-${parsedNumber}`); // یافتن گروه مانیتور

          if (group) {
            const rect = group.findOne("Rect");
            const text = group.findOne(".monitorText");

            if (!display.connected) {
              // مانیتور قطع شده
              if (rect) rect.fill("red"); // تغییر رنگ به قرمز
              if (text) text.text(`Monitor ${parsedNumber} (Disconnected)`);

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
              // مانیتور متصل است
              if (rect) rect.fill("#161616");
              if (text) text.text(`Monitor ${parsedNumber}`);

              const disconnectIcon = group.findOne(".disconnectIcon");
              if (disconnectIcon) disconnectIcon.destroy();
            }
          }
        });

        layer.draw(); // بازسازی لایه
        return scene; // بازگرداندن لایه به‌روزرسانی شده
      })
    );
  }

  useEffect(() => {
    if (socket) {
      socket.on("displays-arranged", (e) => {
        console.log("sasdad-------======-------======ds");
        setIsLoading(false);
      });
      socket.on("display_error", handleDisplayError);
    }
  }, [socket]);

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
          // console.log("Offline mode: Skipping socket initialization");
          return;
        }
        const response = await axios.get("/config.json");
        const data = response.data;
        if (data.host) host = data.host;
        if (data.port) port = data.port;

        socket = io(`http://${host}:${port}`);

        socket.on("disconnect", () => {
          setConnecting(false);
        });

        socket.on("init", (data) => {
          setIsLoading(false);

          console.log("INIT DATA: ", data);
          if (flagOperations) {
            console.log("Skip INIT==");
            setFlagOperation(false);
            return;
          }

          if (data.inputs) {
            const inputs = data.inputs.map((item) => ({
              id: item.deviceId,
              deviceId: item.deviceId,
              width: item.width,
              height: item.height,
              name: item.label,
            }));
            setInputs(inputs);
          }

          if (data.displays) {
            const displays = data.displays.map((monitor, index) => {
              const [xLeft, yTop] = monitor["Left-Top"]
                .split(",")
                .map((v) => parseInt(v.trim(), 10));

              const [xRight, yBottom] = monitor["Right-Bottom"]
                .split(",")
                .map((v) => parseInt(v.trim(), 10));

              const width = xRight - xLeft;
              const height = yBottom - yTop;

              const rawName = monitor["Name"] || `display-${index}`;
              const match = rawName.match(/DISPLAY(\d+)/i);
              const parsedNumber = match && match[1] ? match[1] : index + 1;

              const id = `display-${parsedNumber}`;
              const name = `مانیتور ${parsedNumber}`;

              return {
                ...monitor, // بازگرداندن کل داده‌های موجود در هر مانیتور
                numberMonitor: parseInt(parsedNumber),
                id,
                name,
                x: xLeft,
                y: yTop,
                width,
                height,
                connected: monitor.connected !== false, // اتصال یا عدم اتصال
                monitorUniqId: monitor["Monitor ID"],
              };
            });

            setVideoWalls(displays);
            addMonitorsToScenes(displays);
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
                const imageName = "image" + counterImages++;
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
                rotation: parseInt(item.rotation),
              };

              if (type === "image") {
                addImage(endObj, false);
              } else if (type === "input") {
                addInput(endObj, false);
              } else if (type === "video") {
                addVideo(endObj, false);
                // addRectangle();
              }
              return endObj;
            });
            setSources(sources);
          }

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
                const imageName = "imageBase" + counterImages++;
                endObj = {
                  name: imageName,
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
                  name: videoName,
                };
              }

              endObj = {
                ...endObj,
                id: "uploads/" + item,
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
            updateSceneResources([...newResource, ...getSelectedScene().resources]);
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
        // console.warn("Failed to fetch config.json or initialize socket", err);
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
      if (scenes.length > 1 || scenes.length == 0) {
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

  const fitToMonitors = (uniqId, selectedMonitors, item) => {
    const videoGroup = getSelectedScene()
      ?.layer.getChildren()
      .find((child) => child.attrs.uniqId === uniqId);

    if (!videoGroup) {
      console.error("videoGroup not found");
      return;
    }

    if (videoGroup instanceof Konva.Image) {
      const firstMonitor = allDataMonitors[selectedMonitors[0]];
      const lastMonitor = allDataMonitors[selectedMonitors[selectedMonitors.length - 1]];

      const x = firstMonitor.x;
      const y = firstMonitor.y;
      const width = lastMonitor.x + lastMonitor.width - firstMonitor.x;
      const height = lastMonitor.y + lastMonitor.height - firstMonitor.y;

      videoGroup.position({ x, y });
      videoGroup.width(width);
      videoGroup.height(height);

      videoGroup.setAttr("rotation", 0);

      getSelectedScene()?.layer.draw();

      sendOperation("source", {
        action: "resize",
        id: uniqId,
        payload: {
          x: x,
          y: y,
          width: width,
          height: height,
          rotation: "0",
        },
      });
    } else if (videoGroup instanceof Konva.Group) {
      if (videoGroup) {
        const firstMonitor = allDataMonitors[selectedMonitors[0]];
        const lastMonitor = allDataMonitors[selectedMonitors[selectedMonitors.length - 1]];

        const x = firstMonitor.x;
        const y = firstMonitor.y;
        const width = lastMonitor.x + lastMonitor.width - firstMonitor.x;
        const height = lastMonitor.y + lastMonitor.height - firstMonitor.y;

        // تغییر موقعیت group
        videoGroup.position({ x, y });
        console.log("videoGroup::: ", videoGroup);

        // تغییر ابعاد rect به صورت جداگانه
        // if (videoGroup?.getChildren()) {
        videoGroup?.getChildren((node) => {
          if (node instanceof Konva.Rect) {
            node.width(width);
            node.height(height);
          } else {
            node.width(width);
            node.height(height);
          }
        });
        // }

        // تنظیم rotation
        videoGroup.setAttr("rotation", 0);

        // بازسازی لایه
        getSelectedScene()?.layer.draw();

        sendOperation("source", {
          action: "resize",
          id: uniqId,
          payload: {
            x: x,
            y: y,
            width: width,
            height: height,
            rotation: "0",
          },
        });
      }
      // کدهای قبلی را برای گروه اجرا کنید
    } else {
      console.log("videoGroup نوع نود دیگری است");
    }
  };

  //---------------Start-Resource-Segment-----------------
  const addResource = (type) => {
    if (type === "video" || type === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = type === "video" ? "video/*" : "image/*";
      input.onchange = (e) => handleFileInput(e, type);
      input.click();
    } else if (type === "text") {
      Swal.fire({
        title: "متن خود را وارد کنید:",
        input: "text",
        showCancelButton: true,
        confirmButtonColor: "green",
        cancelButtonColor: "gray",
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const id = crypto.randomUUID();

          let newResource = {
            type: "text",
            id,
            color: "black",
            name: result.value,
            content: result.value,
            width: 200,
            height: 200,
            x: 0,
            y: 0,
            z: 0,
            rotation: 0,
            created_at: new Date().toISOString(),
          };

          updateSceneResources([newResource, ...getSelectedScene().resources]);
        }
      });
    } else if (type === "web") {
      Swal.fire({
        title: "Enter the URL:",
        input: "url",
        inputPlaceholder: "https://example.com",
        showCancelButton: true,
        confirmButtonColor: "green",
        cancelButtonColor: "gray",
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const id = crypto.randomUUID();
          const webURL = result.value;

          let newResource = {
            type: "web",
            id,
            name: webURL,
            content: webURL,
            width: 1920,
            height: 1080,
            x: 0,
            y: 0,
            z: 0,
            rotation: 0,
            created_at: new Date().toISOString(),
          };

          updateSceneResources([newResource, ...getSelectedScene().resources]);
        }
      });
    }
  };

  const deleteResource = (id) => {
    Swal.fire({
      title: "آیا مطمئن هستید؟",
      icon: "warning",
      showCancelButton: true,
      cancelButtonText: "خیر",
      confirmButtonColor: "limegreen",
      cancelButtonColor: "#d33",
      confirmButtonText: "بله",
    }).then(async (result) => {
      if (result.isConfirmed) {
        sendOperation("source", {
          action: "remove",
          id,
          payload: {},
        });

        updateSceneResources(getSelectedScene()?.resources.filter((res) => res.id !== id));

        const groupToRemove = getSelectedScene()?.layer.findOne(`#${id}`);
        if (groupToRemove) {
          groupToRemove.destroy();
          getSelectedScene()?.layer.draw();
        } else {
          // console.error(`Group with id ${id} not found`);
        }

        const videoElement = getSelectedScene()?.resources.find(
          (item) => item.id === id
        )?.videoElement;
        if (videoElement) {
          videoElement.pause();
          videoElement.src = "";
        }
      } else {
        return;
      }
    });
  };

  const moveResource = (id, direction) => {
    const resources = getSelectedScene()?.resources;
    const index = resources.findIndex((res) => res.id === id);
    if (index === -1) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= resources.length) return;

    const updatedResources = [...resources];
    const [movedResource] = updatedResources.splice(index, 1);
    updatedResources.splice(newIndex, 0, movedResource);

    updateSceneResources(updatedResources);

    const resourceNode = getSelectedScene()?.layer.findOne(`#${id}`);
    if (resourceNode) {
      if (direction > 0) {
        resourceNode.moveDown();
      } else {
        resourceNode.moveUp();
      }
      getSelectedScene()?.layer.draw();
    }
  };

  const handleFileInput = async (e, type) => {
    const file = e.target.files[0];
    console.log("file::: ", file);

    if (file) {
      const fileType = file.type.split("/")[0];
      if (fileType === "image" && type === "image") {
        const imageURL = URL.createObjectURL(file);
        let img = new Image();
        img.src = imageURL;
        const id = crypto.randomUUID();
        const imageName = "image" + counterImages++;
        img.addEventListener("load", async () => {
          const sourceName = await uploadVideo(file, id);
          let newResource = {
            type: "image",
            id: sourceName,
            name: imageName,
            imageElement: img,
            content: img.src,
            width: img.width,
            height: img.height,
            x: 0,
            y: 0,
            z: 0,
            rotation: 0,
            created_at: new Date().toISOString(),
          };
          updateSceneResources([newResource, ...getSelectedScene().resources]);
        });
      } else if (fileType === "video" && type === "video") {
        const video = document.createElement("video");
        video.src = URL.createObjectURL(file);
        const id = crypto.randomUUID();
        const videoName = "video" + counterVideos++;
        video.setAttribute("name", videoName);
        const sourceName = await uploadVideo(file, id);
        video.setAttribute("id", sourceName);

        const width = video.videoWidth;
        const height = video.videoHeight;

        let newResource = {
          type: "video",
          id: sourceName,
          name: videoName,
          videoElement: video,
          content: video.src,
          width,
          height,
          x: 0,
          y: 0,
          rotation: 0,
          created_at: new Date().toISOString(),
        };

        updateSceneResources([newResource, ...getSelectedScene().resources]);
      } else {
        // console.error("Unsupported file type.");
      }
    }
  };

  const updateSceneResources = (updatedResources) => {
    setScenes((prevScenes) =>
      prevScenes.map((scene) =>
        scene.id === selectedScene ? { ...scene, resources: updatedResources } : scene
      )
    );
  };

  const updateResourceInState = (id, changes) => {
    setScenes((prevScenes) =>
      prevScenes.map((scene) => {
        if (scene.id === selectedScene) {
          return {
            ...scene,
            resources: scene.resources.map((resource) =>
              resource.id === id ? { ...resource, ...changes } : resource
            ),
          };
        }
        return scene;
      })
    );
  };

  //---------------End-Resource-Segment-----------------

  const addImage = (img, mode = true) => {
    let uniqId = mode ? crypto.randomUUID() : img.id;
    const selectedSceneLayer = getSelectedScene()?.layer;
    if (!selectedSceneLayer) return;

    const modifiedImageURL = mode
      ? generateBlobImageURL(`image:http://${host}:${port}`, img.id).slice(0, -".mp4".length)
      : img.content;

    if (mode) {
      sendOperation("source", {
        action: "add",
        id: uniqId,
        payload: {
          source: modifiedImageURL,
          x: 0,
          y: 0,
          width: img.imageElement.width,
          height: img.imageElement.height,
        },
      });
    }

    const image = new Image();
    image.src = img.imageElement.src || img.imageElement;
    image.onload = () => {
      // ساخت تصویر Konva
      const konvaImage = new Konva.Image({
        image: image,
        width: mode ? img.imageElement.width : img.width,
        height: mode ? img.imageElement.height : img.height,
        name: "object",
        id: img.id,
        uniqId,
        x: 0,
        y: 0,
      });

      const text = new Konva.Text({
        x: 0,
        y: 0,
        text: `${img.name}\n(${img.type})`,
        fontSize: 50,
        fill: "black",
        fontFamily: "Arial",
        padding: 5,
        align: "center",
      });

      const group = new Konva.Group({
        x: mode ? 0 : img.x,
        y: mode ? 0 : img.y,
        draggable: true,
        uniqId,
        rotation: img.rotation || 0,
      });

      group.add(konvaImage);
      group.add(text);

      selectedSceneLayer.add(group);

      group.on("click", () => {
        const transformer = new Konva.Transformer({
          nodes: [group],
          enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
          rotateEnabled: true,
        });
        selectedSceneLayer.add(transformer);
        transformer.attachTo(group);
        selectedSceneLayer.draw();
      });

      group.on("dragend", (e) => {
        const { x, y } = e.target.position();
        setSources((prev) =>
          prev.map((item) =>
            item.uniqId === e.target.attrs.uniqId
              ? { ...item, x, y, sceneId: getSelectedScene().id }
              : item
          )
        );

        sendOperation("source", {
          action: "move",
          id: e.target.attrs.uniqId,
          payload: { source: modifiedImageURL, x, y },
        });
      });

      group.on("transformend", (e) => {
        const newWidth = konvaImage.width() * group.scaleX();
        const newHeight = konvaImage.height() * group.scaleY();

        const rotation = Math.round(group.getAttr("rotation"));
        const x = group.x();
        const y = group.y();

        setSources((prev) =>
          prev.map((item) =>
            item.uniqId === e.target.attrs.uniqId
              ? {
                  ...item,
                  x,
                  y,
                  width: newWidth,
                  height: newHeight,
                  rotation,
                  sceneId: getSelectedScene().id,
                }
              : item
          )
        );

        sendOperation("source", {
          action: "resize",
          id: e.target.attrs.uniqId,
          payload: {
            source: modifiedImageURL,
            x,
            y,
            width: newWidth,
            height: newHeight,
            rotation,
          },
        });
      });

      mode
        ? setSources((prev) => [...prev, { ...img, uniqId, sceneId: getSelectedScene().id }])
        : null;

      // بازسازی لایه
      selectedSceneLayer.draw();
    };

    image.onerror = () => {
      console.error("Failed to load image:", img.imageElement.src);
    };
  };

  const addInput = (input, mode = true) => {
    let uniqId = mode ? crypto.randomUUID() : input.id;

    const selectedSceneLayer = getSelectedScene()?.layer;
    if (!selectedSceneLayer) return;

    const group = new Konva.Group({
      x: input.x || 0,
      y: input.y || 0,
      draggable: true,
      id: `${input.id}`,
      type: "input",
      uniqId,
      rotation: input.rotation || 0,
    });

    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width: input.width,
      height: input.height,
      fill: "lightblue",
    });

    const text = new Konva.Text({
      x: 10,
      y: 10,
      text: `${input.name}\n(${input.type})`,
      fontSize: 50,
      fill: "black",
    });

    group.add(rect);
    group.add(text);

    if (mode) {
      setSources((prev) => [...prev, { ...input, uniqId, sceneId: getSelectedScene().id }]);
      sendOperation("source", {
        action: "add",
        id: uniqId,
        payload: {
          source: "input:" + input.deviceId,
          x: 0,
          y: 0,
          width: input.width,
          height: input.height,
          name: input.name,
        },
      });
    }

    selectedSceneLayer.add(group);
    selectedSceneLayer.draw();

    const transformer = new Konva.Transformer({
      nodes: [group],
      enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
      rotateEnabled: true,
    });

    group.on("click", () => {
      selectedSceneLayer.add(transformer);
      transformer.attachTo(group);
      selectedSceneLayer.draw();
    });

    group.on("dragend", (e) => {
      const { x, y } = e.target.position();
      setSources((prev) =>
        prev.map((item) =>
          item.uniqId === e.target.attrs.uniqId
            ? { ...item, x, y, sceneId: getSelectedScene().id }
            : item
        )
      );
      sendOperation("source", {
        action: "move",
        id: e.target.attrs.uniqId,
        payload: { x: group.x(), y: group.y() },
      });
    });

    group.on("transformend", (e) => {
      const newWidth = rect.width() * group.scaleX();
      const newHeight = rect.height() * group.scaleY();

      const rotation = Math.round(group.getAttr("rotation"));
      const x = group.x();
      const y = group.y();

      setSources((prev) =>
        prev.map((item) =>
          item.uniqId === e.target.attrs.uniqId
            ? {
                ...item,
                x,
                y,
                width: newWidth,
                height: newHeight,
                rotation,
                sceneId: getSelectedScene().id,
              }
            : item
        )
      );
      sendOperation("source", {
        action: "resize",
        id: e.target.attrs.uniqId,
        payload: {
          x,
          y,
          width: newWidth,
          height: newHeight,
          rotation,
        },
      });
    });
  };

  //---------------Start-Web-Segment-----------------

  const addWeb = (webResource) => {
    const { id, content } = webResource;
    let uniqId = crypto.randomUUID();

    const selectedSceneLayer = getSelectedScene()?.layer;
    const selectedStage = getSelectedScene()?.stageData;

    if (!selectedSceneLayer || !selectedStage) return;

    const group = new Konva.Group({
      x: (selectedStage.width() - 1920) / 2,
      y: (selectedStage.height() - 1080) / 2,
      draggable: true,
      id: id,
      uniqId,
    });

    const webRect = new Konva.Rect({
      width: 1920,
      height: 1080,
      fill: "lightgray",
      stroke: "black",
      strokeWidth: 2,
      uniqId,
    });

    const webText = new Konva.Text({
      text: content,
      fontSize: 30,
      fontFamily: "Arial",
      fill: "black",
      align: "center",
      verticalAlign: "middle",
      width: 1920,
      height: 1080,
      padding: 10,
      wrap: "word",
    });

    const transformer = new Konva.Transformer({
      nodes: [group],
      enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
      rotateEnabled: true,
    });

    group.on("click", () => {
      selectedSceneLayer.add(transformer);
      transformer.attachTo(group);
      selectedSceneLayer.draw();
    });

    setSources((prev) => [...prev, { ...webResource, uniqId, sceneId: getSelectedScene().id }]);

    group.on("dragend", (e) => {
      const { x, y } = e.target.position();
      setSources((prev) =>
        prev.map((item) =>
          item.uniqId === e.target.attrs.uniqId
            ? { ...item, x, y, sceneId: getSelectedScene().id }
            : item
        )
      );
      sendOperation("source", {
        action: "move",
        id: e.target.attrs.uniqId,
        payload: { x: group.x(), y: group.y() },
      });
    });

    group.on("transformend", (e) => {
      const newWidth = webRect.width() * group.scaleX();
      const newHeight = webRect.height() * group.scaleY();

      const rotation = Math.round(group.getAttr("rotation"));
      const x = group.x();
      const y = group.y();

      setSources((prev) =>
        prev.map((item) =>
          item.uniqId === e.target.attrs.uniqId
            ? {
                ...item,
                x,
                y,
                width: newWidth,
                height: newHeight,
                rotation,
                sceneId: getSelectedScene().id,
              }
            : item
        )
      );

      sendOperation("source", {
        action: "resize",
        id: e.target.attrs.uniqId,
        payload: {
          x,
          y,
          width: newWidth,
          height: newHeight,
          rotation,
        },
      });
    });

    group.add(webRect);
    group.add(webText);
    selectedSceneLayer.add(group);
    selectedStage.add(selectedSceneLayer);
    selectedSceneLayer.draw();
  };

  const editWeb = (webResource) => {
    Swal.fire({
      title: "ویرایش URL:",
      input: "url",
      inputValue: webResource.content,
      showCancelButton: true,
      confirmButtonColor: "limegreen",
      cancelButtonColor: "#d33",
      confirmButtonText: "ذخیره",
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        setScenes((prevScenes) =>
          prevScenes.map((scene) => {
            if (scene.id === selectedScene) {
              return {
                ...scene,
                resources: scene.resources.map((resource) =>
                  resource.id === webResource.id
                    ? { ...resource, webURL: result.value, name: result.value }
                    : resource
                ),
              };
            }
            return scene;
          })
        );
      }
    });
  };

  //---------------End-Web-Segment-----------------

  //---------------Start-Text-Segment-----------------

  const addText = (text) => {
    const selectedSceneLayer = getSelectedScene()?.layer;
    const selectedStage = getSelectedScene()?.stageData;
    let uniqId = crypto.randomUUID();

    if (!selectedSceneLayer || !selectedStage) return;

    const textNode = new Konva.Text({
      text: text.content,
      fontSize: 100,
      fontFamily: "Arial",
      fill: text.color || "black",
      x: 0,
      y: 0,
      draggable: true,
      id: text.id,
      uniqId,
    });

    const transformer = new Konva.Transformer({
      nodes: [textNode],
      enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
      boundBoxFunc: (oldBox, newBox) => {
        newBox.width = Math.max(30, newBox.width);
        return newBox;
      },
    });

    textNode.on("click", () => {
      selectedSceneLayer.add(transformer);
      transformer.attachTo(textNode);
      selectedSceneLayer.draw();
    });

    textNode.on("dblclick", () => {
      const textPosition = textNode.absolutePosition();
      const stageBox = selectedStage.container().getBoundingClientRect();
      const areaPosition = {
        x: stageBox.left + textPosition.x,
        y: stageBox.top + textPosition.y,
      };

      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      textarea.value = textNode.text();
      textarea.style.position = "absolute";
      textarea.style.top = `${areaPosition.y}px`;
      textarea.style.left = `${areaPosition.x}px`;
      textarea.style.width = `${textNode.width() - textNode.padding() * 2}px`;
      textarea.style.fontSize = "24px";
      textarea.style.border = "1px solid black";
      textarea.style.padding = "0px";
      textarea.style.margin = "0px";
      textarea.style.overflow = "hidden";
      textarea.style.background = "none";
      textarea.style.outline = "none";
      textarea.style.resize = "none";
      textarea.style.lineHeight = textNode.lineHeight();
      textarea.style.fontFamily = textNode.fontFamily();
      textarea.style.transformOrigin = "left top";

      textarea.style.textAlign = textNode.align();
      textarea.style.color = textNode.fill();
      const rotation = textNode.rotation();
      let transform = "";
      if (rotation) {
        transform += `rotateZ(${rotation}deg)`;
      }

      textarea.style.transform = transform;
      textarea.style.height = "auto";
      textarea.focus();

      function removeTextarea() {
        textarea.parentNode.removeChild(textarea);
        window.removeEventListener("click", handleOutsideClick);
        textNode.show();
        transformer.show();
        transformer.forceUpdate();
        selectedSceneLayer.draw();
      }

      textarea.addEventListener("keydown", function (e) {
        if (e.keyCode === 13) {
          textNode.text(textarea.value);
          removeTextarea();
        }
      });

      function handleOutsideClick(e) {
        if (e.target !== textarea) {
          textNode.text(textarea.value);
          removeTextarea();
        }
      }

      textarea.addEventListener("keydown", function (e) {
        if (e.keyCode === 27) {
          removeTextarea();
        }
      });

      setTimeout(() => {
        window.addEventListener("click", handleOutsideClick);
      });

      textarea.style.height = `${textarea.scrollHeight}px`;
    });

    textNode.on("dragend", (e) => {
      const { x, y } = e.target.position();
      setSources((prev) =>
        prev.map((item) =>
          item.uniqId === e.target.attrs.uniqId
            ? { ...item, x, y, sceneId: getSelectedScene().id }
            : item
        )
      );
      sendOperation("source", {
        action: "move",
        id: e.target.attrs.uniqId,
        payload: { x: textNode.x(), y: textNode.y() },
      });
    });

    textNode.on("transformend", (e) => {
      const newWidth = textNode.width() * textNode.scaleX();
      const newHeight = textNode.height() * textNode.scaleY();

      const rotation = Math.round(textNode.getAttr("rotation"));
      const x = textNode.x();
      const y = textNode.y();

      setSources((prev) =>
        prev.map((item) =>
          item.uniqId === e.target.attrs.uniqId
            ? {
                ...item,
                x,
                y,
                width: newWidth,
                height: newHeight,
                rotation,
                sceneId: getSelectedScene().id,
              }
            : item
        )
      );

      sendOperation("source", {
        action: "resize",
        id: e.target.attrs.uniqId,
        payload: {
          x,
          y,
          width: newWidth,
          height: newHeight,
          rotation,
        },
      });
    });

    setSources((prev) => [...prev, { ...text, uniqId, sceneId: getSelectedScene().id }]);

    selectedSceneLayer.add(textNode);
    selectedStage.add(selectedSceneLayer);
    selectedSceneLayer.draw();
  };

  const editText = (text) => {
    Swal.fire({
      title: "ویرایش متن:",
      input: "text",
      inputValue: text.content,
      showCancelButton: true,
      confirmButtonColor: "limegreen",
      cancelButtonColor: "#d33",
      confirmButtonText: "ذخیره",
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        setScenes((prevScenes) =>
          prevScenes.map((scene) => {
            if (scene.id === selectedScene) {
              return {
                ...scene,
                resources: scene.resources.map((resource) =>
                  resource.id === text.id
                    ? { ...resource, content: result.value, name: result.value }
                    : resource
                ),
              };
            }
            return scene;
          })
        );

        const textNode = getSelectedScene()?.layer.findOne(`#${text.id}`);
        if (textNode) {
          textNode.text(result.value);
          getSelectedScene()?.layer.draw();
        }
      }
    });
  };

  const updateResourceName = (resourceId, newName, isSource = true) => {
    setSources((prev) =>
      prev.map((item) =>
        (item.id ?? item.uniqId) === resourceId ? { ...item, name: newName } : item
      )
    );
    if (isSource) {
      sendOperation("source", {
        action: "resize",
        id: resourceId,
        payload: {
          name: newName,
        },
      });
    }
    if (isSource == false) {
      setScenes((prevScenes) =>
        prevScenes.map((scene) => {
          if (scene.id === selectedScene) {
            const updatedResources = scene.resources.map((resource) => {
              return resource.id === resourceId
                ? { ...resource, name: newName, content: newName }
                : resource;
            });
            return { ...scene, resources: updatedResources };
          }
          return scene;
        })
      );
    }
  };

  const updateResourceColor = (resourceId, color) => {
    setScenes((prevScenes) =>
      prevScenes.map((scene) =>
        scene.id === selectedScene
          ? {
              ...scene,
              resources: scene.resources.map((resource) =>
                resource.id === resourceId ? { ...resource, color } : resource
              ),
            }
          : scene
      )
    );

    const textNode = getSelectedScene()?.layer.findOne(`#${resourceId}`);
    if (textNode) {
      textNode.fill(color);
      getSelectedScene()?.layer.draw();
    }
  };

  //---------------End-Text-Segment-----------------

  //---------------Start-Video-Segment-----------------

  const addVideo = (videoItem, mode = true) => {
    console.log("videoItem::: ", videoItem);
    let uniqId = mode ? crypto.randomUUID() : videoItem.id;

    const selectedSceneLayer = getSelectedScene()?.layer;
    let selectedStage = null;
    if (mode) {
      selectedStage = getSelectedScene()?.stageData;
    }

    if (!selectedSceneLayer) return;

    const modifiedVideoURL = mode
      ? `video:http://${host}:${port}/${videoItem.id}`
      : videoItem.content;

    if (mode) {
      sendOperation("source", {
        action: "add",
        id: uniqId,
        payload: {
          source: modifiedVideoURL,
          x: 0,
          y: 0,
          width: videoItem.videoElement.videoWidth,
          height: videoItem.videoElement.videoHeight,
          name: videoItem.name,
        },
      });
    }

    if (mode) {
      const text = new Konva.Text({
        x: 0,
        y: 0,
        text: `${videoItem.name}\n(${videoItem.type})`,
        fontSize: 50,
        fill: "black",
        fontFamily: "Arial",
        padding: 5,
        align: "center",
      });

      const group = new Konva.Group({
        x: mode ? 0 : videoItem.x,
        y: mode ? 0 : videoItem.y,
        draggable: true,
        uniqId,
        rotation: videoItem.rotation || 0,
      });

      const image = new Konva.Image({
        image: videoItem.videoElement,
        width: videoItem.videoElement.videoWidth,
        height: videoItem.videoElement.videoHeight,
        name: "object",
        fill: "gray",
        id: videoItem.id,
        uniqId,
        x: 0,
        y: 0,
        // rotation: videoItem.rotation || 0,
      });

      group.add(image);
      group.add(text);
      selectedSceneLayer.add(group);

      if (mode) {
        setSources((prev) =>
          mode ? [...prev, { ...videoItem, uniqId, sceneId: getSelectedScene().id }] : prev
        );
      }
      if (mode) selectedStage.add(selectedSceneLayer);

      const transformer = new Konva.Transformer({
        nodes: [group],
        enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
        rotateEnabled: true,
      });

      group.on("click", () => {
        selectedSceneLayer.add(transformer);
        transformer.attachTo(group);
        selectedSceneLayer.draw();
      });

      transformer.on("transformend", (e) => {
        const newWidth = image.width() * group.scaleX();
        const newHeight = image.height() * group.scaleY();

        const rotation = Math.round(group.getAttr("rotation"));
        const x = group.x();
        const y = group.y();

        sendOperation("source", {
          action: "resize",
          id: e.target.attrs.uniqId,
          payload: {
            source: modifiedVideoURL,
            x,
            y,
            width: newWidth,
            height: newHeight,
            rotation,
          },
        });

        setSources((prev) =>
          prev.map((item) =>
            item.uniqId === e.target.attrs.uniqId
              ? {
                  ...item,
                  x,
                  y,
                  width: newWidth,
                  height: newHeight,
                  rotation,
                  sceneId: getSelectedScene().id,
                }
              : item
          )
        );
      });

      group.on("dragend", (e) => {
        const { x, y } = e.target.position();

        setSources((prev) =>
          prev.map((item) =>
            item.uniqId === e.target.attrs.uniqId
              ? { ...item, x, y, sceneId: getSelectedScene().id }
              : item
          )
        );
        sendOperation("source", {
          action: "move",
          id: e.target.attrs.uniqId,
          payload: { x, y },
        });

        selectedSceneLayer.draw();
      });

      videoItem.loop = loopVideos[videoItem.name] || false;
    } else {
      videoItem.videoElement.onloadeddata = () => {
        const text = new Konva.Text({
          x: 0,
          y: 0,
          text: `${videoItem.name}\n(${videoItem.type})`,
          fontSize: 50,
          fill: "black",
          fontFamily: "Arial",
          padding: 5,
          align: "center",
        });

        const group = new Konva.Group({
          x: mode ? 0 : videoItem.x,
          y: mode ? 0 : videoItem.y,
          draggable: true,
          uniqId,
          rotation: videoItem.rotation || 0,
        });

        const image = new Konva.Image({
          image: videoItem.videoElement,
          width: videoItem.width,
          height: videoItem.height,
          name: "object",
          fill: "gray",
          id: videoItem.id,
          uniqId,
          x: 0,
          y: 0,
          // rotation: videoItem.rotation || 0,
        });

        group.add(image);
        group.add(text);

        if (mode) {
          setSources((prev) =>
            mode ? [...prev, { ...videoItem, uniqId, sceneId: getSelectedScene().id }] : prev
          );
        }
        selectedSceneLayer.add(group);
        if (mode) selectedStage.add(selectedSceneLayer);

        const transformer = new Konva.Transformer({
          nodes: [group],
          enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
          rotateEnabled: true,
        });

        group.on("click", () => {
          selectedSceneLayer.add(transformer);
          transformer.attachTo(group);
          selectedSceneLayer.draw();
        });

        transformer.on("transformend", (e) => {
          const newWidth = image.width() * group.scaleX();
          const newHeight = image.height() * group.scaleY();

          const rotation = Math.round(group.getAttr("rotation"));
          const x = group.x();
          const y = group.y();

          sendOperation("source", {
            action: "resize",
            id: e.target.attrs.uniqId,
            payload: {
              source: modifiedVideoURL,
              x,
              y,
              width: newWidth,
              height: newHeight,
              rotation,
            },
          });

          setSources((prev) =>
            prev.map((item) =>
              item.uniqId === e.target.attrs.uniqId
                ? {
                    ...item,
                    x,
                    y,
                    width: newWidth,
                    height: newHeight,
                    rotation,
                    sceneId: getSelectedScene().id,
                  }
                : item
            )
          );
        });

        group.on("dragend", (e) => {
          const { x, y } = e.target.position();

          setSources((prev) =>
            prev.map((item) =>
              item.uniqId === e.target.attrs.uniqId
                ? { ...item, x, y, sceneId: getSelectedScene().id }
                : item
            )
          );
          sendOperation("source", {
            action: "move",
            id: e.target.attrs.uniqId,
            payload: { x, y },
          });

          selectedSceneLayer.draw();
        });

        videoItem.loop = loopVideos[videoItem.name] || false;
      };
    }
  };

  const playVideo = (videoId) => {
    const video = sources.filter((item) => item.id == videoId);

    // console.log("video::: ", video);
    if (video[0].videoElement) {
      video[0].videoElement.play();
      // anim = new Konva.Animation((frame) => {}, selectedScene);

      anim.start();
      // sendOperation("source", {
      //   action: "play",
      //   id: videoId,
      // });

      // console.log("anim::: ", anim);
    }
  };

  const pauseVideo = (videoId) => {
    const video = sources.filter((item) => item.id == videoId);

    if (video[0].videoElement) {
      video[0].videoElement.pause();
      sendOperation("source", {
        action: "pause",
        id: videoId,
      });
    }
  };

  const toggleLoopVideo = (videoId) => {
    setLoopVideos((prev) => {
      const isLooping = !prev[videoId];
      sendOperation("source", {
        action: "loop",
        id: videoId,
      });
      return {
        ...prev,
        [videoId]: isLooping,
      };
    });
  };

  const uploadVideo = async (file, videoName) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("videoName", videoName);

    try {
      const response = await axios.post(`http://${host}:${port}/upload`, formData, videoName, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // console.log("File uploaded successfully:", response.data.filePath);
      return response.data.filePath;
    } catch (error) {
      // console.error("Error uploading file:", error);
    }
  };

  const deleteResourceFromScene = (id) => {
    console.log("id::: ", id);
    Swal.fire({
      title: "آیا مطمئن هستید؟",
      icon: "warning",
      showCancelButton: true,
      cancelButtonText: "خیر",
      confirmButtonColor: "limegreen",
      cancelButtonColor: "#d33",
      confirmButtonText: "بله",
    }).then(async (result) => {
      if (result.isConfirmed) {
        sendOperation("source", {
          action: "remove",
          id,
          payload: {},
        });

        // updateSceneResources(getSelectedScene()?.resources.filter((res) => res.id !== id));
        setSources((prev) => prev.filter((item) => item.id !== id));

        const groupToRemove = getSelectedScene()?.layer.findOne(`#${id}`);
        if (groupToRemove) {
          groupToRemove.destroy();
          getSelectedScene()?.layer.draw();
        } else {
          // console.error(`Group with id ${id} not found`);
        }

        const videoElement = getSelectedScene()?.resources.find(
          (item) => item.id === id
        )?.videoElement;
        if (videoElement) {
          videoElement.pause();
          videoElement.src = "";
        }
      } else {
        return;
      }
    });
  };

  //---------------End-Video-Segment-----------------

  const IconSidebar = ({ modals, openModal }) => (
    <div className="absolute left-[10px] flex flex-col gap-2 top-[50px] z-[100] h-fit">
      <Tooltip showArrow={true} placement="right-start" content="منابع">
        <Button
          className={`${darkMode ? "dark" : "light"} min-w-[35px]  p-1`}
          size="sm"
          variant="solid"
          color="default"
          onPress={() => openModal("resources")}
        >
          <BsDatabaseFill size={17} />
        </Button>
      </Tooltip>
      <Tooltip showArrow={true} placement="right-start" content="صحنه‌ها">
        <Button
          className={`${darkMode ? "dark" : "light"} min-w-[35px]  p-1`}
          size="sm"
          variant="solid"
          color="default"
          onPress={() => openModal("scenes")}
        >
          <RiPagesFill size={17} />
        </Button>
      </Tooltip>
      <Tooltip showArrow={true} placement="right-start" content="مجموعه‌ها">
        <Button
          className={`${darkMode ? "dark" : "light"} min-w-[35px]  p-1`}
          size="sm"
          variant="solid"
          color="default"
          onPress={() => openModal("collections")}
        >
          <MdCollectionsBookmark size={17} />
        </Button>
      </Tooltip>
      <Tooltip showArrow={true} placement="right-start" content="منابع استفاده شده">
        <Button
          className={`${darkMode ? "dark" : "light"} min-w-[35px]  p-1`}
          size="sm"
          variant="solid"
          color="default"
          onPress={() => openModal("UsageSidebar")}
        >
          <BsDatabaseFillAdd size={17} />
        </Button>
      </Tooltip>
    </div>
  );

  // ----------------- Monotor-Setting ---------------

  const LayoutDropdownArrMonitor = () => {
    return (
      <div className="relative left-0 top-[200px] z-[100]">
        <Dropdown>
          <DropdownTrigger>
            <Button size="sm" fullWidth variant="solid" color="primary">
              چیدمان مانیتورها
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="تنظیم چیدمان"
            color="secondary"
            onAction={(key) => {
              const [rows, cols] = key.split("x").map(Number);
              arrangeMonitors(rows, cols);
            }}
          >
            <DropdownItem key="2x2">۲×۲</DropdownItem>
            <DropdownItem key="3x3">۳×۳</DropdownItem>
            <DropdownItem key="4x4">۴×۴</DropdownItem>
            <DropdownItem key="5x5">۵×۵</DropdownItem>
            <DropdownItem key="6x6">۶×۶</DropdownItem>
            <DropdownItem key="7x7">۷×۷</DropdownItem>
            <DropdownItem key="8x8">۸×۸</DropdownItem>
            <DropdownItem key="9x9">۹×۹</DropdownItem>
            <DropdownItem key="10x10">۱۰×۱۰</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    );
  };

  const MonitorLayoutModal = () => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [selectedLayout, setSelectedLayout] = useState(null);
    const [arrangedMonitors, setArrangedMonitors] = useState([]);
    const [selectedMonitors, setSelectedMonitors] = useState([]); // اضافه کردن وضعیت برای ذخیره مانیتورهای انتخاب شده

    const handleLayoutSelect = (key) => {
      const [rows, cols] = key.split("x").map(Number);
      arrangeMonitors(rows, cols);
      setSelectedLayout(key);
    };

    const arrangeMonitors = (rows, cols) => {
      let monitorIndex = 0;
      const gap = 10;
      const monitorWidth = videoWalls[0].width;
      const monitorHeight = videoWalls[0].height;

      const updatedMonitors = [];

      const newArrangedMonitors = Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => {
          if (monitorIndex >= videoWalls.length) return null;

          const x = col * (monitorWidth + gap);
          const y = row * (monitorHeight + gap);

          const monitor = videoWalls[monitorIndex];

          updatedMonitors.push({
            monitorId: monitor.id,
            position: { x, y },
          });

          monitorIndex++;
          return {
            ...monitor,
            position: { x, y },
          };
        })
      );

      setArrangedMonitors(newArrangedMonitors);
    };

    const handleMonitorSelect = (rowIndex, colIndex, selectedMonitor) => {
      const newArrangedMonitors = [...arrangedMonitors];
      newArrangedMonitors[rowIndex][colIndex] = selectedMonitor;
      setArrangedMonitors(newArrangedMonitors);

      // بروزرسانی selectedMonitors
      setSelectedMonitors((prevSelected) => [...prevSelected, selectedMonitor.id]);
    };

    const availableMonitors = (rowIndex, colIndex) => {
      // فیلتر کردن مانیتورهای قابل انتخاب (آنهایی که هنوز انتخاب نشده‌اند)
      return videoWalls.filter((wall) => !selectedMonitors.includes(wall.id));
    };

    const resetSelections = () => {
      setArrangedMonitors([]);
      setSelectedMonitors([]);
      setSelectedLayout(null);
    };

    return (
      <>
        <Button className="z-[1000]" onPress={onOpen}>
          چیدمان مانیتورها
        </Button>

        <Modal scrollBehavior="outside" isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent className="w-full">
            {(onClose) => (
              <>
                <ModalHeader>انتخاب چیدمان</ModalHeader>
                <ModalBody>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button size="sm" fullWidth variant="solid" color="primary">
                        چیدمان مانیتورها
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="تنظیم چیدمان"
                      color="secondary"
                      onAction={handleLayoutSelect}
                    >
                      <DropdownItem key="2x2">۲×۲</DropdownItem>
                      <DropdownItem key="3x3">۳×۳</DropdownItem>
                      <DropdownItem key="4x4">۴×۴</DropdownItem>
                      <DropdownItem key="5x5">۵×۵</DropdownItem>
                      <DropdownItem key="6x6">۶×۶</DropdownItem>
                      <DropdownItem key="7x7">۷×۷</DropdownItem>
                      <DropdownItem key="8x8">۸×۸</DropdownItem>
                      <DropdownItem key="9x9">۹×۹</DropdownItem>
                      <DropdownItem key="10x10">۱۰×۱۰</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>

                  {selectedLayout && (
                    <div className="monitor-layout">
                      <h3>چیدمان {selectedLayout}</h3>
                      <div
                        className="grid-layout"
                        style={{
                          display: "grid",
                          gridTemplateColumns: `repeat(${selectedLayout.split("x")[1]}, 1fr)`,
                          gap: "10px",
                          width: "100%", // استفاده از 100% عرض برای سازگاری
                        }}
                      >
                        {arrangedMonitors.map((row, rowIndex) => (
                          <div
                            key={rowIndex}
                            className="row"
                            style={{ display: "flex", flexDirection: "row" }}
                          >
                            {row.map((monitor, colIndex) => (
                              <div
                                key={colIndex}
                                className="monitor-box"
                                style={{
                                  width: "100%",
                                  height: "100px",
                                  border: "1px solid #ccc",
                                  padding: "10px",
                                }}
                              >
                                <p>{monitor ? monitor.name : "خالی"}</p>
                                <Dropdown>
                                  <DropdownTrigger>
                                    <Button size="sm" variant="solid">
                                      انتخاب مانیتور
                                    </Button>
                                  </DropdownTrigger>
                                  <DropdownMenu>
                                    {availableMonitors(rowIndex, colIndex).map((wall) => (
                                      <DropdownItem
                                        key={wall.id}
                                        onPress={() =>
                                          handleMonitorSelect(rowIndex, colIndex, wall)
                                        }
                                      >
                                        {wall.name}
                                      </DropdownItem>
                                    ))}
                                  </DropdownMenu>
                                </Dropdown>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* دکمه ریست */}
                  <Button
                    color="danger"
                    variant="outline"
                    onPress={resetSelections}
                    style={{ marginTop: "20px" }}
                  >
                    ریست کردن انتخاب‌ها
                  </Button>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    بستن
                  </Button>
                  <Button color="primary" onPress={onClose}>
                    ذخیره
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    );
  };

  const MonitorPositionEditor = ({ monitors, updateMonitorPosition }) => {
    const [selectedMonitor, setSelectedMonitor] = useState(null);
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
    const targetRef = React.useRef(null);
    const { moveProps } = useDraggable({ targetRef, isDisabled: !isOpen });

    const openModal = (monitor) => {
      setSelectedMonitor(monitor);
      setX(monitor.x);
      setY(monitor.y);
      onOpen();
    };

    const handleUpdatePosition = () => {
      if (selectedMonitor) {
        updateMonitorPosition(selectedMonitor.id, x, y);
        setSelectedMonitor(null);
        onClose();
      }
    };

    return (
      <div className="relative left-0 top-[200px] z-[100] h-[200px] overflow-y-scroll">
        <div className="flex flex-col  gap-2 bg-gray-700 rounded  overflow-scroll">
          {monitors.map((monitor) => (
            // <Tooltip content={`تغییر مانیتور ${monitor.name}`} key={monitor.id}>
            <Button size="sm" color="primary" onPress={() => openModal(monitor)} className="m-1">
              مانیتور {monitor.numberMonitor}
            </Button>
            // </Tooltip>
          ))}
        </div>

        <Modal ref={targetRef} isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader {...moveProps} className="flex flex-col gap-1">
                  تنظیم موقعیت مانیتور
                </ModalHeader>
                <ModalBody>
                  <div className="flex flex-col gap-4">
                    <Input
                      type="number"
                      label="مقدار X"
                      value={x}
                      onChange={(e) => setX(Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      label="مقدار Y"
                      value={y}
                      onChange={(e) => setY(Number(e.target.value))}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    بستن
                  </Button>
                  <Button color="primary" onPress={handleUpdatePosition}>
                    تنظیم
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    );
  };
  const updateMonitorPosition = (id, newX, newY) => {
    let hasCollision = false;

    const updatedVideoWalls = videoWalls.map((monitor) => {
      if (monitor.id === id) {
        const targetRect = { x: newX, y: newY, width: monitor.width, height: monitor.height };

        videoWalls.forEach((otherMonitor) => {
          if (otherMonitor.id === id) return;

          const otherRect = {
            x: otherMonitor.x,
            y: otherMonitor.y,
            width: otherMonitor.width,
            height: otherMonitor.height,
          };

          if (
            !(
              targetRect.x + targetRect.width <= otherRect.x ||
              targetRect.x >= otherRect.x + otherRect.width ||
              targetRect.y + targetRect.height <= otherRect.y ||
              targetRect.y >= otherRect.y + otherRect.height
            )
          ) {
            hasCollision = true;
          }
        });

        if (hasCollision) return monitor;

        updateKonvaMonitorPosition(getSelectedScene()?.layer, id, newX, newY);

        return { ...monitor, x: newX, y: newY };
      }
      return monitor;
    });

    if (hasCollision) {
      Swal.fire({
        title: "خطا",
        text: "موقعیت جدید باعث برخورد مانیتورها می‌شود.",
        icon: "error",
        confirmButtonText: "باشه",
      });
    } else {
      arrangeMForScenes(updatedVideoWalls);
      setVideoWalls(updatedVideoWalls); // به‌روزرسانی state اگر برخوردی وجود نداشت
    }
  };

  const updateKonvaMonitorPosition = (layer, id, newX, newY) => {
    const monitorGroup = layer.findOne(`#monitor-group-${id}`);
    if (monitorGroup) {
      monitorGroup.position({ x: newX, y: newY });

      const text = monitorGroup.findOne(".monitorText");
      if (text) {
        text.text(`Monitor ${id}\nX: ${newX}, Y: ${newY}`);
      }

      layer.draw();
    }
  };
  return (
    <main
      className={`${
        darkMode ? "bg-[#1E232A]" : "bg-[#e3e4e4]"
      }  h-screen w-full flex flex-col z-50  items-center `}
    >
      {isLoading && (
        <div className="w-full z-[1000000] flex flex-col gap-3 justify-center items-center h-screen fixed left-0 right-0 top-0 bottom-0  m-auto backdrop-blur-[5px]">
          <Spinner size="lg" />
          <div className={`vazirblack  ${darkMode ? "text-white" : "text-black"}`}>
            لطفا صبر کنید عملیات در حال انجام است
          </div>
        </div>
      )}
      <HeaderBar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        connecting={connecting}
        toggleLayout={() => {
          localStorage.setItem("layout", !isToggleLayout);
          setIsToggleLayout(!isToggleLayout);
        }}
        isToggleLayout={isToggleLayout}
        setVideoWalls={setVideoWalls}
        setInputs={setInputs}
        addMonitorsToScenes={addMonitorsToScenes}
        setCollections={setCollections}
        addResource={addResource}
        collections={collections}
        scenes={scenes}
        inputs={inputs}
        videoWalls={videoWalls}
        setScenes={setScenes}
        sources={sources}
        connectionMode={connectionMode}
        setConnectionMode={setConnectionMode}
        isToggleVideoWall={isToggleVideoWall}
        setIsToggleVideoWall={setIsToggleVideoWall}
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
            onClick={(e) => {
              con.setIsActiveG("un");
            }}
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
          <IconSidebar openModal={openModal} />
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
                {/* Usage of Resources Sidebar */}
                <UsageSidebar
                  resources={sources.filter((item) => item.sceneId === getSelectedScene().id)}
                  darkMode={darkMode}
                  allDataMonitors={allDataMonitors}
                  fitToMonitors={fitToMonitors}
                  addVideo={addVideo}
                  playVideo={playVideo}
                  pauseVideo={pauseVideo}
                  toggleLoopVideo={toggleLoopVideo}
                  moveResource={moveResource}
                  deleteResource={deleteResource}
                  loopVideos={loopVideos}
                  addResource={addResource}
                  addText={addText}
                  addImage={addImage}
                  editText={editText}
                  updateResourceName={updateResourceName}
                  updateResourceColor={updateResourceColor}
                  addWeb={addWeb}
                  editWeb={editWeb}
                  inputs={inputs}
                  addInput={addInput}
                  deleteResourceFromScene={deleteResourceFromScene}
                />
                {/* Sources Sidebar */}
                <ResourcesSidebar
                  resources={getSelectedScene()?.resources}
                  darkMode={darkMode}
                  allDataMonitors={allDataMonitors}
                  fitToMonitors={fitToMonitors}
                  addVideo={addVideo}
                  playVideo={playVideo}
                  pauseVideo={pauseVideo}
                  toggleLoopVideo={toggleLoopVideo}
                  moveResource={moveResource}
                  deleteResource={deleteResource}
                  loopVideos={loopVideos}
                  addResource={addResource}
                  addText={addText}
                  addImage={addImage}
                  editText={editText}
                  updateResourceName={updateResourceName}
                  updateResourceColor={updateResourceColor}
                  addWeb={addWeb}
                  editWeb={editWeb}
                  inputs={inputs}
                  addInput={addInput}
                  deleteResourceFromScene={deleteResourceFromScene}
                  videoWalls={videoWalls}
                />
                {/* Scenes Sidebar */}
                <ScenesSidebar
                  scenes={filteredScenes} // Use filteredScenes instead of all scenes
                  darkMode={darkMode}
                  selectedScene={selectedScene}
                  setSelectedScene={setSelectedScene}
                  addScene={addScene}
                  editingSceneId={editingSceneId}
                  setEditingSceneId={setEditingSceneId}
                  handleEditSceneName={handleEditSceneName}
                  deleteScene={deleteScene}
                />

                {/* CollectionsSidebar Sidebar */}
                <CollectionsSidebar
                  scenes={scenes}
                  darkMode={darkMode}
                  collections={collections}
                  setCollections={setCollections}
                  setSelectedCollection={setSelectedCollection} // Pass setter function
                  selectedCollection={selectedCollection} // Pass selected collection
                  setSelectedScene={setSelectedScene} // Pass setSelectedScene function
                  filteredScenes={filteredScenes}
                />
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
            <ResourcesSidebar
              resources={getSelectedScene()?.resources}
              darkMode={darkMode}
              allDataMonitors={allDataMonitors}
              fitToMonitors={fitToMonitors}
              addVideo={addVideo}
              playVideo={playVideo}
              pauseVideo={pauseVideo}
              toggleLoopVideo={toggleLoopVideo}
              moveResource={moveResource}
              deleteResource={deleteResource}
              loopVideos={loopVideos}
              addResource={addResource}
              addText={addText}
              addImage={addImage}
              editText={editText}
              updateResourceName={updateResourceName}
              updateResourceColor={updateResourceColor}
              addWeb={addWeb}
              editWeb={editWeb}
              inputs={inputs}
              addInput={addInput}
              deleteResourceFromScene={deleteResourceFromScene}
              videoWalls={videoWalls}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal scrollBehavior="outside" isOpen={activeModal === "UsageSidebar"} onClose={closeModal}>
        <ModalContent>
          <ModalBody className="p-0">
            <UsageSidebar
              resources={sources.filter((item) => item.sceneId === getSelectedScene().id)}
              darkMode={darkMode}
              allDataMonitors={allDataMonitors}
              fitToMonitors={fitToMonitors}
              addVideo={addVideo}
              playVideo={playVideo}
              pauseVideo={pauseVideo}
              toggleLoopVideo={toggleLoopVideo}
              moveResource={moveResource}
              deleteResource={deleteResource}
              loopVideos={loopVideos}
              addResource={addResource}
              addText={addText}
              addImage={addImage}
              editText={editText}
              updateResourceName={updateResourceName}
              updateResourceColor={updateResourceColor}
              addWeb={addWeb}
              editWeb={editWeb}
              inputs={inputs}
              addInput={addInput}
              deleteResourceFromScene={deleteResourceFromScene}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal scrollBehavior="outside" isOpen={activeModal === "scenes"} onClose={closeModal}>
        <ModalContent>
          <ModalBody className="p-0">
            <ScenesSidebar
              scenes={filteredScenes} // Use filteredScenes instead of all scenes
              darkMode={darkMode}
              selectedScene={selectedScene}
              setSelectedScene={setSelectedScene}
              addScene={addScene}
              editingSceneId={editingSceneId}
              setEditingSceneId={setEditingSceneId}
              handleEditSceneName={handleEditSceneName}
              deleteScene={deleteScene}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal scrollBehavior="outside" isOpen={activeModal === "collections"} onClose={closeModal}>
        <ModalContent>
          <ModalBody className="p-0">
            <CollectionsSidebar
              scenes={scenes}
              darkMode={darkMode}
              collections={collections}
              setCollections={setCollections}
              setSelectedCollection={setSelectedCollection} // Pass setter function
              selectedCollection={selectedCollection} // Pass selected collection
              setSelectedScene={setSelectedScene} // Pass setSelectedScene function
              filteredScenes={filteredScenes}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </main>
  );
}

export default App;
