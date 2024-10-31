import React, { useEffect, useState } from "react";

import { Button } from "@nextui-org/react";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { useMyContext } from "./context/MyContext";
import axios from "axios";
import io, { connect } from "socket.io-client";
import config from "../public/config.json";
import ResourcesSidebar from "./components/sidebar/ResourcesSidebar";
import ScenesSidebar from "./components/sidebar/ScenesSidebar";
import HeaderBar from "./components/HeaderBar";
import Konva from "konva";

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

  const [darkMode, setDarkMode] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [cameraList, setCameraList] = useState([]);
  //New-Commands
  const [scenes, setScenes] = useState([{ id: 1, name: "صحنه 1", resources: [], stageData: null }]);

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

  const addScene = () => {
    const newId = scenes.length > 0 ? Math.max(...scenes.map((scene) => scene.id)) + 1 : 1;

    const newScene = {
      id: newId,
      name: `صحنه ${newId} `,
      resources: [],
    };

    setScenes([...scenes, newScene]);
    setSelectedScene(newId);
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

  // const MonitorSelect = ({ videoName, monitors, fitToMonitors, onAddToScene }) => {
  //   const monitorOptions = monitors.map((monitor, index) => ({
  //     value: index,
  //     label: `Monitor ${index + 1}`,
  //   }));

  //   return (
  //     <>
  //       <Select
  //         isMulti
  //         name="monitors"
  //         options={monitorOptions}
  //         className="basic-multi-select"
  //         classNamePrefix="select"
  //         onChange={(selectedOptions) => {
  //           const selectedMonitors = selectedOptions.map((option) => option.value);
  //           fitToMonitors(videoName, selectedMonitors);
  //         }}
  //       />
  //       <Button variant="flat" color="primary" onClick={onAddToScene}>
  //         افزودن به صحنه
  //       </Button>
  //     </>
  //   );
  // };

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
      if (e.target === getSelectedScene()?.stageData || e.target === selectedSceneLayer) {
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
      const { stage, layer } = createNewStage();

      setScenes((prevScenes) =>
        prevScenes.map((scene) =>
          scene.id === selectedScene.id ? { ...scene, stageData: stage, layer } : scene
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
            textContent: result.value,
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
            webURL, // ذخیره کردن URL
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
        socket.emit("source", {
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
          console.error(`Group with id ${id} not found`);
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

  const handleFileInput = (e, type) => {
    const file = e.target.files[0];

    if (file) {
      const fileType = file.type.split("/")[0];
      if (fileType === "image" && type === "image") {
        const imageURL = URL.createObjectURL(file);
        let img = new Image();
        img.src = imageURL;
        const id = crypto.randomUUID();
        const imageName = "image" + counterImages++;

        let newResource = {
          type: "image",
          id,
          name: imageName,
          imageElement: img,
          content: "",
        };

        updateSceneResources([newResource, ...getSelectedScene().resources]);
      } else if (fileType === "video" && type === "video") {
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

        updateSceneResources([newResource, ...getSelectedScene().resources]);
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

  const addImage = (img) => {
    const selectedSceneLayer = getSelectedScene()?.layer;
    if (!selectedSceneLayer) return;

    const image = new Konva.Image({
      image: img.imageElement,
      width: img.imageElement.width,
      height: img.imageElement.height,
      name: "object",
      id: img.id,
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

    selectedSceneLayer.add(image);
    selectedSceneLayer.draw();
  };

  //---------------Start-Web-Segment-----------------

  const addWeb = (webResource) => {
    const { id, webURL } = webResource;
    const selectedSceneLayer = getSelectedScene()?.layer;
    const selectedStage = getSelectedScene()?.stageData;

    if (!selectedSceneLayer || !selectedStage) return;

    const group = new Konva.Group({
      x: (selectedStage.width() - 1920) / 2,
      y: (selectedStage.height() - 1080) / 2,
      draggable: true,
      id: id,
    });

    const webRect = new Konva.Rect({
      width: 1920,
      height: 1080,
      fill: "lightgray",
      stroke: "black",
      strokeWidth: 2,
    });

    const webText = new Konva.Text({
      text: webURL,
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
      inputValue: webResource.webURL,
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

    if (!selectedSceneLayer || !selectedStage) return;

    const textNode = new Konva.Text({
      text: text.textContent,
      fontSize: 100,
      fontFamily: "Arial",
      fill: text.color || "black",
      x: 50,
      y: 50,
      draggable: true,
      id: text.id,
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

    selectedSceneLayer.add(textNode);
    selectedStage.add(selectedSceneLayer);
    selectedSceneLayer.draw();
  };

  const editText = (text) => {
    Swal.fire({
      title: "ویرایش متن:",
      input: "text",
      inputValue: text.textContent,
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
                    ? { ...resource, textContent: result.value, name: result.value }
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
            resource.id === resourceId
              ? { ...resource, name: newName, textContent: newName }
              : resource
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
      <motion.div
        className={`flex w-full h-[350px] border-t overflow-y-auto items-center ${
          darkMode ? "" : "shadow-custome"
        } `}
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
              addText={addText}
              addImage={addImage}
              editText={editText}
              updateResourceName={updateResourceName}
              updateResourceColor={updateResourceColor}
              addWeb={addWeb}
              editWeb={editWeb}
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
