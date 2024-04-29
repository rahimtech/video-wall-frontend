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
// import { exec } from "child_process";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import SwitchCustom from "./components/SwitchCustom";

const Controls = ({ zoomIn, zoomOut, resetTransform }) => (
  <>
    <button onClick={() => zoomIn()}>Zoom In</button>
    <button onClick={() => zoomOut()}>Zoom Out</button>
    <button onClick={() => resetTransform()}>Reset</button>
  </>
);

function App() {
  const [videoWalls, setVideoWalls] = useState();
  const [content, setContent] = useState([]);
  const [content2, setContent2] = useState([]);
  const [checkvideo, setCheckVideo] = useState(1);
  const [checkSection, setCheckSection] = useState(0);
  const [scale, setScale] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [data, setData] = useState([]);
  const [relativePosition, setRelativePosition] = useState({ x: 0, y: 0 });
  const con = useMyContext();
  const transformComponentRef = useRef(null);
  let arrayCollisions = [];
  let setData2 = [];
  let updatedPosition = 0;
  let counterImages = 0;
  let counterVideos = 0;
  let allData = [];
  let allDataMonitors = [];
  function updateImagePositionRelativeToVideoWall(image, videoWall) {
    const { x, y, width, height } = videoWall;
    const scaleX = image.width() / width;

    const scaleY = image.height() / height;

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

  useEffect(async () => {
    // GET request
    // axios
    //   .get("/api/users")
    //   .then((response) => {
    //     console.log(response.data);
    //   })
    //   .catch((error) => {
    //     console.error("Error fetching data:", error);
    //   });

    var width = window.innerWidth;
    var height = window.innerHeight;
    var GUIDELINE_OFFSET = 5;
    var WIDTH = 1000;
    var HEIGHT = 1000;
    var NUMBER = 2;
    let group = null;

    var stage = new Konva.Stage({
      container: "containerKonva",
      width: width,
      height: height,
      draggable: true,
    });

    var layer = new Konva.Layer();
    stage.add(layer);

    function generateNode(x, y, width, height, name) {
      group = new Konva.Group({
        clip: {
          x: x,
          y: -y,
          width: width,
          height: height,
          fill: "red",
        },
      });

      const rect = new Konva.Rect({
        x: x,
        y: -y,
        width: width,
        height: height,
        fill: "#e3e4e4",
        stroke: "black",
        name: "fillShape",
        strokeWidth: 3,
        id: name,
      });

      group.add(rect);

      return group;
    }

    await axios
      .get("http://127.0.0.1:5500/displays")
      .then((response) => {
        console.log(response.data);
        allDataMonitors = response.data;
        setVideoWalls(allDataMonitors);
        console.log("allDataMonitors::: ", allDataMonitors);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
    console.log(allDataMonitors);

    for (var i = 0; i < allDataMonitors?.length; i++) {
      layer.add(
        generateNode(
          allDataMonitors[i].x,
          allDataMonitors[i].y,
          allDataMonitors[i].width,
          allDataMonitors[i].height,
          allDataMonitors[i].name
        )
      );
    }

    layer.draw();

    var scaleBy = 1.04;
    stage.on("wheel", (e) => {
      // stop default scrolling
      e.evt.preventDefault();

      var oldScale = stage.scaleX();
      var pointer = stage.getPointerPosition();

      var mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      // how to scale? Zoom in? Or zoom out?
      let direction = e.evt.deltaY > 0 ? 1 : -1;

      // when we zoom on trackpad, e.evt.ctrlKey is true
      // in that case lets revert direction
      if (e.evt.ctrlKey) {
        direction = -direction;
      }

      var newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

      stage.scale({ x: newScale, y: newScale });

      var newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      stage.position(newPos);
    });
    stage.position({ x: 200, y: 200 });
    stage.scale({ x: 0.17, y: 0.17 });

    // console.log("layer::: ", layer);
    // console.log("group::: ", group);

    var anim = new Konva.Animation(function () {
      // do nothing, animation just need to update the layer
    }, layer);

    var inputElement = document.getElementById("fileInput");

    inputElement.addEventListener("change", function (e) {
      const file = e.target.files[0];
      console.log("file::: ", file);

      if (file) {
        const fileType = file.type.split("/")[0]; // "image" یا "video"
        console.log("fileType::: ", fileType);

        if (fileType === "image") {
          // اگر نوع فایل تصویر باشد
          const imageURL = URL.createObjectURL(file);
          handleImage(imageURL);
        } else if (fileType === "video") {
          // اگر نوع فایل ویدیو باشد
          // const videoURL = URL.createObjectURL(file);
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
        if (group === target) {
          return;
        }
        if (haveIntersection(group.getClientRect(), targetRect)) {
          if (group instanceof Konva.Group) {
            const shape = group.findOne(".fillShape");
            if (shape) {
              shape.stroke("red");
              let x = arrayCollisions.find(
                (item) => item == shape.getAttr("id")
              );

              if (!x) {
                arrayCollisions.push(shape.getAttr("id"));
              }
            }
          }
        } else {
          if (group instanceof Konva.Group) {
            const shape = group.findOne(".fillShape");

            if (shape) {
              let x = arrayCollisions.find(
                (item) => item == shape.getAttr("id")
              );

              if (x) {
                let y = arrayCollisions.indexOf(x);
                if (y !== -1) {
                  arrayCollisions.splice(y, 1);
                }
              }
              shape.stroke("white");
            }
          }
        }
      });

      let searchIndexArray = group2.getAttr("id");

      allData.find((item) => {
        if (item.name == searchIndexArray) {
          let updatedPosition = updateImagePositionRelativeToVideoWall(
            group2.children[0],
            videoWalls[0]
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
      img.src = "/public/logo192.png";
      counterImages++;
      const group2 = new Konva.Group({
        draggable: true,
        x: 0,
        y: 0,
        id: "image" + counterImages,
      });

      const image = new Konva.Image({
        image: img, // استفاده از داده URL برای تصویر
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

      const positionRelativeToVideoWall =
        updateImagePositionRelativeToVideoWall(group2, videoWalls[0]);
      group2.position(positionRelativeToVideoWall);

      allData.push([
        {
          monitor: [1],
          x: positionRelativeToVideoWall.x,
          y: positionRelativeToVideoWall.y,
          width: image.width(),
          height: image.height(),
          name: "image" + counterImages,
        },
      ]);

      console.log(allData);
    }

    async function handleVideo(arrayBuffer) {
      console.log("arrayBuffer::: ", arrayBuffer);
      const video = document.createElement("video");
      video.src = "/public/1.mp4";

      var formData = new FormData();

      formData.append("file", arrayBuffer);

      // await axios
      //   .post("http://127.0.0.1:5500/files/upload", formData, {
      //     headers: {
      //       "Content-Type": "multipart/form-data",
      //     },
      //   })
      //   .then((response) => {
      //     console.log(response.data);
      //   })
      //   .catch((error) => {
      //     console.error("Error fetching data:", error);
      //   });

      video.setAttribute("id", "video" + counterVideos++);

      video.addEventListener("loadedmetadata", () => {
        const group2 = new Konva.Group({
          draggable: true,
          x: 0,
          y: 0,
        });

        const image = new Konva.Image({
          image: video,
          width: video.videoWidth,
          height: video.videoHeight,
          name: "object",
          fill: "gray",
          id: "video" + counterVideos,
        });

        const group3 = new Konva.Group({
          id: "video" + counterVideos,
        });

        const group4 = new Konva.Group({
          id: "video" + counterVideos,
        });

        const playButton = new Konva.Rect({
          x: 10,
          y: 10,
          width: 50,
          height: 30,
          fill: "green",
          cornerRadius: 5,
        });

        const playText = new Konva.Text({
          x: 20,
          y: 15,
          text: "Play",
          fontSize: 16,
          fill: "white",
        });

        const pauseButton = new Konva.Rect({
          x: 70,
          y: 10,
          width: 60,
          height: 30,
          fill: "red",
          cornerRadius: 5,
        });

        const pauseText = new Konva.Text({
          x: 80,
          y: 15,
          text: "Pause",
          fontSize: 16,
          fill: "white",
        });

        group3.add(playButton);
        group3.add(playText);
        group4.add(pauseButton);
        group4.add(pauseText);

        group2.add(image);
        group2.add(group3);
        group2.add(group4);

        layer.add(group2);
        stage.add(layer);

        // عملکرد دکمه Play
        group3.on("click tap", () => {
          video.play();
          anim.start();
        });

        group4.on("click tap", () => {
          video.pause();
        });

        image.width(video.videoWidth);
        image.height(video.videoHeight);

        const positionRelativeToVideoWall =
          updateImagePositionRelativeToVideoWall(group2, videoWalls[0]);
        group2.position(positionRelativeToVideoWall);

        layer.draw();

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
          image.width(video.videoWidth * scaleX);
          image.height(video.videoHeight * scaleY);
          layer.batchDraw();
          processImageResize(image.width(), image.height(), group2);
        });
        let xx = 0;
        axios
          .get("http://127.0.0.1:5500/sources")
          .then((response) => {
            xx = response.data.id;
            console.log("User added successfully");
          })
          .catch((error) => {
            console.error("Error adding user:", error);
          });
        console.log(xx);

        axios
          .post("http://127.0.0.1:5500/sources", {
            // id: "13ab8ea5-2b8b-45fb-a760-c1075d95d724",
            name: "video" + counterVideos,
            x: positionRelativeToVideoWall.x,
            y: positionRelativeToVideoWall.y,
            width: image.width(),
            height: image.height(),
            source: 0,
            z_index: 0,
            fps: 30,
          })
          .then((response) => {
            allData.push(
              {
                monitor: [1],
                x: positionRelativeToVideoWall.x,
                y: positionRelativeToVideoWall.y,
                width: image.width(),
                height: image.height(),
                name: "video" + counterVideos,
                id: response.data.id,
              },
              console.log(allData)
            );
          })
          .catch((error) => {
            console.error("Error adding user:", error);
          });

        // console.log(allData);
      });
      stage.on("click", (e) => {
        if (e.target !== video) {
          const index = layer.children.findIndex(
            (child) => child instanceof Konva.Transformer
          );

          if (index !== -1) {
            layer.children.splice(index, 1);
          }
          layer.draw();
          console.log(layer);
        }
      });
    }

    // were can we snap our objects?
    function getLineGuideStops(skipShape) {
      var vertical = [0, stage.width() / 2, stage.width()];
      var horizontal = [0, stage.height() / 2, stage.height()];

      stage.find(".object").forEach((guideItem) => {
        if (guideItem === skipShape) {
          return;
        }
        var box = guideItem.getClientRect();
        // and we can snap to all edges of shapes
        vertical.push([box.x, box.x + box.width, box.x + box.width / 2]);
        horizontal.push([box.y, box.y + box.height, box.y + box.height / 2]);
      });
      return {
        vertical: vertical.flat(),
        horizontal: horizontal.flat(),
      };
    }

    // what points of the object will trigger to snapping?
    // it can be just center of the object
    // but we will enable all edges and center
    function getObjectSnappingEdges(node) {
      var box = node.getClientRect();
      var absPos = node.absolutePosition();

      return {
        vertical: [
          {
            guide: Math.round(box.x),
            offset: Math.round(absPos.x - box.x),
            snap: "start",
          },
          {
            guide: Math.round(box.x + box.width / 2),
            offset: Math.round(absPos.x - box.x - box.width / 2),
            snap: "center",
          },
          {
            guide: Math.round(box.x + box.width),
            offset: Math.round(absPos.x - box.x - box.width),
            snap: "end",
          },
        ],
        horizontal: [
          {
            guide: Math.round(box.y),
            offset: Math.round(absPos.y - box.y),
            snap: "start",
          },
          {
            guide: Math.round(box.y + box.height / 2),
            offset: Math.round(absPos.y - box.y - box.height / 2),
            snap: "center",
          },
          {
            guide: Math.round(box.y + box.height),
            offset: Math.round(absPos.y - box.y - box.height),
            snap: "end",
          },
        ],
      };
    }

    // find all snapping possibilities
    function getGuides(lineGuideStops, itemBounds) {
      var resultV = [];
      var resultH = [];

      lineGuideStops.vertical.forEach((lineGuide) => {
        itemBounds.vertical.forEach((itemBound) => {
          var diff = Math.abs(lineGuide - itemBound.guide);
          // if the distance between guild line and object snap point is close we can consider this for snapping
          if (diff < GUIDELINE_OFFSET) {
            resultV.push({
              lineGuide: lineGuide,
              diff: diff,
              snap: itemBound.snap,
              offset: itemBound.offset,
            });
          }
        });
      });

      lineGuideStops.horizontal.forEach((lineGuide) => {
        itemBounds.horizontal.forEach((itemBound) => {
          var diff = Math.abs(lineGuide - itemBound.guide);
          if (diff < GUIDELINE_OFFSET) {
            resultH.push({
              lineGuide: lineGuide,
              diff: diff,
              snap: itemBound.snap,
              offset: itemBound.offset,
            });
          }
        });
      });

      var guides = [];

      // find closest snap
      var minV = resultV.sort((a, b) => a.diff - b.diff)[0];
      var minH = resultH.sort((a, b) => a.diff - b.diff)[0];
      if (minV) {
        guides.push({
          lineGuide: minV.lineGuide,
          offset: minV.offset,
          orientation: "V",
          snap: minV.snap,
        });
      }
      if (minH) {
        guides.push({
          lineGuide: minH.lineGuide,
          offset: minH.offset,
          orientation: "H",
          snap: minH.snap,
        });
      }
      return guides;
    }

    function drawGuides(guides) {
      guides.forEach((lg) => {
        if (lg.orientation === "H") {
          var line = new Konva.Line({
            points: [-6000, 0, 6000, 0],
            stroke: "rgb(0, 161, 255)",
            strokeWidth: 1,
            name: "guid-line",
            dash: [4, 6],
          });
          layer.add(line);
          line.absolutePosition({
            x: 0,
            y: lg.lineGuide,
          });
        } else if (lg.orientation === "V") {
          var line = new Konva.Line({
            points: [0, -6000, 0, 6000],
            stroke: "rgb(0, 161, 255)",
            strokeWidth: 1,
            name: "guid-line",
            dash: [4, 6],
          });
          layer.add(line);
          line.absolutePosition({
            x: lg.lineGuide,
            y: 0,
          });
        }
      });
    }

    layer.on("dragmove", function (e) {
      layer.find(".guid-line").forEach((l) => l.destroy());
      var lineGuideStops = getLineGuideStops(e.target);
      var itemBounds = getObjectSnappingEdges(e.target);
      var guides = getGuides(lineGuideStops, itemBounds);

      if (!guides.length) {
        return;
      }

      drawGuides(guides);

      var absPos = e.target.absolutePosition();
      // now force object position
      guides.forEach((lg) => {
        switch (lg.snap) {
          case "start": {
            switch (lg.orientation) {
              case "V": {
                absPos.x = lg.lineGuide + lg.offset;
                break;
              }
              case "H": {
                absPos.y = lg.lineGuide + lg.offset;
                break;
              }
            }
            break;
          }
          case "center": {
            switch (lg.orientation) {
              case "V": {
                absPos.x = lg.lineGuide + lg.offset;
                break;
              }
              case "H": {
                absPos.y = lg.lineGuide + lg.offset;
                break;
              }
            }
            break;
          }
          case "end": {
            switch (lg.orientation) {
              case "V": {
                absPos.x = lg.lineGuide + lg.offset;
                break;
              }
              case "H": {
                absPos.y = lg.lineGuide + lg.offset;
                break;
              }
            }
            break;
          }
        }
      });
      e.target.absolutePosition(absPos);

      var target = e.target;
      var targetRect = e.target.getClientRect();
      layer.children.forEach(function (group) {
        if (group === target) {
          return;
        }
        if (haveIntersection(group.getClientRect(), targetRect)) {
          if (group instanceof Konva.Group) {
            const shape = group.findOne(".fillShape");
            if (shape) {
              shape.stroke("red");
              let x = arrayCollisions.find(
                (item) => item == shape.getAttr("id")
              );

              if (!x) {
                arrayCollisions.push(shape.getAttr("id"));
              }
            }
          }
        } else {
          if (group instanceof Konva.Group) {
            const shape = group.findOne(".fillShape");

            if (shape) {
              let x = arrayCollisions.find(
                (item) => item == shape.getAttr("id")
              );

              if (x) {
                let y = arrayCollisions.indexOf(x);
                if (y !== -1) {
                  arrayCollisions.splice(y, 1);
                }
              }
              shape.stroke("white");
            }
          }
        }
      });

      let searchIndexArray = e.target.children[0].getAttr("id");
      console.log("allData::: ", allData);
      allData.find((item) => {
        console.log("searchIndexArray::: ", searchIndexArray);
        console.log("item.name::: ", item?.name);
        if (item && item.name == searchIndexArray) {
          let updatedPosition = updateImagePositionRelativeToVideoWall(
            e.target,
            videoWalls[0]
          );
          item = {
            monitor: arrayCollisions,
            x: updatedPosition.x,
            y: updatedPosition.y,
            width: item.width,
            height: item.height,
            name: searchIndexArray,
            id: item.id,
          };

          axios
            .patch("http://127.0.0.1:5500/sources", {
              id: item.id,
              name: item.name,
              x: updatedPosition.x,
              y: updatedPosition.y,
              width: item.width,
              height: item.height,
              source: 0,
              z_index: 0,
              fps: 30,
            })
            .then((response) => {
              console.log("Source updated successfully");
            })
            .catch((error) => {
              console.error("Error updating source:", error);
            });
          console.log(item);
        }
      });
    });

    layer.on("dragend", function (e) {
      // clear all previous lines on the screen
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
  }, [setContent2, content2]);

  // useEffect(() => {
  //   const div = document.getElementById("infiniteDiv");
  //   const content = document.getElementById("content");

  //   let isDragging = false;
  //   let lastX = 0;
  //   let lastY = 0;

  //   let offsetX = 0;
  //   let offsetY = 0;

  //   function handleMouseDown(event) {
  //     console.log("flagDragging11::: ", con.flagDragging);
  //     if (con.flagDragging) {
  //       isDragging = true;
  //       lastX = event.clientX;
  //       lastY = event.clientY;
  //     }
  //   }

  //   function handleMouseMove(event) {
  //     if (isDragging) {
  //       const newX = event.clientX;
  //       const newY = event.clientY;

  //       offsetX += newX - lastX;
  //       offsetY += newY - lastY;

  //       content.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

  //       lastX = newX;
  //       lastY = newY;
  //     }
  //   }

  //   function handleMouseUp() {
  //     isDragging = false;
  //   }
  //   if (con.flagDragging) {
  //     div.addEventListener("mousedown", handleMouseDown);
  //     div.addEventListener("mousemove", handleMouseMove);
  //     div.addEventListener("mouseup", handleMouseUp);

  //     // Resize div to match window size
  //     function resizeDiv() {
  //       div.style.width = window.innerWidth + "px";
  //       div.style.height = window.innerHeight + "px";
  //     }

  //     resizeDiv();
  //     window.addEventListener("resize", resizeDiv);
  //   }
  // }, []);

  // useEffect(() => {
  //   let x = con.cF[0]?.x - con.cB.x;
  //   let y = con.cF[0]?.y - con.cB.y;
  //   setRelativePosition({ x: x, y: y });
  //   console.log(relativePosition.x);
  //   console.log(relativePosition.y);
  //   console.log("________________");
  // }, [con.cF]);

  const lunching = () => {
    var canvas = document.getElementById("All");
    if (canvas.getContext) {
      var ctx = canvas.getContext("2d");
      ctx.fillRect(50, 50, 200, 200);
    }
  };

  const addContent = () => {
    setContent([...content, `content${content.length + 1}`]);
  };

  const handleCheckVideo = (num) => {
    setCheckVideo(num);
  };

  const handleCheckSection = (num) => {
    if (num === 0) {
      setCheckSection(0);
    } else {
      setCheckSection(num);
    }
  };

  const deletVideoWall = (item) => {
    let newArray = videoWalls.filter((i) => i !== item);
    setVideoWalls(newArray);
  };

  const deleteContent = (item) => {
    let newArray = content.filter((i) => i !== item);
    setContent(newArray);
  };

  return (
    <main
      className={`p-6 ${
        darkMode ? "bg-black" : "bg-[#e3e4e4]"
      }  h-screen w-full flex  items-center gap-5`}
    >
      <div
        id="Options"
        className={` absolute left-0 h-full z-50 transition-all overflow-auto p-3 w-[200px] ${
          darkMode ? "bg-[#212121]" : "bg-[#bcc2c9]"
        } flex flex-col justify-between gap-5`}
      >
        <div className="flex flex-col gap-5">
          <div
            id="Pictures-setting"
            className="text-center bg-gray-400 rounded-lg px-1 flex flex-col items-center justify-start w-full"
          >
            <h1 className="">مدیریت مانیتورها </h1>
            <ul className="w-full px-1 flex flex-col gap-2  p-1 rounded-md h-[180px] overflow-y-auto">
              {videoWalls?.map((videoName, index) => (
                <li
                  key={videoName.name}
                  className="flex justify-between px-1 bg-[#bcc2c9] rounded-lg  w-full"
                >
                  <span>{videoName.name}</span>
                  <span>{videoName.width + "*" + videoName.height}</span>
                  {/* <span
                  onClick={() => deletVideoWall(videoName)}
                  className="cursor-pointer hover:shadow-md shadow-black"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-red-900" />
                </span> */}
                </li>
              ))}
            </ul>
          </div>
          <div
            id="Pictures-setting"
            className="text-center bg-gray-400 rounded-lg px-1 flex flex-col items-center justify-start w-full"
          >
            <h1 className="">مدیریت محتوا </h1>
            <div className="cursor-pointer">
              <Button
                onClick={addContent}
                className={`${
                  checkvideo == 4 || checkvideo == 8
                    ? "bg-slate-500"
                    : "bg-slate-600  cursor-pointer"
                } w-[120px] px-3 py-2 rounded-xl text-white m-1`}
                disabled={checkvideo == 4 || checkvideo == 8 ? true : false}
              >
                افزودن محتوا
              </Button>
              <input
                className="absolute left-10 h-[45px] opacity-0 cursor-pointer w-[100px]"
                type="file"
                id="fileInput"
              />
            </div>
            {/* <button id="play">Play</button>
          <button id="pause">Pause</button>
          <input type="checkbox" id="checkbox" /> */}
            <ul className="w-full px-1 flex flex-col gap-2  p-1 rounded-md h-[180px] overflow-y-auto">
              {content.map((videoName, index) => (
                <li
                  key={videoName}
                  className="flex justify-between px-1 bg-slate-500 rounded-lg  w-full"
                >
                  <span>{videoName}</span>
                  <span
                    onClick={() => deleteContent(videoName)}
                    className="cursor-pointer hover:shadow-md shadow-black"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-red-900" />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div id="setting">
          <SwitchCustom setDarkMode={setDarkMode} darkMode={darkMode} />
        </div>
      </div>

      <div
        id="fff"
        className="w-full h-full flex "
        style={{ marginLeft: "200px" }}
      >
        {/* <div className="flex w-[200px] absolute m-5 z-10 gap-3">
          <div
            onClick={() => {
              setScale(scale - 0.1);
            }}
            className={`bg-gray-300  opacity-10 hover:opacity-100 cursor-pointer w-[25px] h-[25px]  p-4  flex justify-center items-center text-center text-xl text-black  rounded-full`}
          >
            -
          </div>
          <div
            onClick={() => {
              setScale(scale + 0.1);
            }}
            className={`bg-gray-300  opacity-10 hover:opacity-100 cursor-pointer w-[25px] h-[25px]  p-4  flex justify-center items-center text-center text-xl text-black  rounded-full`}
          >
            +
          </div>
        </div> */}
        <div
          onClick={(e) => {
            con.setIsActiveG("un");
          }}
          id="Monitor"
          className={`${
            checkvideo == 1 ? " block " : " hidden "
          } w-full overflow-hidden active:cursor-grabbing relative  h-full border-dashed  border-3 border-red-600  bg-slate-500  bg-opacity-30`}
        >
          {/* <div
                    id="b-sec-4"
                    className={`  absolute !z-10 w-full h-full  flex-col bg-transparent pointer-events-none `}
                  ></div> */}
         

         

          <div
            id="infiniteDiv"
            style={{ scale: `${scale}` }}
            className={`xxx w-full h-full relative`}
          >
            <div id="content" className="absolute w-full h-full top-0 left-0">
              <div
                className="ff z-50 relative "
                id="containerKonva"
                onMouseDown={(e) => {
                  con.setFlagDragging(false);
                }}
              >
                {content.map((contentName, index) => (
                  <Contents
                    key={contentName}
                    videoName={contentName}
                    index={index}
                    IAG={con.isActiveG}
                  />
                ))}
              </div>
              {/* {videoWalls.map((videoName, index) => (
                <span ref={centerBox} key={index}>
                  <Block
                    key={index}
                    videoName={videoName.name}
                    index={index}
                    IAG={con.isActiveG}
                    customH={videoName.height}
                    customW={videoName.width}
                    customX={videoName.x}
                    customY={videoName.y}
                  />
                </span>
              ))} */}
            </div>
          </div>
        </div>
        <div
          className={`${
            checkvideo == 4 ? " block " : " hidden "
          } h-full w-full`}
        >
          <Box4 />
        </div>
        <div
          className={`${
            checkvideo == 8 ? " block " : " hidden "
          } h-full w-full`}
        >
          <Box8 />
        </div>
      </div>
    </main>
  );
}

export default App;
