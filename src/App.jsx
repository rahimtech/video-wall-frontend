import { Rnd } from "react-rnd";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Block from "./components/Block";
import Box4 from "./components/Box4";
import Box8 from "./components/Box8";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faL, faTrash } from "@fortawesome/free-solid-svg-icons";
import ModalCustom from "./components/ModalCustom";
import { Button } from "@nextui-org/react";
import { useMyContext } from "./context/MyContext";
import { MyContextProvider } from "./context/MyContext";
import Contents from "./components/Contents";
import axios from "axios";
import { Rnd as ReactRnd } from "react-rnd";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import SwitchCustom from "./components/SwitchCustom";
import Setting from "./components/Setting";
import Select from "react-select";
import io, { connect } from "socket.io-client";
import config from "../public/config.json";
import DraggableResizableIframe from "./DraggableResizableIframe";
const Controls = ({ zoomIn, zoomOut, resetTransform }) => (
  <>
    <button onClick={() => zoomIn()}>Zoom In</button>
    <button onClick={() => zoomOut()}>Zoom Out</button>
    <button onClick={() => resetTransform()}>Reset</button>
  </>
);

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
  const [fileList, setFileList] = useState([]);
  let host = config.host;
  let port = config.port;

  const con = useMyContext();
  const transformComponentRef = useRef(null);
  let arrayCollisions = [];
  let setData2 = [];
  let updatedPosition = 0;
  let counterImages = 0;
  let counterVideos = 0;
  let allData = [];
  let allDataMonitors = videoWalls;
  let minLeftMonitor = 0;
  let minTopMonitor = 0;

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

  const toggleLoop = (videoName) => {
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

  function getCorner(pivotX, pivotY, diffX, diffY, angle) {
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);

    /// find angle from pivot to corner
    angle += Math.atan2(diffY, diffX);

    /// get new x and y and round it off to integer
    const x = pivotX + distance * Math.cos(angle);
    const y = pivotY + distance * Math.sin(angle);

    return { x: x, y: y };
  }

  function getClientRect(rotatedBox) {
    const { x, y, width, height } = rotatedBox;
    const rad = rotatedBox.rotation;

    const p1 = getCorner(x, y, 0, 0, rad);
    const p2 = getCorner(x, y, width, 0, rad);
    const p3 = getCorner(x, y, width, height, rad);
    const p4 = getCorner(x, y, 0, height, rad);

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  function getTotalBox(boxes) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    boxes.forEach((box) => {
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
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
                setContent((prev) => [
                  ...prev,
                  { type: "video", name: fileName, videoElement: makeVideo },
                ]);
              });
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
          socket.on("update-monitors", (displays) => {
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
          });

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

          var inputElement = document.getElementById("fileInput");

          inputElement.addEventListener("change", function (e) {
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
                // const videoName = crypto.randomUUID();
                // video.setAttribute("id", videoName);

                // handleVideo(file);
                setContent((prev) => [
                  ...prev,
                  { type: "video", id: "temp", name: videoName, videoElement: video },
                ]);
                uploadVideo(file, videoName);
              } else {
                console.error("Unsupported file type.");
              }
            }
          });

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
            setContent((prevContent) => [...prevContent, "image" + counterImages]);

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
    console.log("content::: ", content);
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
    console.log("id::: ", id);
    const videoGroup = layer.findOne(`#${id}`);
    console.log("videoGroup::: ", videoGroup);

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

  const lunching = () => {
    var canvas = document.getElementById("All");
    if (canvas.getContext) {
      var ctx = canvas.getContext("2d");
      ctx.fillRect(50, 50, 200, 200);
    }
  };

  const addContent = () => {
    document.getElementById("fileInput").click();
  };

  const handleDeleteVideo = async (id) => {
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

  const deleteContent = async ({ id, name }) => {
    console.log("Deleting content with id:", id);

    // حذف از لیست محتوا
    console.log(content);
    // ارسال درخواست حذف ویدیو به سرور
    await handleDeleteVideo(id);

    // پیدا کردن گروه مرتبط با ID در لایه
    const groupToRemove = layer.findOne(`#${id}`);

    console.log("groupToRemove::: ", groupToRemove);
    if (groupToRemove) {
      // توقف ویدیو و آزادسازی منابع
      const videoElement = content.find((item) => item.id == id)?.videoElement;
      if (videoElement) {
        videoElement.pause();
        videoElement.src = ""; // آزاد کردن منبع ویدیو
      }

      // حذف گروه از لایه
      groupToRemove.destroy();
      layer.draw(); // به‌روزرسانی لایه برای نمایش تغییرات
    } else {
      console.error(`Group with id ${id} not found`);
    }

    setContent((prevContent) => prevContent.filter((item) => item.id !== id));
  };

  const playVideo = (videoName) => {
    const video = content.find((item) => item.id === videoName)?.videoElement;
    console.log("video::: ", video);
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

  function generateBlobURL(newBaseURL, videoName) {
    // const blobID = blobURL.substring(blobURL.lastIndexOf("/") + 1);

    const newBlobURL = `${newBaseURL}/uploads/${videoName}.mp4`;

    return newBlobURL;
  }

  const uploadVideo = async (file, videoName) => {
    console.log("file::: ", file);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("videoName", videoName); // اضافه کردن videoName به فرم دیتا
    console.log("formData::: ", formData);

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

  const createVideo = (videoElement) => {
    console.log("videoElement::: ", videoElement);
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

  const addInput = ({ deviceId, width, height }) => {
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
      console.log("e::: ", e);
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

  const addIframe = () => {
    const iframeGroup = new Konva.Group({
      x: 100,
      y: 100,
      draggable: true,
      id: `iframe-${Date.now()}`,
    });

    const iframeRect = new Konva.Rect({
      x: 0,
      y: 0,
      width: 800,
      height: 400,
      fill: "transparent",
      stroke: "white",
      strokeWidth: 3,
    });

    iframeGroup.add(iframeRect);

    const konvaIframe = document.createElement("iframe");
    konvaIframe.src = "https://www.easeup.ir"; // آدرس فایل HTML خود را جایگزین کنید
    konvaIframe.style.width = "200px";
    konvaIframe.style.height = "100px";
    konvaIframe.style.position = "absolute";
    konvaIframe.style.border = "none";
    konvaIframe.style.pointerEvents = "none"; // Disable iframe interactions to prevent interference with dragging
    document.body.appendChild(konvaIframe);

    const container = document.getElementById("containerKonva");
    container.style.position = "relative";

    const updateIframePosition = () => {
      const { x, y } = iframeGroup.absolutePosition();
      konvaIframe.style.left = `${x}px`;
      konvaIframe.style.top = `${y}px`;
    };

    iframeGroup.on("transform", () => {
      const scaleX = iframeGroup.scaleX();
      const scaleY = iframeGroup.scaleY();
      const newWidth = 800 * scaleX;
      const newHeight = 400 * scaleY;

      iframeRect.width(newWidth);
      iframeRect.height(newHeight);

      konvaIframe.style.width = `${newWidth}px`;
      konvaIframe.style.height = `${newHeight}px`;
      iframeGroup.scaleX(1);
      iframeGroup.scaleY(1);

      updateIframePosition();
    });

    iframeGroup.on("dragmove", () => {
      updateIframePosition();
    });

    iframeGroup.on("dragend", () => {
      updateIframePosition();
    });

    iframeGroup.on("transformend", () => {
      updateIframePosition();
    });

    stage.add(layer);
    layer.add(iframeGroup);

    const transform = new Konva.Transformer({
      nodes: [iframeGroup],
      enabledAnchors: [
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
        "middle-left",
        "middle-right",
        "top-center",
        "bottom-center",
      ],
    });

    layer.add(transform);
    layer.draw();

    updateIframePosition(); // Initial position update
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
                    <Button variant="flat" color="primary" onClick={() => addInput(item)}>
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
                  onClick={addContent}
                  className={` py-2 rounded-lg text-white z-10 ${
                    checkvideo === 4 || checkvideo === 8
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-blue-600"
                  }`}
                  disabled={checkvideo === 4 || checkvideo === 8}
                >
                  افزودن محتوا
                </Button>
                {/* <Button
                  onClick={() => {
                    setIframeList((prev) => [...prev, "new"]);
                  }}
                  // onClick={addIframe}
                  className={`py-2 rounded-lg text-white z-10 mt-2 ${
                    checkvideo === 4 || checkvideo === 8
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-blue-600"
                  }`}
                  disabled={checkvideo === 4 || checkvideo === 8}
                >
                  افزودن فریم
                </Button> */}

                <input
                  className="relative left-0 right-0 top-[-34px] mx-auto  h-12 opacity-0 cursor-pointer w-[110px]"
                  type="file"
                  id="fileInput"
                  // onChange={(e) => {
                  //   const file = e.target.files[0];
                  //   if (file) {
                  //     const fileType = file.type.split("/")[0];
                  //     if (fileType === "image") {
                  //       handleImage(URL.createObjectURL(file));
                  //     } else if (fileType === "video") {
                  //       // handleVideo(file);
                  //     }
                  //   }
                  // }}
                />
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
                          onAddToScene={() => createVideo(item.videoElement)}
                        />
                        <div className="flex items-center mt-2">
                          <label className="mr-2">Loop</label>
                          <input
                            type="checkbox"
                            checked={loopVideos[item.id] || false}
                            onChange={() => toggleLoop(item.id)}
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
    </main>
  );
}

export default App;
