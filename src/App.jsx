import React, { useEffect, useMemo, useRef, useState } from "react";

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
  // console.log("videoWalls::: ", videoWalls);

  const [activeModal, setActiveModal] = useState(null);
  const openModal = (modalType) => setActiveModal(modalType);
  const closeModal = () => setActiveModal(null);
  const [isToggleLayout, setIsToggleLayout] = useState(false);
  const [isToggleVideoWall, setIsToggleVideoWall] = useState(false);

  const [loopVideos, setLoopVideos] = useState({});

  const [darkMode, setDarkMode] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionMode, setConnectionMode] = useState(false);
  const [inputs, setInputs] = useState([]);
  //New-Commands

  const [scenes, setScenes] = useState([
    { id: 1, name: "صحنه 1", resources: [], stageData: null, layer: new Konva.Layer() },
  ]);
  const scenesRef = useRef(scenes);
  const videoWallsRef = useRef(videoWalls);

  console.log("scenes::: ", scenes);
  // console.log("scenes::: ", scenes);

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
  console.log("collections::: ", collections);

  const [selectedCollection, setSelectedCollection] = useState(1);
  const [sources, setSources] = useState([]);

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
  let pendingOperations = [];

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

    stage.position({ x: 20, y: 20 });
    stage.scale({ x: 0.37, y: 0.37 });

    anim = new Konva.Animation(() => {}, newLayer);

    stage.add(isLayer ?? newLayer);
    motherLayer = newLayer;
    motherStage = stage;
    return { stage, layer: isLayer ?? newLayer };
  };

  const sendOperation = (action, payload) => {
    if (connectionMode) {
      socket.emit(action, payload);
    } else {
      pendingOperations.push({ action, payload });
      // console.log("Operation added to pending queue:", { action, payload });
    }
  };

  const addMonitorsToScenes = (jsonData) => {
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
          id: `monitor-group-${monitor.id}`,
          catFix: "monitor",
        });

        const rect = new Konva.Rect({
          x: 0,
          y: 0,
          catFix: "monitor",
          width: monitor.width,
          height: monitor.height,
          fill: "#161616",
          stroke: "white",
          name: "fillShape",
          strokeWidth: 3,
          id: `monitor-${index}`,
        });

        const text = new Konva.Text({
          x: 10,
          y: 10,
          text: `Monitor ${index + 1}\nX: ${monitor.x}, Y: ${monitor.y}`,
          fontSize: 50,
          fill: "white",
          align: "left",
          verticalAlign: "top",
          name: "monitorText",
        });

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
              rect.fill("#161616");
              layer.draw();
            }, 500);
            e.target.position(previousPosition);
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
      return scene;
    });

    setScenes(updatedScenes);
  };

  useEffect(() => {
    scenesRef.current = scenes;
  }, [scenes]);

  useEffect(() => {
    videoWallsRef.current = videoWalls;
  }, [videoWalls]);

  const arrangeMForScenes = (updatedVideoWalls) => {
    const updatedScenesIn = scenesRef.current.map((scene) => {
      const layer = scene.layer;
      if (!layer) return scene;

      const monitors = layer.children;

      monitors.forEach((group) => {
        console.log("group::: ", group);
        if (group.attrs.catFix === "monitor") {
          group.draggable(isToggleVideoWall);

          const monitorId = parseInt(group.id().split("-")[2], 10);
          const matchingWall = updatedVideoWalls.find((wall) => wall.id === monitorId);

          if (matchingWall) {
            const { x: newX, y: newY } = matchingWall;
            group.position({ x: newX, y: newY });

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
    const updatedScenes = scenes.map((scene) => {
      const layer = scene.layer;

      if (!layer) return scene;

      const monitors = layer.children;
      const totalMonitors = monitors.length;
      const monitorWidth = 1920;
      const monitorHeight = 1080;
      const gap = 10;

      let id = 0;

      const updatedVideoWalls = [...videoWalls];

      // چیدمان مانیتورها
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (id >= totalMonitors) break;

          const x = col * (monitorWidth + gap);
          const y = row * (monitorHeight + gap);

          const group = monitors[id];
          group.position({ x, y });

          // به‌روزرسانی متن
          const textNode = group.findOne("Text");
          if (textNode) {
            textNode.text(`Monitor ${id + 1}\nX: ${x}, Y: ${y}`);
          }

          // به‌روزرسانی موقعیت در videoWalls
          const monitorIndex = updatedVideoWalls.findIndex(
            (m) => m.id === parseInt(group.id().split("-")[2], 10)
          );
          if (monitorIndex !== -1) {
            updatedVideoWalls[monitorIndex] = { ...updatedVideoWalls[monitorIndex], x, y };
          }

          id++;
        }
      }

      layer.draw();
      setVideoWalls(updatedVideoWalls);
      return scene;
    });

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
        id: `monitor-group-${monitor.id}`,
        catFix: "monitor",
      });

      const rect = new Konva.Rect({
        x: 0,
        y: 0,
        catFix: "monitor",
        width: monitor.width,
        height: monitor.height,
        fill: "#161616",
        stroke: "white",
        name: "fillShape",
        strokeWidth: 3,
        id: `monitor-${index}`,
      });

      const text = new Konva.Text({
        x: 10,
        y: 10,
        text: `Monitor ${index + 1}\nX: ${monitor.x}, Y: ${monitor.y}`,
        fontSize: 50,
        fill: "white",
        align: "left",
        verticalAlign: "top",
        name: "monitorText",
      });
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
            rect.fill("#161616"); // بازگشت به رنگ اولیه
            layer.draw();
          }, 500); // پس از ۵۰۰ میلی‌ثانیه بازگشت به رنگ اولیه
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

  // useEffect(() => {
  //   socket = io(`http://${host}:${port}`);

  //   socket.on("connect", () => {
  //     setConnecting(true);
  //     while (pendingOperations.length > 0) {
  //       const operation = pendingOperations.shift();
  //       socket.emit(operation.action, operation.payload);
  //     }
  //   });

  //   socket.on("disconnect", () => {
  //     setConnecting(false);
  //   });

  //   return () => {
  //     if (socket) {
  //       socket.disconnect();
  //     }
  //   };
  // }, []);

  // useEffect(() => {
  //   async function fetchData() {
  //     axios
  //       .get("/config.json")
  //       .then((res) => res.data)
  //       .then((data) => {
  //         // console.log(`Updating config(Host: ${data.host}, Port: ${data.port})`);
  //         if (data.host) host = data.host;
  //         if (data.port) port = data.port;
  //         // TODO: use host and port
  //         socket = io(`http://${data.host}:${data.port}`);
  //         socket.on("connect", () => {
  //           // console.log("Connected to server");
  //           setConnecting(true);
  //         });

  //         socket.on("source_added", ({ actoin, payload }) => {
  //           // console.log("payload::: ", payload);
  //           // console.log("actoin::: ", actoin);
  //         });

  //         socket.on("init", (data) => {
  //           // console.log("INIT DATA: ", data);

  //           if (data.inputs) {
  //             let newStruct = [];
  //             data.inputs.forEach((item) => {
  //               newStruct.push({
  //                 id: item.deviceId,
  //                 deviceId: item.deviceId,
  //                 width: item.width,
  //                 height: item.height,
  //                 name: item.label,
  //               });
  //             });
  //             // console.log("newStruct::: ", newStruct);
  //             setInputs(newStruct);
  //           }

  //           // if (data.files) {
  //           //   data.files.forEach((items) => {
  //           //     const fileNameWithExtension = items;
  //           //     const fileName = fileNameWithExtension.split(".").slice(0, -1).join(".");
  //           //     const modifiedVideoURL = generateBlobURL(`http://${host}:${port}`, fileName);
  //           //     const makeVideo = document.createElement("video");
  //           //     makeVideo.src = modifiedVideoURL;
  //           //     makeVideo.setAttribute("id", fileName);

  //           //     updateSceneResources([
  //           //       { type: "video", name: fileName, videoElement: makeVideo },
  //           //       ...getSelectedScene(),
  //           //     ]);
  //           //   });
  //           // }

  //           if (data.displays) {
  //             let newStruct = [];

  //             data.displays.forEach((item) => {
  //               newStruct.push({
  //                 id: item.id,
  //                 x: item.bounds.x,
  //                 y: item.bounds.y,
  //                 width: item.bounds.width,
  //                 height: item.bounds.height,
  //                 name: item.label,
  //               });
  //             });
  //             setVideoWalls(newStruct);
  //             addMonitorsToScenes(newStruct);
  //           }
  //         });

  //         socket.on("update-event", (data) => {
  //           // console.log("Update event received:", data);
  //         });

  //         socket.on("update-cameras", (data) => {
  //           // console.log("Camera List:", data);
  //           setInputs(data);
  //         });

  //         var width = window.innerWidth;
  //         var height = window.innerHeight;
  //         stage = new Konva.Stage({
  //           container: "containerKonva",
  //           width: width,
  //           height: height,
  //           draggable: true,
  //         });

  //         layer = new Konva.Layer();
  //         stage.add(layer);
  //         // console.log("Listening on update monitors");

  //         anim = new Konva.Animation(() => {}, layer);

  //         layer.on("dragmove", function (e) {
  //           var absPos = e.target.absolutePosition();
  //           e.target.absolutePosition(absPos);

  //           var target = e.target;
  //           var targetRect = e.target.getClientRect();
  //           layer.children.forEach(function (group) {
  //             if (group === target) return;
  //             if (haveIntersection(group.getClientRect(), targetRect)) {
  //               if (group instanceof Konva.Group) {
  //                 const shape = group.findOne(".fillShape");
  //                 if (shape) {
  //                   shape.stroke("red");
  //                   let x = arrayCollisions.find((item) => item == shape.getAttr("id"));
  //                   if (!x) arrayCollisions.push(shape.getAttr("id"));
  //                 }
  //               }
  //             } else {
  //               if (group instanceof Konva.Group) {
  //                 const shape = group.findOne(".fillShape");
  //                 if (shape) {
  //                   let x = arrayCollisions.find((item) => item == shape.getAttr("id"));
  //                   if (x) {
  //                     let y = arrayCollisions.indexOf(x);
  //                     if (y !== -1) arrayCollisions.splice(y, 1);
  //                   }
  //                   shape.stroke("white");
  //                 }
  //               }
  //             }
  //           });

  //           // let searchIndexArray = e.target.children[0].getAttr("id");
  //         });

  //         layer.on("dragend", function (e) {
  //           layer.find(".guid-line").forEach((l) => l.destroy());
  //         });

  //         function haveIntersection(r1, r2) {
  //           return !(
  //             r2.x > r1.x + r1.width ||
  //             r2.x + r2.width < r1.x ||
  //             r2.y > r1.y + r1.height ||
  //             r2.y + r2.height < r1.y
  //           );
  //         }
  //       })
  //       .catch((err) => // console.warn("Failed to fetch config.json", err));
  //   }

  //   fetchData();

  //   // let newStruct = [];

  //   // [
  //   //   { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, name: "dd1", id: "1" },
  //   //   { bounds: { x: 1920, y: 0, width: 1920, height: 1080 }, name: "dd1", id: "2" },
  //   // ].forEach((item) => {
  //   //   newStruct.push({
  //   //     id: item.id,
  //   //     x: item.bounds.x,
  //   //     y: item.bounds.y,
  //   //     width: item.bounds.width,
  //   //     height: item.bounds.height,
  //   //     name: item.label,
  //   //   });
  //   // });

  //   // setVideoWalls(newStruct);
  //   // addMonitorsToScenes(newStruct);

  //   return () => {
  //     if (getSelectedScene()?.stageData) getSelectedScene()?.stageData.destroy();
  //     if (motherLayer) motherLayer.destroy();
  //     // socket.off("update-monitors");
  //     // socket.off("connect");
  //     // socket.off("update-event");
  //   };
  // }, [connectionMode]);

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

  useEffect(() => {
    if (socket) {
      socket.on("displays_updated", (updatedDisplays) => {
        console.log("🟠 Updated displays received from server:", updatedDisplays);

        updatedDisplays.forEach((display) => {
          const layer = scenes[0].layer; // فرض بر اینکه فقط یک لایه دارید
          const group = layer.findOne(`#monitor-group-${display.id}`);

          if (group) {
            const rect = group.findOne("Rect");
            const text = group.findOne(".monitorText");

            if (!display.connected) {
              // مانیتور قطع شده
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
              // مانیتور متصل است
              if (rect) rect.fill("#161616");
              if (text) text.text(`Monitor ${display.id}`);
              const disconnectIcon = group.findOne(".disconnectIcon");
              if (disconnectIcon) disconnectIcon.destroy();
            }
          }

          layer.draw();
        });
      });
    }
  }, [socket, scenes]);

  // AmirHossein Solutions .. ->
  // useEffect(() => {
  //   if (socket) {
  //     socket.on("display_error", (disconnectedIds) => {
  //       console.log("🟠 Disconnected monitor IDs received:", disconnectedIds);

  //       const disconnectedSet = new Set(disconnectedIds); // تبدیل به Set برای بررسی سریع

  //       scenes.forEach((scene) => {
  //         const layer = scene.layer; // دسترسی به لایه مربوطه
  //         if (!layer) return;

  //         layer.children.forEach((group) => {
  //           if (group.attrs.catFix === "monitor") {
  //             const monitorId = parseInt(group.id().split("-")[2], 10); // استخراج آی‌دی مانیتور
  //             const rect = group.findOne("Rect");
  //             const text = group.findOne(".monitorText");
  //             const disconnectIcon = group.findOne(".disconnectIcon");

  //             if (disconnectedSet.has(monitorId)) {
  //               // مانیتور قطع شده
  //               if (rect) rect.fill("red");
  //               if (text) text.text(`Monitor ${monitorId} (Disconnected)`);
  //               if (!disconnectIcon) {
  //                 const newDisconnectIcon = new Konva.Text({
  //                   text: "❌",
  //                   fontSize: 30,
  //                   fill: "white",
  //                   x: rect.width() / 2 - 15,
  //                   y: rect.height() / 2 - 15,
  //                   name: "disconnectIcon",
  //                 });
  //                 group.add(newDisconnectIcon);
  //               }
  //             } else {
  //               // مانیتور متصل است
  //               if (rect) rect.fill("#161616");
  //               if (text) text.text(`Monitor ${monitorId}`);
  //               if (disconnectIcon) disconnectIcon.destroy();
  //             }
  //           }
  //         });

  //         layer.draw(); // بازسازی لایه
  //       });
  //     });
  //   }

  //   return () => {
  //     if (socket) {
  //       socket.off("displays_error");
  //     }
  //   };
  // }, [socket, scenes]);

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

        socket.on("connect", () => {
          // console.log("Socket connected");
          setConnecting(true);

          while (pendingOperations.length > 0) {
            const operation = pendingOperations.shift();
            socket.emit(operation.action, operation.payload);
          }
        });

        socket.on("disconnect", () => {
          // console.log("Socket disconnected");
          setConnecting(false);
        });

        // سایر رویدادها
        socket.on("source_added", ({ actoin, payload }) => {
          // console.log("payload::: ", payload);
          // console.log("actoin::: ", actoin);
        });

        socket.on("init", (data) => {
          // console.log("INIT DATA: ", data);

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
            const displays = data.displays.map((item) => ({
              id: item.id,
              x: item.bounds.x,
              y: item.bounds.y,
              width: item.bounds.width,
              height: item.bounds.height,
              // x: item.x,
              // y: item.y,
              // width: item.width,
              // height: item.height,
              name: item.label,
            }));
            setVideoWalls(displays);
            addMonitorsToScenes(displays);
          }
        });

        socket.on("update-event", (data) => {
          // console.log("Update event received:", data);
        });

        socket.on("update-cameras", (data) => {
          // console.log("Camera List:", data);
          setInputs(data);
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

  const fitToMonitors = (id, selectedMonitors) => {
    const videoGroup = getSelectedScene()?.layer.findOne(`#${id}`);

    if (videoGroup) {
      const firstMonitor = allDataMonitors[selectedMonitors[0]];
      const lastMonitor = allDataMonitors[selectedMonitors[selectedMonitors.length - 1]];

      const x = firstMonitor.x;
      const y = firstMonitor.y;
      const width = lastMonitor.x + lastMonitor.width - firstMonitor.x;
      const height = lastMonitor.y + lastMonitor.height - firstMonitor.y;

      videoGroup.position({ x, y });

      if (videoGroup) {
        videoGroup.width(width);
        videoGroup.height(height);
        videoGroup.setAttr("rotation", 0);

        getSelectedScene()?.layer.draw();
      }
      const modifiedVideoURL = generateBlobURL(`video:http://${host}:${port}`, id);

      sendOperation("source", {
        action: "resize",
        id: id,
        payload: {
          source: modifiedVideoURL,
          x: x,
          y: y,
          width: width,
          height: height,
          rotation: "0",
        },
      });
      // allData = allData.map((item) => {
      //   if (item.id === id) {
      //     return {
      //       ...item,
      //       x: x,
      //       y: y,
      //       width: width,
      //       height: height,
      //     };
      //   }
      //   return item;
      // });
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

    if (file) {
      const fileType = file.type.split("/")[0];
      if (fileType === "image" && type === "image") {
        const imageURL = URL.createObjectURL(file);
        let img = new Image();
        img.src = imageURL;
        const id = crypto.randomUUID();
        const imageName = "image" + counterImages++;

        img.addEventListener("load", () => {
          let newResource = {
            type: "image",
            id,
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
        // console.log("sourceName::: ", sourceName);
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
          z: 0,
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

  const addImage = (img) => {
    let uniqId = crypto.randomUUID();
    const selectedSceneLayer = getSelectedScene()?.layer;
    if (!selectedSceneLayer) return;
    const modifiedImageURL = generateBlobURL(`image:http://${host}:${port}`, img.id);

    const image = new Konva.Image({
      image: img.imageElement,
      width: img.imageElement.width,
      height: img.imageElement.height,
      name: "object",
      id: img.id,
      uniqId,
      draggable: true,
    });

    const transformer = new Konva.Transformer({
      nodes: [image],
      enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
      rotateEnabled: true,
    });

    image.on("click", () => {
      selectedSceneLayer.add(transformer);
      transformer.attachTo(image);
      selectedSceneLayer.draw();
    });

    image.on("dragend", (e) => {
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
        payload: { source: modifiedImageURL, x: image.x(), y: image.y() },
      });
    });

    image.on("transformend", (e) => {
      const newWidth = image.width() * image.scaleX();
      const newHeight = image.height() * image.scaleY();
      image.width(newWidth);
      image.height(newHeight);
      image.scaleX(1);
      image.scaleY(1);

      const rotation = Math.round(image.getAttr("rotation"));
      const x = image.x();
      const y = image.y();

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

      // updateResourceInState(img.id, {
      //   x,
      //   y,
      //   width: newWidth,
      //   height: newHeight,
      //   rotation,
      // });
    });

    setSources((prev) => [...prev, { ...img, uniqId, sceneId: getSelectedScene().id }]);

    selectedSceneLayer.add(image);
    selectedSceneLayer.draw();
  };

  const addInput = (input) => {
    let uniqId = crypto.randomUUID();

    const selectedSceneLayer = getSelectedScene()?.layer;
    if (!selectedSceneLayer) return;

    const group = new Konva.Group({
      x: 0,
      y: 0,
      draggable: true,
      id: `${input.id}`,
      type: "input",
      uniqId,
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
      fontSize: 14,
      fill: "black",
    });

    group.add(rect);
    group.add(text);

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
      },
    });

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

  const updateResourceName = (resourceId, newName) => {
    setScenes((prevScenes) =>
      prevScenes.map((scene) => {
        if (scene.id === selectedScene) {
          const updatedResources = scene.resources.map((resource) =>
            resource.id === resourceId ? { ...resource, name: newName, content: newName } : resource
          );
          return { ...scene, resources: updatedResources };
        }
        return scene;
      })
    );
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

  const addVideo = (videoElement) => {
    const id = videoElement.getAttribute("id");
    const selectedSceneLayer = getSelectedScene()?.layer;
    const selectedStage = getSelectedScene()?.stageData;
    let uniqId = crypto.randomUUID();

    if (!selectedSceneLayer || !selectedStage) return;

    // const modifiedVideoURL = generateBlobURL(`video:http://localhost:${port}`, id);
    const modifiedVideoURL = `video:http://localhost:${port}/${id}`;

    sendOperation("source", {
      action: "add",
      id: uniqId,
      payload: {
        source: modifiedVideoURL,
        x: 0,
        y: 0,
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
      },
    });

    const image = new Konva.Image({
      image: videoElement,
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
      name: "object",
      fill: "gray",
      id: id,
      draggable: true,
      uniqId,
    });

    const positionText = new Konva.Text({
      x: 0,
      y: -50,
      text: `x: 0, y: 0, width: ${videoElement.videoWidth}, height: ${videoElement.videoHeight}`,
      fontSize: 34,
      fill: "white",
    });

    const resetIcon = new Konva.Text({
      x: 0,
      y: -100,
      text: "🔄",
      fontSize: 34,
    });

    resetIcon.on("click", () => {
      image.position({ x: 0, y: 0 });
      image.width(videoElement.videoWidth);
      image.height(videoElement.videoHeight);
      positionText.text(
        `x: 0, y: 0, width: ${videoElement.videoWidth}, height: ${videoElement.videoHeight}`
      );
      selectedSceneLayer.draw();
      image.setAttr("rotation", 0);

      allData = allData.map((item) => {
        if (item.id === id) {
          sendOperation("source", {
            action: "resize",
            id,
            payload: {
              source: modifiedVideoURL,
              x: 0,
              y: 0,
              width: image.width(),
              height: image.height(),
              rotation: "0",
            },
          });
          return { ...item, x: 0, y: 0, width: image.width(), height: image.height() };
        }
        return item;
      });
    });

    setSources((prev) => [...prev, { ...inputs, uniqId, sceneId: getSelectedScene().id }]);

    selectedSceneLayer.add(image);
    selectedStage.add(selectedSceneLayer);

    const transformer = new Konva.Transformer({
      nodes: [image],
      enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
      rotateEnabled: true,
    });

    image.on("click", () => {
      selectedSceneLayer.add(transformer);
      transformer.attachTo(image);
      selectedSceneLayer.draw();
    });

    // allData.push({
    //   monitor: [1],
    //   x: 0,
    //   y: 0,
    //   width: videoElement.videoWidth,
    //   height: videoElement.videoHeight,
    //   name: videoElement.name,
    //   id: id,
    // });

    transformer.on("transformend", (e) => {
      const newWidth = image.width() * image.scaleX();
      const newHeight = image.height() * image.scaleY();
      image.width(newWidth);
      image.height(newHeight);
      image.scaleX(1);
      image.scaleY(1);

      const rotation = Math.round(image.getAttr("rotation"));
      const x = image.x();
      const y = image.y();

      // positionText.text(
      //   `x: ${x}, y: ${y}, width: ${newWidth}, height: ${newHeight}, rotation: ${rotation}`
      // );

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

      // allData = allData.map((item) => {
      //   if (item.id === id) {
      //     sendOperation("source", {
      //       action: "resize",
      //       id,
      //       payload: {
      //         source: modifiedVideoURL,
      //         x,
      //         y,
      //         width: newWidth,
      //         height: newHeight,
      //         rotation,
      //       },
      //     });
      //     return { ...item, x, y, width: newWidth, height: newHeight };
      //   }
      //   return item;
      // });
    });

    image.on("dragend", (e) => {
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
        payload: { x: image.x(), y: image.y() },
      });

      selectedSceneLayer.draw();
    });

    videoElement.loop = loopVideos[videoElement.name] || false;
  };

  const playVideo = (videoName) => {
    const video = getSelectedScene()?.resources.find((item) => item.id === videoName)?.videoElement;
    // console.log("video::: ", video);
    if (video) {
      video.play();
      // sendOperation("source", {
      //   action: "play",
      //   id: videoName,
      // });

      // console.log("anim::: ", anim);
      anim.start();
    }
  };

  const pauseVideo = (videoName) => {
    const video = getSelectedScene()?.resources.find((item) => item.id === videoName)?.videoElement;
    if (video) {
      video.pause();
      sendOperation("source", {
        action: "pause",
        id: videoName,
      });
    }
  };

  const toggleLoopVideo = (videoName) => {
    setLoopVideos((prev) => {
      const isLooping = !prev[videoName];
      sendOperation("source", {
        action: "loop",
        id: videoName,
      });
      return {
        ...prev,
        [videoName]: isLooping,
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
        // sendOperation("source", {
        //   action: "remove",
        //   id,
        //   payload: {},
        // });

        // updateSceneResources(getSelectedScene()?.resources.filter((res) => res.id !== id));
        setSources((prev) => prev.filter((item) => item.uniqId == id));

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

  // const addToScene = ({ deviceId, width, height }) => {
  //   const x = 0;
  //   const y = 0;
  //   const id = crypto.randomUUID();

  //   const inputGroup = new Konva.Group({
  //     x: x,
  //     y: y,
  //     draggable: true,
  //     id: `input-${deviceId}`,
  //   });

  //   const rect = new Konva.Rect({
  //     x: 0,
  //     y: 0,
  //     width: width,
  //     height: height,
  //     fill: "blue",
  //     stroke: "white",
  //     strokeWidth: 2,
  //   });

  //   inputGroup.add(rect);

  //   layer.add(inputGroup);
  //   layer.draw();

  //   const transformer = new Konva.Transformer({
  //     nodes: [inputGroup],
  //     enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
  //     rotateEnabled: true,
  //   });

  //   layer.add(transformer);
  //   layer.draw();

  //   transformer.on("transformend", (e) => {
  //     const scaleX = e.target.attrs.scaleX;
  //     const scaleY = e.target.attrs.scaleY;
  //     const newWidth = rect.width() * scaleX;
  //     const newHeight = rect.height() * scaleY;

  //     sendOperation("source", {
  //       action: "resize",
  //       id,
  //       payload: {
  //         x: e.target.attrs.x,
  //         y: e.target.attrs.y,
  //         width: newWidth,
  //         height: newHeight,
  //         rotation: e.target.attrs.rotation,
  //       },
  //     });
  //   });

  //   inputGroup.on("dragend", (e) => {
  //     sendOperation("source", {
  //       action: "move",
  //       id,
  //       payload: {
  //         x: e.target.attrs.x,
  //         y: e.target.attrs.y,
  //       },
  //     });
  //   });

  //   inputGroup.on("click", () => {
  //     transformer.attachTo(inputGroup);
  //     layer.draw();
  //   });

  //   stage.on("click", (e) => {
  //     if (e.target === stage || e.target === layer) {
  //       transformer.detach();
  //       layer.draw();
  //     }
  //   });

  //   sendOperation("source", {
  //     action: "add",
  //     id,
  //     payload: { x, y, width, height, source: `input:${deviceId}` },
  //   });
  // };

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

  const LayoutDropdown = () => {
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
            <Tooltip content={`تغییر مانیتور ${monitor.name}`} key={monitor.id}>
              <Button size="sm" color="primary" onPress={() => openModal(monitor)} className="m-1">
                Monitor {monitor.id}
              </Button>
            </Tooltip>
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
      <HeaderBar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        connecting={connecting}
        toggleLayout={() => setIsToggleLayout(!isToggleLayout)}
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
          <LayoutDropdown />
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
