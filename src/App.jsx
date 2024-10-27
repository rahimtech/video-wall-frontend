import React, { useCallback, useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faL, faTrash } from "@fortawesome/free-solid-svg-icons";
import ModalCustom from "./components/OLD/ModalCustom";
import {
  Button,
  Checkbox,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip,
} from "@nextui-org/react";
import {
  FaPlus,
  FaMoon,
  FaSun,
  FaTrashAlt,
  FaArrowUp,
  FaArrowDown,
  FaAngleDown,
  FaAngleUp,
  FaSyncAlt,
  FaPlay,
  FaPause,
  FaAndroid,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { useMyContext } from "./context/MyContext";
import axios from "axios";
import SwitchCustom from "./components/SwitchCustom";
import Setting from "./components/OLD/Setting";
import Select from "react-select";
import io, { connect } from "socket.io-client";
import config from "../public/config.json";
import DraggableResizableIframe from "./DraggableResizableIframe";
import ModalMonitorSelection from "./components/ModalMonitorSelection";
import { IoIosAddCircle } from "react-icons/io";
import { MdAdd, MdAddBox } from "react-icons/md";
import ResourcesSidebar from "./components/ResourcesSidebar";
import ScenesSidebar from "./components/ScenesSidebar";
import HeaderBar from "./components/HeaderBar";

let anim;
let layer;
let stage;
let socket = null;

function App() {
  const [videoWalls, setVideoWalls] = useState([
    // مجموعه‌ای از مانیتورها با ابعاد و موقعیت‌های تصادفی
    { x: 0, y: 0, width: 1920, height: 1080 },
    { x: 1920, y: 0, width: 1920, height: 1080 },
    { x: 2 * 1920, y: 0, width: 1920, height: 1080 },
    { x: 3 * 1920, y: 0, width: 1920, height: 1080 },
    { x: 4 * 1920, y: 0, width: 1920, height: 1080 },
    { x: 5 * 1920, y: 0, width: 1920, height: 1080 },
    // ردیف پایین
    { x: 0, y: 1080, width: 1920, height: 1080 },
    { x: 1920, y: 1080, width: 1920, height: 1080 },
    { x: 2 * 1920, y: 1080, width: 1920, height: 1080 },
    { x: 3 * 1920, y: 1080, width: 1920, height: 1080 },
    { x: 4 * 1920, y: 1080, width: 1920, height: 1080 },
    { x: 5 * 1920, y: 1080, width: 1920, height: 1080 },
    // ردیف پایین
    { x: 0, y: 2 * 1080, width: 1920, height: 1080 },
    { x: 1920, y: 2 * 1080, width: 1920, height: 1080 },
    { x: 2 * 1920, y: 2 * 1080, width: 1920, height: 1080 },
    { x: 3 * 1920, y: 2 * 1080, width: 1920, height: 1080 },
    { x: 4 * 1920, y: 2 * 1080, width: 1920, height: 1080 },
    { x: 5 * 1920, y: 2 * 1080, width: 1920, height: 1080 },
    // ردیف پایین
    { x: 0, y: 3 * 1080, width: 1920, height: 1080 },
    { x: 1920, y: 3 * 1080, width: 1920, height: 1080 },
    { x: 2 * 1920, y: 3 * 1080, width: 1920, height: 1080 },
    { x: 3 * 1920, y: 3 * 1080, width: 1920, height: 1080 },
    { x: 4 * 1920, y: 3 * 1080, width: 1920, height: 1080 },
    { x: 5 * 1920, y: 3 * 1080, width: 1920, height: 1080 },
    // ردیف پایین
    { x: 0, y: 4 * 1080, width: 1920, height: 1080 },
    { x: 1920, y: 4 * 1080, width: 1920, height: 1080 },
    { x: 2 * 1920, y: 4 * 1080, width: 1920, height: 1080 },
    { x: 3 * 1920, y: 4 * 1080, width: 1920, height: 1080 },
    { x: 4 * 1920, y: 4 * 1080, width: 1920, height: 1080 },
    { x: 5 * 1920, y: 4 * 1080, width: 1920, height: 1080 },
  ]);

  const [loopVideos, setLoopVideos] = useState({});

  const [content, setContent] = useState([]);
  const [checkvideo, setCheckVideo] = useState(1);
  const [scale, setScale] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [cameraList, setCameraList] = useState([]);
  const [iframList, setIframeList] = useState([]);
  //New-Commands
  const [scenes, setScenes] = useState([{ id: 1, name: "Scene 1", resources: [] }]);
  const [selectedScene, setSelectedScene] = useState(1);
  const [isBottomControlsVisible, setIsBottomControlsVisible] = useState(true);
  const [editingSceneId, setEditingSceneId] = useState(null);

  let host = config.host;
  let port = config.port;

  const con = useMyContext();
  let arrayCollisions = [];
  let counterImages = 0;
  let counterVideos = 0;
  let allData = [];
  let allDataMonitors = videoWalls;
  let minLeftMonitor = 0;
  let minTopMonitor = 0;

  const getSelectedScene = () => scenes.find((scene) => scene.id === selectedScene);

  const addScene = () => {
    const newScene = {
      id: Date.now(),
      name: `Scene ${scenes.length + 1}`,
      resources: [],
    };
    setScenes([...scenes, newScene]);
    setSelectedScene(newScene.id);
  };

  const deleteScene = (id) => {
    const updatedScenes = scenes.filter((scene) => scene.id !== id);
    setScenes(updatedScenes);
    if (selectedScene === id && updatedScenes.length > 0) {
      setSelectedScene(updatedScenes[0].id);
    }
  };

  const handleEditSceneName = (id, newName) => {
    setScenes((prevScenes) =>
      prevScenes.map((scene) => (scene.id === id ? { ...scene, name: newName } : scene))
    );
    setEditingSceneId(null);
  };

  const MonitorSelect = ({ videoName, monitors, fitToMonitors, onAddToScene }) => {
    const monitorOptions = monitors.map((monitor, index) => ({
      value: index,
      label: `Monitor ${index + 1}`,
    }));

    return (
      <>
        <Select
          isMulti
          name="monitors"
          options={monitorOptions}
          className="basic-multi-select"
          classNamePrefix="select"
          onChange={(selectedOptions) => {
            const selectedMonitors = selectedOptions.map((option) => option.value);
            fitToMonitors(videoName, selectedMonitors);
          }}
        />
        <Button variant="flat" color="primary" onClick={onAddToScene}>
          افزودن به صحنه
        </Button>
      </>
    );
  };

  function generateBlobURL(newBaseURL, videoName) {
    const newBlobURL = `${newBaseURL}/uploads/${videoName}.mp4`;

    return newBlobURL;
  }

  function updateImagePositionRelativeToVideoWall(image, videoWall) {
    const { x, y, width, height } = videoWall;

    const newImageX = image.x() - x;
    const newImageY = image.y() + y;

    const newImageWidth = image.width();
    const newImageHeight = image.height();
    return {
      x: newImageX,
      y: newImageY,
      width: newImageWidth,
      height: newImageHeight,
    };
  }

  useEffect(() => {
    async function fetchData() {
      axios
        .get("/config.json")
        .then((res) => res.data)
        .then((data) => {
          console.log(`Updating config(Host: ${data.host}, Port: ${data.port})`);
          if (data.host) host = data.host;
          if (data.port) port = data.port;
          // TODO: use host and port
          socket = io(`http://${data.host}:${data.port}`);
          socket.on("connect", () => {
            console.log("Connected to server");
            setConnecting(true);
          });

          socket.on("source_added", ({ actoin, payload }) => {
            console.log("payload::: ", payload);
            console.log("actoin::: ", actoin);
          });

          socket.on("init", (data) => {
            console.log("INIT DATA: ", data);
            if (data.inputs) {
              console.log("setting inputs");
              setCameraList(data.inputs);
            }

            if (data.files) {
              data.files.forEach((items) => {
                const fileNameWithExtension = items;
                const fileName = fileNameWithExtension.split(".").slice(0, -1).join(".");
                const modifiedVideoURL = generateBlobURL(`http://${host}:${port}`, fileName);
                const makeVideo = document.createElement("video");
                makeVideo.src = modifiedVideoURL;
                makeVideo.setAttribute("id", fileName);
                // setContent((prev) => [
                //   ...prev,
                //   { type: "video", name: fileName, videoElement: makeVideo },
                // ]);
                updateSceneResources([
                  ...getSelectedScene(),
                  { type: "video", name: fileName, videoElement: makeVideo },
                ]);
              });
            }

            if (data.sources) {
              console.log("sdss");
              data.sources.forEach((item) => {
                const video = document.createElement("video");
                video.src = item.source;
                video.setAttribute("id", "video_0");
                addVideo(video);
              });

              // addVideo
            }

            if (data.displays) {
              const displays = data.displays;
              let newVideoWalls = displays.map((display, index) => ({
                x: display.bounds.x,
                y: display.bounds.y,
                width: display.bounds.width,
                height: display.bounds.height,
                id: `monitor-${index + 1}`,
              }));
              minLeftMonitor = Math.min(...newVideoWalls.map((monitor) => monitor.x));
              minTopMonitor = Math.min(...newVideoWalls.map((monitor) => monitor.y));

              newVideoWalls = displays.map((display, index) => ({
                x: display.bounds.x - minLeftMonitor,
                y: display.bounds.y - minTopMonitor,
                width: display.bounds.width,
                height: display.bounds.height,
                id: `monitor-${index + 1}`,
              }));

              setVideoWalls(newVideoWalls);

              function generateMonitorNode(x, y, width, height, index) {
                const group = new Konva.Group({
                  x: x,
                  y: y,
                  clip: { x: 0, y: 0, width: width, height: height },
                });

                const rect = new Konva.Rect({
                  x: 0,
                  y: 0,
                  width: width,
                  height: height,
                  fill: "#161616",
                  stroke: "white",
                  name: "fillShape",
                  strokeWidth: 3,
                  id: `monitor-${index}`,
                });

                const text = new Konva.Text({
                  x: width / 2,
                  y: height / 2,
                  text: `Monitor ${index + 1}\n${width}x${height}`,
                  fontSize: 90,
                  fill: "gray",
                  align: "center",
                  verticalAlign: "middle",
                  offsetX: width / 7,
                  offsetY: 24,
                });

                group.add(rect);
                group.add(text);
                return group;
              }

              // newVideoWalls.reverse();
              for (var i = 0; i < newVideoWalls.length; i++) {
                console.log("newVideoWalls[i]::: ", newVideoWalls[i]);
                // if (newVideoWalls[i].x < 0) {
                //   newVideoWalls[i].x = newVideoWalls[i].x;
                // }
                // if (newVideoWalls[i].y < 0) {
                //   newVideoWalls[i].y = newVideoWalls[i].y;
                // }

                layer.add(
                  generateMonitorNode(
                    newVideoWalls[i].x,
                    newVideoWalls[i].y,
                    newVideoWalls[i].width,
                    newVideoWalls[i].height,
                    i
                  )
                );
              }

              layer.draw();
            }
          });

          socket.on("update-event", (data) => {
            console.log("Update event received:", data);
          });

          socket.on("update-cameras", (data) => {
            console.log("Camera List:", data);
            setCameraList(data);
          });

          // Your initialization code
          var width = window.innerWidth;
          var height = window.innerHeight;
          stage = new Konva.Stage({
            container: "containerKonva",
            width: width,
            height: height,
            draggable: true,
          });

          layer = new Konva.Layer();
          stage.add(layer);
          console.log("Listening on update monitors");

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

          stage.position({ x: 500, y: 400 });
          stage.scale({ x: 0.17, y: 0.17 });

          anim = new Konva.Animation(() => {}, layer);

          function processImageResize(width, height, group2) {
            var target = group2;
            var targetRect = group2.getClientRect();
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
            let searchIndexArray = group2.children[0].getAttr("id");

            allData.find((item) => {
              if (item && item.id == searchIndexArray) {
                let updatedPosition = updateImagePositionRelativeToVideoWall(
                  group2,
                  allDataMonitors[1]
                );
                item = {
                  monitor: arrayCollisions,
                  x: updatedPosition.x,
                  y: updatedPosition.y,
                  width: width,
                  height: height,
                  name: searchIndexArray,
                };
              }
            });
          }

          function handleImage(dataURL) {
            let img = document.createElement("img");
            img.src = dataURL;
            counterImages++;
            // setContent((prevContent) => [...prevContent, "image" + counterImages]);

            const group2 = new Konva.Group({
              draggable: true,
              x: 0,
              y: 0,
              id: "image" + counterImages,
            });

            const image = new Konva.Image({
              image: img,
              name: "object",
              id: "image" + counterImages,
              width: img.width,
              height: img.height,
            });

            group2.add(image);
            layer.add(group2);

            // const transformer = new Konva.Transformer({
            //   nodes: [image],
            //   enabledAnchors: [
            //     "top-left",
            //     "top-right",
            //     "top-center",
            //     "bottom-left",
            //     "bottom-right",
            //     "bottom-center",
            //     "middle-right",
            //     "middle-left",
            //   ],
            // });

            // group2.add(transformer);

            // transformer.on("transform", () => {
            //   const scaleX = image.scaleX();
            //   const scaleY = image.scaleY();
            //   image.width(image.image().width * scaleX);
            //   image.height(image.image().height * scaleY);
            //   layer.batchDraw();
            //   processImageResize(image.width(), image.height(), group2);
            // });

            // const positionRelativeToVideoWall = updateImagePositionRelativeToVideoWall(
            //   group2,
            //   allDataMonitors[0]
            // );
            // group2.position(positionRelativeToVideoWall);

            // allData.push({
            //   monitor: [1],
            //   x: positionRelativeToVideoWall.x,
            //   y: positionRelativeToVideoWall.y,
            //   width: image.width(),
            //   height: image.height(),
            //   name: "image" + counterImages,
            // });
          }

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

          layer.on("dragend", function (e) {
            layer.find(".guid-line").forEach((l) => l.destroy());
          });

          function haveIntersection(r1, r2) {
            return !(
              r2.x > r1.x + r1.width ||
              r2.x + r2.width < r1.x ||
              r2.y > r1.y + r1.height ||
              r2.y + r2.height < r1.y
            );
          }
        })
        .catch((err) => console.warn("Failed to fetch config.json", err));
    }
    fetchData();

    return () => {
      if (stage) stage.destroy();
      if (layer) layer.destroy();
      // socket.off("update-monitors");
      // socket.off("connect");
      // socket.off("update-event");
    };
  }, []);

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

  const fitToMonitors = (id, selectedMonitors) => {
    const videoGroup = layer.findOne(`#${id}`);

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

        layer.draw();
      }
      const modifiedVideoURL = generateBlobURL(`video:http://${host}:${port}`, id);

      socket.emit("source", {
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
      allData = allData.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            x: x,
            y: y,
            width: width,
            height: height,
          };
        }
        return item;
      });
    }
  };

  //---------------Start-Resource-Segment-----------------

  const addResource = (type) => {
    if (type === "video" || type === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = type === "video" ? "video/*" : "image/*";
      input.onchange = (e) => handleFileInput(e);
      input.click();
    } else if (type === "text") {
      Swal.fire({
        title: "Enter your text:",
        input: "text",
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          newResource.content = result.value;
          updateSceneResources([...getSelectedScene().resources, newResource]);
        }
      });
    } else if (type === "web") {
      Swal.fire({
        title: "Enter the URL:",
        input: "text",
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          newResource.content = result.value;
          updateSceneResources([...getSelectedScene().resources, newResource]);
        }
      });
    } else if (type === "input") {
      console.log("hi Input");
    }
  };

  const deleteResource = (id) => {
    socket.emit("source", {
      action: "remove",
      id,
      payload: {},
    });

    updateSceneResources(getSelectedScene()?.resources.filter((res) => res.id !== id));

    const groupToRemove = layer.findOne(`#${id}`);
    console.log("groupToRemove::: ", groupToRemove);
    if (groupToRemove) {
      groupToRemove.destroy();
      layer.draw();
    } else {
      console.error(`Group with id ${id} not found`);
    }

    const videoElement = getSelectedScene()?.resources.find((item) => item.id === id)?.videoElement;
    if (videoElement) {
      videoElement.pause();
      videoElement.src = "";
    }
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
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];

    if (file) {
      const fileType = file.type.split("/")[0];
      if (fileType === "image") {
        const imageURL = URL.createObjectURL(file);
        handleImage(imageURL);
      } else if (fileType === "video") {
        const video = document.createElement("video");
        video.src = URL.createObjectURL(file);
        const id = crypto.randomUUID();
        video.setAttribute("id", id);
        const videoName = "video" + counterVideos++;
        video.setAttribute("name", videoName);

        let newResource = {
          type: "video",
          id,
          name: videoName,
          videoElement: video,
          content: "",
        };

        // const reader = new FileReader();
        // console.log("reader::: ", reader);
        // reader.onload = (event) => {
        //   console.log("22s");
        //   newResource.content = event.target.result;
        //   console.log("newResource::: ", newResource);
        // };
        // reader.readAsDataURL(file);

        // setContent((prev) => [
        //   ...prev,
        //   { type: "video", id: "temp", name: videoName, videoElement: video },
        // ]);

        updateSceneResources([...getSelectedScene().resources, newResource]);

        // uploadVideo(file, videoName);
      } else {
        console.error("Unsupported file type.");
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

  //---------------End-Resource-Segment-----------------

  // -------------------------------------------------------------------------------------

  //---------------Start-Video-Segment-----------------

  const addVideo = (videoElement) => {
    const id = videoElement.getAttribute("id");
    // const video = document.createElement("video");
    // let videoName = null;
    // const id = crypto.randomUUID();
    // counterVideos++;

    // if (!videoElement.getAttribute("id")) {
    //   videoName = "video" + counterVideos;
    // } else {
    //   videoName = videoElement.getAttribute("id");
    // }

    // video.src = videoElement.src;
    // video.setAttribute("id", id);

    // const sceneId = getSelectedScene().id;

    // setScenes((prevScenes) =>
    //   prevScenes.map((scene) => {
    //     if (scene.id == sceneId) {
    //       console.log("scene.resources::: ", scene.resources);
    //       console.log("videoName::: ", videoName);
    //       const existingResourceIndex = scene.resources.findIndex(
    //         (resource) => resource.name == videoName
    //       );
    //       console.log("existingResourceIndex::: ", existingResourceIndex);

    //       if (existingResourceIndex != -1) {
    //         const updatedResources = [...scene.resources];
    //         updatedResources[existingResourceIndex].id = id;
    //         return {
    //           ...scene,
    //           resources: updatedResources,
    //         };
    //       } else {
    //         return {
    //           ...scene,
    //           resources: [...scene.resources, { type: "video", id, name: videoName, videoElement }],
    //         };
    //       }
    //     }
    //     return scene;
    //   })
    // );

    // console.log(scenes);

    // const modifiedVideoURL = generateBlobURL(`video:http://${host}:${port}`, videoName);

    const modifiedVideoURL = generateBlobURL(
      `video:http://${host}:${port}`,
      videoElement.getAttribute("id")
    );

    socket.emit("source", {
      action: "add",
      id,
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
      width: 50,
      height: 50,
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
      layer.draw();
      image.setAttr("rotation", 0);
      allData = allData.map((item) => {
        if (item.id === id) {
          socket.emit("source", {
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
          return {
            ...item,
            x: 0,
            y: 0,
            width: image.width(),
            height: image.height(),
          };
        }
        return item;
      });
    });

    layer.add(image);
    stage.add(layer);

    layer.draw();

    const transformer = new Konva.Transformer({
      nodes: [image],
      enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
      rotateEnabled: true,
    });

    image.on("click", () => {
      layer.add(transformer);
      transformer.attachTo(image);
      layer.draw();
    });

    stage.on("click", (e) => {
      if (e.target === stage || e.target === layer) {
        transformer.detach();
        layer.draw();
      }
    });

    allData.push({
      monitor: [1],
      x: 0,
      y: 0,
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
      name: videoName,
      id: id,
    });

    let rotateStack = 0;
    let StackScaleY = 0;
    let StackScaleX = 0;
    transformer.on("transformend", (e) => {
      const scaleX = image.scaleX();
      const scaleY = image.scaleY();
      const newWidth = image.width() * scaleX;
      const newHeight = image.height() * scaleY;

      image.width(newWidth);
      image.height(newHeight);
      image.scaleX(1);
      image.scaleY(1);

      let rotation = Math.round(image.getAttr("rotation"));
      let x,
        y = 0;
      if (Math.round(rotation) != Math.round(rotateStack)) {
        rotateStack = rotation;
        x = image.x();
        y = image.y();
      } else {
        x = image.x();
        y = image.y();
      }

      positionText.text(
        `x: ${Math.round(x)}, y: ${Math.round(y)}, width: ${Math.round(
          newWidth
        )}, height: ${Math.round(newHeight)}, rotation:${rotation}`
      );

      allData = allData.map((item) => {
        if (item.id === id) {
          socket.emit("source", {
            action: "resize",
            id,
            payload: {
              source: modifiedVideoURL,
              x,
              y,
              width: newWidth,
              height: newHeight,
              rotation: rotation,
            },
          });
          return {
            ...item,
            x,
            y,
            width: newWidth,
            height: newHeight,
          };
        }
        return item;
      });
    });

    image.on("dragmove", (e) => {
      const x = e.target.x();
      const y = e.target.y();
      positionText.text(
        `x: ${Math.floor(x)}, y: ${Math.floor(y)}, width: ${Math.round(
          image.width()
        )}, height: ${Math.round(image.height())}`
      );
    });

    image.on("dragstart", () => {
      image.opacity(0.2);
      image.moveToTop();
      layer.draw();
    });

    image.on("dragend", (e) => {
      image.opacity(1);
      allData = allData.map((item) => {
        if (item.id === id) {
          socket.emit("source", {
            action: "move",
            id,
            payload: {
              source: modifiedVideoURL,
              x: image.x(),
              y: image.y(),
            },
          });
          return {
            ...item,
            x: image.x(),
            y: image.y(),
          };
        }
        return item;
      });
      layer.draw();
    });

    videoElement.loop = loopVideos[videoName] || false;
  };

  const playVideo = (videoName) => {
    const video = getSelectedScene()?.resources.find((item) => item.id === videoName)?.videoElement;
    if (video) {
      video.play();
      socket.emit("source", {
        action: "play",
        id: videoName,
      });
      anim.start();
    }
  };

  const pauseVideo = (videoName) => {
    const video = getSelectedScene()?.resources.find((item) => item.id === videoName)?.videoElement;
    if (video) {
      video.pause();
      socket.emit("source", {
        action: "pause",
        id: videoName,
      });
    }
  };

  const toggleLoopVideo = (videoName) => {
    setLoopVideos((prev) => {
      const isLooping = !prev[videoName];
      socket.emit("source", {
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
      console.log("File uploaded successfully:", response.data.filePath);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  //---------------End-Video-Segment-----------------

  const addToScene = ({ deviceId, width, height }) => {
    const x = 0;
    const y = 0;
    const id = crypto.randomUUID();

    const inputGroup = new Konva.Group({
      x: x,
      y: y,
      draggable: true,
      id: `input-${deviceId}`,
    });

    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width: width,
      height: height,
      fill: "blue",
      stroke: "white",
      strokeWidth: 2,
    });

    inputGroup.add(rect);

    layer.add(inputGroup);
    layer.draw();

    const transformer = new Konva.Transformer({
      nodes: [inputGroup],
      enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
      rotateEnabled: true,
    });

    layer.add(transformer);
    layer.draw();

    transformer.on("transformend", (e) => {
      const scaleX = e.target.attrs.scaleX;
      const scaleY = e.target.attrs.scaleY;
      const newWidth = rect.width() * scaleX;
      const newHeight = rect.height() * scaleY;

      socket.emit("source", {
        action: "resize",
        id,
        payload: {
          x: e.target.attrs.x,
          y: e.target.attrs.y,
          width: newWidth,
          height: newHeight,
          rotation: e.target.attrs.rotation,
        },
      });
    });

    inputGroup.on("dragend", (e) => {
      socket.emit("source", {
        action: "move",
        id,
        payload: {
          x: e.target.attrs.x,
          y: e.target.attrs.y,
        },
      });
    });

    inputGroup.on("click", () => {
      transformer.attachTo(inputGroup);
      layer.draw();
    });

    stage.on("click", (e) => {
      if (e.target === stage || e.target === layer) {
        transformer.detach();
        layer.draw();
      }
    });

    socket.emit("source", {
      action: "add",
      id,
      payload: { x, y, width, height, source: `input:${deviceId}` },
    });
  };

  return (
    <main
      className={`${
        darkMode ? "bg-[#1E232A]" : "bg-[#e3e4e4]"
      }  h-screen w-full flex flex-col z-50  items-center `}
    >
      <HeaderBar darkMode={darkMode} setDarkMode={setDarkMode} connecting={connecting} />
      <div className="h-[93%] w-full flex z-50">
        <div id="Video-Wall-Section" className="w-full h-full flex">
          <div
            onClick={(e) => {
              con.setIsActiveG("un");
            }}
            id="Monitor"
            className={`${
              checkvideo == 1 ? " block " : " hidden "
            } w-full overflow-hidden active:cursor-grabbing relative h-full `}
          >
            <div
              id="infiniteDiv"
              style={{ scale: `${scale}` }}
              className={`xxx w-full h-full relative`}
            >
              <div id="content" className="absolute w-full h-full top-0 left-0">
                {/* {iframList.map((item) => (
                  <DraggableResizableIframe key={item} />
                ))} */}
                <div
                  className=" z-50 relative "
                  id="containerKonva"
                  onMouseDown={(e) => {
                    con.setFlagDragging(false);
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <motion.div
        className="flex w-full h-[260px] border-t overflow-y-auto items-center"
        style={{ backgroundColor: darkMode ? "#222" : "#fff" }}
        animate={{ height: isBottomControlsVisible ? "350px" : "0px" }}
        transition={{ duration: 0.5 }}
      >
        {isBottomControlsVisible && (
          <>
            {/* Scenes Sidebar */}
            <ScenesSidebar
              scenes={scenes}
              darkMode={darkMode}
              selectedScene={selectedScene}
              setSelectedScene={setSelectedScene}
              addScene={addScene}
              editingSceneId={editingSceneId}
              setEditingSceneId={setEditingSceneId}
              handleEditSceneName={handleEditSceneName}
              deleteScene={deleteScene}
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
          onClick={() => setIsBottomControlsVisible(!isBottomControlsVisible)}
        >
          {isBottomControlsVisible ? <FaAngleDown /> : <FaAngleUp />}
        </Button>
      </div>
    </main>
  );
}

export default App;
