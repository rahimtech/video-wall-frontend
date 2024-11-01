import React, { useEffect, useState } from "react";
import { Button } from "@nextui-org/react";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { useMyContext } from "../../context/MyContext";
import axios from "axios";
import io, { connect } from "socket.io-client";
import config from "../../../public/config.json";
import ResourcesSidebar from "../../components/sidebar/ResourcesSidebar";
import ScenesSidebar from "../../components/sidebar/ScenesSidebar";
import HeaderBar from "../../components/HeaderBar";
import Konva from "konva";

let anim;
let layer;
let stage;
let socket = null;

function VideoWallSet() {
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

  const [darkMode, setDarkMode] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [cameraList, setCameraList] = useState([]);
  //New-Commands
  const [scenes, setScenes] = useState([{ id: 1, name: "صحنه 1", resources: [], stageData: null }]);
  const [selectedScene, setSelectedScene] = useState(1);
  let host = config.host;
  let port = config.port;

  const con = useMyContext();
  let arrayCollisions = [];

  let allData = [];

  let minLeftMonitor = 0;
  let minTopMonitor = 0;

  const createNewStage = (newId) => {
    const stage = new Konva.Stage({
      container: `containerKonva-${newId ?? selectedScene}`,
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

    stage.add(newLayer);
    return { stage, layer: newLayer };
  };

  function generateBlobURL(newBaseURL, videoName) {
    const newBlobURL = `${newBaseURL}/uploads/${videoName}.mp4`;

    return newBlobURL;
  }

  const getSelectedScene = () => scenes.find((scene) => scene.id === selectedScene);

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

                updateSceneResources([
                  { type: "video", name: fileName, videoElement: makeVideo },
                  ...getSelectedScene(),
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
      if (getSelectedScene()?.stageData) getSelectedScene()?.stageData.destroy();
      if (layer) layer.destroy();
      // socket.off("update-monitors");
      // socket.off("connect");
      // socket.off("update-event");
    };
  }, []);

  //---------------Start-Resource-Segment-----------------

  const updateSceneResources = (updatedResources) => {
    setScenes((prevScenes) =>
      prevScenes.map((scene) =>
        scene.id === selectedScene ? { ...scene, resources: updatedResources } : scene
      )
    );
  };

  const addVideo = (videoElement) => {
    const id = videoElement.getAttribute("id");
    const selectedSceneLayer = getSelectedScene()?.layer;
    const selectedStage = getSelectedScene()?.stageData;

    if (!selectedSceneLayer || !selectedStage) return;

    const modifiedVideoURL = generateBlobURL(`video:http://${host}:${port}`, id);

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
          return { ...item, x: 0, y: 0, width: image.width(), height: image.height() };
        }
        return item;
      });
    });

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

    allData.push({
      monitor: [1],
      x: 0,
      y: 0,
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
      name: videoElement.name,
      id: id,
    });

    transformer.on("transformend", () => {
      const newWidth = image.width() * image.scaleX();
      const newHeight = image.height() * image.scaleY();
      image.width(newWidth);
      image.height(newHeight);
      image.scaleX(1);
      image.scaleY(1);

      const rotation = Math.round(image.getAttr("rotation"));
      const x = image.x();
      const y = image.y();

      positionText.text(
        `x: ${x}, y: ${y}, width: ${newWidth}, height: ${newHeight}, rotation: ${rotation}`
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
              rotation,
            },
          });
          return { ...item, x, y, width: newWidth, height: newHeight };
        }
        return item;
      });
    });

    image.on("dragmove", (e) => {
      const x = e.target.x();
      const y = e.target.y();
      positionText.text(`x: ${x}, y: ${y}, width: ${image.width()}, height: ${image.height()}`);
    });

    image.on("dragend", () => {
      allData = allData.map((item) => {
        if (item.id === id) {
          socket.emit("source", {
            action: "move",
            id,
            payload: { source: modifiedVideoURL, x: image.x(), y: image.y() },
          });
          return { ...item, x: image.x(), y: image.y() };
        }
        return item;
      });
      selectedSceneLayer.draw();
    });

    videoElement.loop = loopVideos[videoElement.name] || false;
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

  //     socket.emit("source", {
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
  //     socket.emit("source", {
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

  //   socket.emit("source", {
  //     action: "add",
  //     id,
  //     payload: { x, y, width, height, source: `input:${deviceId}` },
  //   });
  // };

  return (
    <main
      className={`${
        darkMode ? "bg-[#1E232A]" : "bg-[#e3e4e4]"
      }  h-screen w-full flex flex-col z-50  items-center `}
    >
      <HeaderBar darkMode={darkMode} setDarkMode={setDarkMode} connecting={connecting} />
      <div
        dir="rtl"
        className="absolute text-white flex flex-col gap-1 items-center justify-center top-[20px]  left-0 right-0 mx-auto w-full z-[100]"
      >
        <div className="text-3xl">تنظیمات چیدمان مانیتورها</div>
        <div>{"( از تنظیمات ویندوز > displays میتوانید چیدمان را تغییر دهید )"}</div>
      </div>
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

      {/* Bottom-Contorlls */}
      <div className="w-full flex justify-center items-center absolute bottom-0 h-[100px] z-[100]">
        <Button variant="solid" color="success" className="w-[200px]">
          ذخیره اطلاعات
        </Button>
      </div>
    </main>
  );
}

export default VideoWallSet;
