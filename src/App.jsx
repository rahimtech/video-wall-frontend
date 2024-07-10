import { Rnd } from "react-rnd";
import React, { useEffect, useRef, useState } from "react";
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
import io from "socket.io-client";
const socket = io("http://192.168.1.7:4000"); // آدرس سرور خود را اینجا قرار دهید

const uploadVideo = async (file, videoName) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("videoName", videoName); // اضافه کردن videoName به فرم دیتا
  try {
    const response = await axios.get("http://192.168.1.7:4000/upload", formData, videoName, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("File uploaded successfully:", response.data.filePath);
  } catch (error) {
    console.error("Error uploading file:", error);
  }
  try {
    const response = await axios.post("http://192.168.1.7:4000/upload", formData, videoName, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("File uploaded successfully:", response.data.filePath);
  } catch (error) {
    console.error("Error uploading file:", error);
  }
};

const Controls = ({ zoomIn, zoomOut, resetTransform }) => (
  <>
    <button onClick={() => zoomIn()}>Zoom In</button>
    <button onClick={() => zoomOut()}>Zoom Out</button>
    <button onClick={() => resetTransform()}>Reset</button>
  </>
);

const MonitorSelect = ({ videoName, monitors, fitToMonitors }) => {
  const monitorOptions = monitors.map((monitor, index) => ({
    value: index,
    label: `Monitor ${index + 1}`,
  }));

  return (
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
  );
};

let anim;
let layer;
let stage;
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
  const con = useMyContext();
  const transformComponentRef = useRef(null);
  let arrayCollisions = [];
  let setData2 = [];
  let updatedPosition = 0;
  let counterImages = 0;
  let counterVideos = 0;
  let allData = [];
  let allDataMonitors = videoWalls;

  useEffect(() => {
    // Your socket initialization code
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("update-event", (data) => {
      console.log("Update event received:", data);
    });

    return () => {
      socket.off("connect");
      socket.off("update-event");
    };
  }, []);

  const sendControlEvent = (data) => {
    socket.emit("control-event", data);
  };

  const toggleLoop = (videoName) => {
    setLoopVideos((prev) => {
      const isLooping = !prev[videoName];
      socket.emit("video-loop", { videoName, isLooping });
      return {
        ...prev,
        [videoName]: isLooping,
      };
    });
  };

  function updateImagePositionRelativeToVideoWall(image, videoWall) {
    const { x, y, width, height } = videoWall;

    const newImageX = image.x() - x;
    const newImageY = -(image.y() + y); // Y باید منفی شود چون در Konva محور Y به سمت پایین است

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

      socket.on("update-monitors", (displays) => {
        console.log("Displays:", displays);
        const newVideoWalls = displays.map((display, index) => ({
          x: display.bounds.x,
          y: display.bounds.y,
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

        for (var i = 0; i < newVideoWalls.length; i++) {
          if (newVideoWalls[i].x < 0) {
            newVideoWalls[i].x = newVideoWalls[i].x * -1;
          }
          if (newVideoWalls[i].y < 0) {
            newVideoWalls[i].y = newVideoWalls[i].y * -1;
          }

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
            handleVideo(file);
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
          if (item && item.name == searchIndexArray) {
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

        const transformer = new Konva.Transformer({
          nodes: [image],
          enabledAnchors: [
            "top-left",
            "top-right",
            "top-center",
            "bottom-left",
            "bottom-right",
            "bottom-center",
            "middle-right",
            "middle-left",
          ],
        });

        group2.add(transformer);

        transformer.on("transform", () => {
          const scaleX = image.scaleX();
          const scaleY = image.scaleY();
          image.width(image.image().width * scaleX);
          image.height(image.image().height * scaleY);
          layer.batchDraw();
          processImageResize(image.width(), image.height(), group2);
        });

        const positionRelativeToVideoWall = updateImagePositionRelativeToVideoWall(
          group2,
          allDataMonitors[0]
        );
        group2.position(positionRelativeToVideoWall);

        allData.push({
          monitor: [1],
          x: positionRelativeToVideoWall.x,
          y: positionRelativeToVideoWall.y,
          width: image.width(),
          height: image.height(),
          name: "image" + counterImages,
        });
      }

      function handleVideo(arrayBuffer) {
        const video = document.createElement("video");
        video.src = URL.createObjectURL(arrayBuffer);

        const videoName = "video" + counterVideos++;
        video.setAttribute("id", videoName);

        setContent((prev) => [...prev, { type: "video", name: videoName, videoElement: video }]);
        sendControlEvent({ type: "ADD_VIDEO", videoName });
        uploadVideo(arrayBuffer, videoName);

        video.addEventListener("loadedmetadata", () => {
          const group2 = new Konva.Group({
            draggable: true,
            x: 0,
            y: 0,
            id: videoName,
          });

          const image = new Konva.Image({
            image: video,
            width: video.videoWidth,
            height: video.videoHeight,
            name: "object",
            fill: "gray",
            id: videoName,
          });

          group2.add(image);
          layer.add(group2);
          stage.add(layer);

          const positionRelativeToVideoWall = updateImagePositionRelativeToVideoWall(
            group2,
            allDataMonitors[0]
          );
          group2.position(positionRelativeToVideoWall);

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
            x: positionRelativeToVideoWall.x,
            y: positionRelativeToVideoWall.y,
            width: image.width(),
            height: image.height(),
            name: videoName,
            id: videoName,
          });

          transformer.on("transformend", () => {
            const scaleX = image.scaleX();
            const scaleY = image.scaleY();
            const newWidth = image.width() * scaleX;
            const newHeight = image.height() * scaleY;
            const x = image.x();
            const y = image.y();

            image.width(newWidth);
            image.height(newHeight);
            image.scaleX(1);
            image.scaleY(1);
            image.x(0);
            image.y(0);

            const updatedPosition = updateImagePositionRelativeToVideoWall(
              group2,
              allDataMonitors[0]
            );
            console.log(
              `Updated position and size: (${parseInt(x)}, ${parseInt(y)}, ${parseInt(
                newWidth
              )}, ${parseInt(newHeight)})`
            );

            allData = allData.map((item) => {
              if (item.name === videoName) {
                handleResizeEnd(videoName, newWidth, newHeight, x, y);
                return {
                  ...item,
                  x: x,
                  y: y,
                  width: newWidth,
                  height: newHeight,
                };
              }
              return item;
            });
          });

          group2.on("dragstart", () => {
            group2.opacity(0.2);
            group2.moveToTop();
            layer.draw();
          });

          group2.on("dragend", (e) => {
            group2.opacity(1);
            const updatedPosition = updateImagePositionRelativeToVideoWall(
              e.target,
              allDataMonitors[0]
            );

            allData = allData.map((item) => {
              if (item.name === videoName) {
                handleDragEnd(videoName, updatedPosition.x, updatedPosition.y);
                return {
                  ...item,
                  x: updatedPosition.x,
                  y: updatedPosition.y,
                };
              }
              return item;
            });
            layer.draw();
          });
          video.loop = loopVideos[videoName] || false;
        });
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

        let searchIndexArray = e.target.children[0].getAttr("id");
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
    }
    fetchData();

    return () => {
      if (stage) stage.destroy();
      if (layer) layer.destroy();
      socket.off("update-monitors");
    };
  }, []);

  useEffect(() => {
    content.forEach((item) => {
      if (item.type === "video") {
        const videoElement = item.videoElement;
        if (videoElement) {
          videoElement.loop = loopVideos[item.name] || false;
        }
      }
    });
  }, [loopVideos, content]);

  const fitToMonitors = (videoName, selectedMonitors) => {
    const videoGroup = layer.findOne(`#${videoName}`);
    if (videoGroup) {
      const firstMonitor = allDataMonitors[selectedMonitors[0]];
      const lastMonitor = allDataMonitors[selectedMonitors[selectedMonitors.length - 1]];

      const x = firstMonitor.x;
      const y = firstMonitor.y;
      const width = lastMonitor.x + lastMonitor.width - firstMonitor.x;
      const height = lastMonitor.y + lastMonitor.height - firstMonitor.y;

      videoGroup.position({ x, y });

      const videoNode = videoGroup.findOne("Image");
      if (videoNode) {
        videoNode.width(width);
        videoNode.height(height);
        layer.draw();
      }

      socket.emit("video-fit", { videoName, x, y, width, height });
    }
  };

  const handleDragEnd = (videoName, x, y) => {
    console.log("videoName::: ", videoName);
    y *= -1;
    socket.emit("video-move", { videoName, x, y });
  };

  const handleResizeEnd = (videoName, width, height, x, y) => {
    console.log("videoName::: ", videoName);
    socket.emit("video-resize", { videoName, width, height, x, y });
  };

  const handleRotateVideo = (videoName, angle) => {
    sendControlEvent({ type: "ROTATE_VIDEO", videoName, angle });
    socket.emit("video-rotate", { videoName, angle });
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

  const handleDeleteVideo = async (fileName) => {
    console.log("fileName::: ", fileName);
    try {
      const response = await axios.delete(`http://192.168.1.7:4000/delete/${fileName}`);
      console.log("File deleted successfully:", response.data.message);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const deleteContent = async (videoName) => {
    setContent(content.filter((item) => item.name !== videoName));
    sendControlEvent({ type: "DELETE_CONTENT", contentName: videoName });
    await handleDeleteVideo(videoName);

    // پیدا کردن و حذف گروه مربوط به ویدیو از لایه
    const groupToRemove = layer.findOne(`#${videoName}`);
    if (groupToRemove) {
      // متوقف کردن ویدیو
      const videoElement = content.find((item) => item.name === videoName)?.videoElement;
      if (videoElement) {
        videoElement.pause();
        videoElement.src = ""; // آزاد کردن منبع ویدیو
      }

      // حذف Transformer های مرتبط
      const transformers = layer.find("Transformer");
      transformers.forEach((transformer) => {
        const nodes = transformer.nodes();
        if (nodes.includes(groupToRemove.findOne(".object"))) {
          transformer.detach();
          transformer.destroy();
        }
      });

      // حذف گروه والد
      groupToRemove.destroy();

      layer.draw();
    }
  };

  const playVideo = (videoName) => {
    const video = content.find((item) => item.name === videoName)?.videoElement;
    console.log("video::: ", video);
    if (video) {
      video.play();
      // sendControlEvent({ type: "video-play", videoName });
      socket.emit("video-play", { videoName });
      anim.start();
    }
  };

  const pauseVideo = (videoName) => {
    const video = content.find((item) => item.name === videoName)?.videoElement;
    if (video) {
      video.pause();
      // sendControlEvent({ type: "video-pause", videoName });
      socket.emit("video-pause", { videoName });
    }
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
        } w-full shadow-xl  px-3 shadow-gray-[#1c2026] flex items-center justify-between h-[60px] z-10`}
      >
        <div id="setting" className="text-black flex items-center">
          <Setting />
          <SwitchCustom setDarkMode={setDarkMode} darkMode={darkMode} />
        </div>

        <div className=" flex right-0 relative">
          <div>وضعیت اتصال</div>
          <div class="blob"></div>
          {/* <div class="blobred"></div> */}
        </div>
      </div>
      <div className="h-full w-full flex z-50">
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
                {videoWalls?.map((videoName, index) => (
                  <li
                    key={videoName.name}
                    className="flex justify-between px-1 bg-[#bcc2c9] rounded-lg  w-full"
                  >
                    <span>{videoName.id}</span>
                    <span>{videoName.width + "*" + videoName.height}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center bg-gray-300 rounded-lg p-4 flex flex-col items-center shadow-md">
              <h2 className="text-lg font-semibold mb-4">مدیریت محتوا</h2>
              <div className="cursor-pointer mb-4">
                <Button
                  onClick={addContent}
                  className={` py-2 rounded-lg text-white ${
                    checkvideo === 4 || checkvideo === 8
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-blue-600"
                  }`}
                  disabled={checkvideo === 4 || checkvideo === 8}
                >
                  افزودن محتوا
                </Button>
                <input
                  className="absolute left-10 h-12 opacity-0 cursor-pointer w-[110px]"
                  type="file"
                  id="fileInput"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const fileType = file.type.split("/")[0];
                      if (fileType === "image") {
                        handleImage(URL.createObjectURL(file));
                      } else if (fileType === "video") {
                        handleVideo(file);
                      }
                    }
                  }}
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
                          onClick={() => playVideo(item.name)}
                        >
                          Play
                        </button>
                        <button
                          className="w-full bg-orange-500 rounded-md py-1 text-white"
                          onClick={() => pauseVideo(item.name)}
                        >
                          Pause
                        </button>
                        <MonitorSelect
                          videoName={item.name}
                          monitors={allDataMonitors}
                          fitToMonitors={fitToMonitors}
                        />
                        <div className="flex items-center mt-2">
                          <label className="mr-2">Loop</label>
                          <input
                            type="checkbox"
                            checked={loopVideos[item.name] || false}
                            onChange={() => toggleLoop(item.name)}
                          />
                        </div>
                      </div>
                    )}
                    <span
                      onClick={() => deleteContent(item.name)}
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
                <div
                  className=" z-50 relative "
                  id="containerKonva"
                  onMouseDown={(e) => {
                    con.setFlagDragging(false);
                  }}
                >
                  {content.map((contentItem, index) => (
                    <Contents
                      key={contentItem.name}
                      videoName={contentItem.name}
                      index={index}
                      IAG={con.isActiveG}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
