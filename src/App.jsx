import React, { useCallback, useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faL, faTrash } from "@fortawesome/free-solid-svg-icons";
import ModalCustom from "./components/ModalCustom";
import {
  Button,
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
} from "react-icons/fa";
import Swal from "sweetalert2";
import { Add } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useMyContext } from "./context/MyContext";
import axios from "axios";
import SwitchCustom from "./components/SwitchCustom";
import Setting from "./components/Setting";
import Select from "react-select";
import io, { connect } from "socket.io-client";
import config from "../public/config.json";
import DraggableResizableIframe from "./DraggableResizableIframe";

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

  //New-Commands
  const [scenes, setScenes] = useState([{ id: 1, name: "Scene 1", resources: [] }]);
  const [selectedScene, setSelectedScene] = useState(1);
  const [isBottomControlsVisible, setIsBottomControlsVisible] = useState(true);
  const [editingSceneId, setEditingSceneId] = useState(null);

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
    content.forEach((item) => {
      if (item.type === "video") {
        const videoElement = item.videoElement;
        if (videoElement) {
          videoElement.loop = loopVideos[item.id] || false;
        }
      }
    });
  }, [loopVideos, content]);

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
    updateSceneResources(getSelectedScene()?.resources.filter((res) => res.id !== id));
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
        const videoName = "video" + counterVideos++;

        let newResource = {
          type: "video",
          id: Date.now(),
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

  const deleteContent = async ({ id, name }) => {
    await deleteVideo(id);
    const groupToRemove = layer.findOne(`#${id}`);

    if (groupToRemove) {
      const videoElement = content.find((item) => item.id == id)?.videoElement;
      if (videoElement) {
        videoElement.pause();
        videoElement.src = "";
      }

      groupToRemove.destroy();
      layer.draw();
    } else {
      console.error(`Group with id ${id} not found`);
    }

    setContent((prevContent) => prevContent.filter((item) => item.id !== id));
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

  //---------------Start-Video-Segment-----------------

  const addVideo = (videoElement) => {
    const video = document.createElement("video");
    let videoName = null;
    const id = crypto.randomUUID();
    counterVideos++;
    if (videoElement.getAttribute("id") == null) {
      videoName = "video" + counterVideos;
    } else {
      videoName = videoElement.getAttribute("id");
    }

    video.src = videoElement.src;
    video.setAttribute("id", id);
    console.log(video);
    setContent((prev) => {
      const n = prev.map((c) => (c.name == videoName ? { ...c, id } : c));
      console.log("NEW SHIT: ", n);
      return n;
    });
    const modifiedVideoURL = generateBlobURL(`video:http://${host}:${port}`, videoName);

    video.addEventListener("loadedmetadata", () => {
      socket.emit("source", {
        action: "add",
        id,
        payload: {
          source: modifiedVideoURL,
          x: 0,
          y: 0,
          width: video.videoWidth,
          height: video.videoHeight,
        },
      });

      const image = new Konva.Image({
        image: videoElement,
        width: video.videoWidth,
        height: video.videoHeight,
        name: "object",
        fill: "gray",
        id: id,
        draggable: true,
      });

      const positionText = new Konva.Text({
        x: 0,
        y: -50,
        text: `x: 0, y: 0, width: ${video.videoWidth}, height: ${video.videoHeight}`,
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
        image.width(video.videoWidth);
        image.height(video.videoHeight);
        positionText.text(`x: 0, y: 0, width: ${video.videoWidth}, height: ${video.videoHeight}`);
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
        width: video.videoWidth,
        height: video.videoHeight,
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

      video.loop = loopVideos[videoName] || false;
    });
  };

  const deleteVideo = async (id) => {
    socket.emit("source", {
      action: "remove",
      id,
      payload: {},
    });
    try {
      // const response = await axios.delete(`http://${host}:${port}/delete/${fileName}`);
      console.log("File deleted successfully:", response.data.message);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const playVideo = (videoName) => {
    const video = content.find((item) => item.id === videoName)?.videoElement;
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
    const video = content.find((item) => item.id === videoName)?.videoElement;
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
        darkMode ? "bg-black" : "bg-[#e3e4e4]"
      }  h-screen w-full flex flex-col z-50  items-center `}
    >
      <div
        className={` ${
          darkMode ? "bg-[#161616] text-white" : "bg-[#bcc2c9] text-black"
        } w-full shadow-xl  px-3 shadow-gray-[#1c2026] flex items-center justify-between h-[7%] z-10`}
      >
        <div id="setting" className="text-black flex items-center">
          <Setting />
          <SwitchCustom setDarkMode={setDarkMode} darkMode={darkMode} />
        </div>

        <div className=" flex right-0 relative">
          <div>وضعیت اتصال</div>
          {connecting && <div className="blob"></div>}
          {!connecting && <div className="blobred"></div>}
        </div>
      </div>
      <div className="h-[93%] w-full flex z-50">
        <div
          id="Options"
          className={` left-0 h-full z-40 transition-all overflow-auto p-3 pt-5 w-[250px] ${
            darkMode ? "bg-[#161616] " : "bg-[#bcc2c9] "
          } flex flex-col shadow-lg shadow-gray-700 justify-between gap-5`}
        >
          <div className="flex flex-col gap-5 h-full">
            <div
              id="Pictures-setting"
              className="text-center bg-gray-300 shadow-md rounded-lg px-1 flex flex-col items-center justify-start w-full"
            >
              <h1 className="">مدیریت مانیتورها </h1>
              <ul className="w-full px-1 flex flex-col gap-2  p-1 rounded-md h-[180px] overflow-y-auto">
                {videoWalls?.map((item, index) => (
                  <li
                    key={item.name}
                    className="flex justify-between px-1 bg-[#bcc2c9] rounded-lg  w-full"
                  >
                    <span>{item.id}</span>
                    <span>{item.width + "*" + item.height}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center bg-gray-300 rounded-lg p-4 flex flex-col items-center shadow-md">
              <h2 className="text-lg font-semibold mb-4">مدیریت ورودی</h2>
              <ul className="w-full flex flex-col gap-2 overflow-y-auto">
                {cameraList.map((item, index) => (
                  <li
                    key={index}
                    className="flex flex-col justify-between p-2 bg-gray-200 rounded-lg shadow-sm"
                  >
                    <span className="font-semibold text-sm">{item.label}</span>
                    <Button variant="flat" color="primary" onClick={() => addToScene(item)}>
                      افزودن به صحنه
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center bg-gray-300 rounded-lg p-4 flex flex-col items-center shadow-md">
              <h2 className="text-lg font-semibold mb-4">مدیریت محتوا</h2>
              <div className="cursor-pointer mb-4">
                <Button
                  onClick={addResource}
                  className={` py-2 rounded-lg text-white z-10 ${
                    checkvideo === 4 || checkvideo === 8
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-blue-600"
                  }`}
                  disabled={checkvideo === 4 || checkvideo === 8}
                >
                  افزودن محتوا
                </Button>
                {/* <input
                  className="relative left-0 right-0 top-[-34px] mx-auto  h-12 opacity-0 cursor-pointer w-[110px]"
                  type="file"
                  id="fileInput"
                /> */}
              </div>
              <ul className="w-full flex flex-col gap-2 overflow-y-auto">
                {content.map((item, index) => (
                  <li
                    key={index}
                    className="flex flex-col justify-between p-2 bg-gray-200 rounded-lg shadow-sm"
                  >
                    <span className="font-semibold">name: {item.name}</span>
                    {item.type === "video" && (
                      <div className="flex flex-col gap-3 mt-2">
                        <button
                          className="w-full bg-green-500 rounded-md py-1 text-white"
                          onClick={() => playVideo(item.id)}
                        >
                          Play
                        </button>
                        <button
                          className="w-full bg-orange-500 rounded-md py-1 text-white"
                          onClick={() => pauseVideo(item.id)}
                        >
                          Pause
                        </button>
                        <MonitorSelect
                          videoName={item.id}
                          monitors={allDataMonitors}
                          fitToMonitors={fitToMonitors}
                          onAddToScene={() => addVideo(item.videoElement)}
                        />
                        <div className="flex items-center mt-2">
                          <label className="mr-2">Loop</label>
                          <input
                            type="checkbox"
                            checked={loopVideos[item.id] || false}
                            onChange={() => toggleLoopVideo(item.id)}
                          />
                        </div>
                      </div>
                    )}
                    <span
                      onClick={() => deleteContent(item)}
                      className="cursor-pointer hover:shadow-md shadow-black mt-2"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-red-600" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div id="Video-Wall-Section" className="w-full h-full flex">
          <div
            onClick={(e) => {
              con.setIsActiveG("un");
            }}
            id="Monitor"
            className={`${
              checkvideo == 1 ? " block " : " hidden "
            } w-full overflow-hidden active:cursor-grabbing relative  h-full border-dashed    bg-slate-500  bg-opacity-30`}
          >
            <div
              id="infiniteDiv"
              style={{ scale: `${scale}` }}
              className={`xxx w-full h-full relative`}
            >
              <div id="content" className="absolute w-full h-full top-0 left-0">
                {iframList.map((item) => (
                  <DraggableResizableIframe key={item} />
                ))}
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
        className="flex w-full h-[230px] border-t overflow-y-auto items-center"
        style={{ backgroundColor: darkMode ? "#222" : "#fff" }}
        animate={{ height: isBottomControlsVisible ? "230px" : "0px" }}
        transition={{ duration: 0.5 }}
      >
        {isBottomControlsVisible && (
          <>
            {/* Scenes Sidebar */}
            <div
              dir="rtl"
              className="w-1/4 p-2 border-r h-full overflow-auto"
              style={{ backgroundColor: darkMode ? "#333" : "#f4f4f4" }}
            >
              <div className="flex justify-between px-2 items-center mb-5">
                <h2 className="text-md font-semibold">Scenes</h2>
                <Button
                  auto
                  color="default"
                  className="block p-0 text-sm  min-w-fit w-fit h-fit rounded-sm"
                  onClick={addScene}
                >
                  <Add />
                </Button>
              </div>
              <ul>
                {scenes.map((scene) => (
                  <li key={scene.id} className="mb-1 flex items-center justify-between">
                    {editingSceneId === scene.id ? (
                      <input
                        type="text"
                        defaultValue={scene.name}
                        onBlur={(e) => handleEditSceneName(scene.id, e.target.value)}
                        className="p-2 rounded-md bg-gray-700 text-white w-full"
                        autoFocus
                      />
                    ) : (
                      <div
                        className={`p-2 cursor-pointer flex justify-between rounded-md transition-colors duration-200 flex-grow ${
                          selectedScene === scene.id
                            ? "bg-blue-500 text-white"
                            : darkMode
                            ? "bg-gray-700 hover:bg-gray-600"
                            : "bg-gray-300 hover:bg-gray-400"
                        }`}
                        onDoubleClick={() => setEditingSceneId(scene.id)}
                        onClick={() => setSelectedScene(scene.id)}
                      >
                        {scene.name}
                        <div className="flex gap-1">
                          <Tooltip content="Delete Scene">
                            <Button
                              className="min-w-fit h-fit p-1"
                              size="sm"
                              variant="flat"
                              color="default"
                              onClick={() => deleteScene(scene.id)}
                              disabled={scenes.length === 1}
                            >
                              <FaTrashAlt size={14} />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Sources Sidebar */}
            <div
              dir="rtl"
              className="w-1/4 p-2 h-full"
              style={{ backgroundColor: darkMode ? "#333" : "#f4f4f4" }}
            >
              <div className="flex justify-between px-2 items-center mb-5">
                <h2 className="text-md font-semibold">منابع</h2>

                <Dropdown dir="rtl" className="vazir">
                  <DropdownTrigger>
                    <Button
                      auto
                      color="default"
                      className="block p-0 text-sm  min-w-fit w-fit h-fit rounded-sm"
                    >
                      <Add />
                    </Button>
                  </DropdownTrigger>

                  <DropdownMenu aria-label="Static Actions">
                    <DropdownItem onClick={() => addResource("video")} key="video">
                      ویدیو
                    </DropdownItem>
                    <DropdownItem onClick={() => addResource("image")} key="image">
                      تصویر
                    </DropdownItem>
                    <DropdownItem onClick={() => addResource("text")} key="text">
                      متن
                    </DropdownItem>
                    <DropdownItem onClick={() => addResource("web")} key="web">
                      وب
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              <div className="mt-2">
                <ul>
                  {getSelectedScene()?.resources.map((resource) => (
                    <li
                      key={resource.id}
                      className={`mb-1 text-sm flex items-center justify-between ${
                        darkMode ? "bg-gray-600" : "bg-gray-200"
                      }  p-2 rounded-lg`}
                    >
                      <div className="flex items-center">
                        <span className="mr-2">{resource.type.toUpperCase()}</span>
                        <span className="text-xs text-gray-500">
                          {resource.content ? "Loaded" : "Not Loaded"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          className="text-red-500 min-w-fit h-fit p-1"
                          size="sm"
                          variant="flat"
                          color="default"
                          onClick={() => deleteResource(resource.id)}
                          title="Delete Resource"
                        >
                          <FaTrashAlt />
                        </Button>
                        <Button
                          className=" min-w-fit h-fit p-1"
                          size="sm"
                          variant="flat"
                          color="default"
                          onClick={() => moveResource(resource.id, -1)}
                          title="Move Up"
                        >
                          <FaArrowUp />
                        </Button>
                        <Button
                          className=" min-w-fit h-fit p-1"
                          size="sm"
                          variant="flat"
                          color="default"
                          onClick={() => moveResource(resource.id, 1)}
                          title="Move Down"
                        >
                          <FaArrowDown />
                        </Button>
                        <Button
                          className="text-green-500 min-w-fit h-fit p-1"
                          size="sm"
                          variant="flat"
                          color="default"
                          onClick={() => rotateResource(resource.id, 15)}
                          title="Rotate"
                        >
                          <FaSyncAlt />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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
