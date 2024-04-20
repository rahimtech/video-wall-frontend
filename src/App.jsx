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
// import { exec } from "child_process";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const Controls = ({ zoomIn, zoomOut, resetTransform }) => (
  <>
    <button onClick={() => zoomIn()}>Zoom In</button>
    <button onClick={() => zoomOut()}>Zoom Out</button>
    <button onClick={() => resetTransform()}>Reset</button>
  </>
);

function App() {
  const [videoWalls, setVideoWalls] = useState([
    {
      height: 900,
      height_mm: null,
      is_primary: true,
      name: 1,
      width: 1440,
      width_mm: null,
      x: 0,
      y: 0,
    },
    {
      height: 1080,
      height_mm: null,
      is_primary: false,
      name: 2,
      width: 1920,
      width_mm: null,
      x: -1920,
      y: 696,
    },
  ]);
  const [content, setContent] = useState([]);
  const [content2, setContent2] = useState([]);
  const [checkvideo, setCheckVideo] = useState(1);
  const [checkSection, setCheckSection] = useState(0);
  const [scale, setScale] = useState(1);
  const [data, setData] = useState([{ monitor: 0, position: 0 }]);
  const [relativePosition, setRelativePosition] = useState({ x: 0, y: 0 });
  const con = useMyContext();
  const transformComponentRef = useRef(null);
  let contentRef = useRef(null);
  let centerBox = useRef(null);
  let arrayCollisions = [];
  let setData2 = [];
  let updatedPosition = 0;
  let counterImages = 0;
  let counterVideos = 0;
  const zoomToImage = () => {
    if (transformComponentRef.current) {
      const { zoomToElement } = transformComponentRef.current.instance;
      zoomToElement("imgExample");
    }
  };
  const addVideoWall = () => {};

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
    console.log("s");
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
    var width = window.innerWidth;
    var height = window.innerHeight;
    var GUIDELINE_OFFSET = 5;

    var stage = new Konva.Stage({
      container: "containerKonva",
      width: width,
      height: height,
      draggable: true,
    });

    var layer = new Konva.Layer();
    stage.add(layer);

    var WIDTH = 1000;
    var HEIGHT = 1000;
    var NUMBER = 2;
    let group = null;
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
        fill: "transparent",
        stroke: "white",
        name: "fillShape",
        id: name,
      });

      group.add(rect);

      return group;
    }

    for (var i = 0; i < NUMBER; i++) {
      layer.add(
        generateNode(
          videoWalls[i].x,
          videoWalls[i].y,
          videoWalls[i].width,
          videoWalls[i].height,
          videoWalls[i].name
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

    // let video = document.createElement("video");
    // let image = null;
    // video.src = "/controller/video.mp4";

    // image = new Konva.Image({
    //   image: video,
    //   draggable: true,
    //   x: 50,
    //   y: 20,
    //   name: "object",
    //   id: "video" + counterVideos++,
    //   width: 640,
    //   height: 480,
    // });

    console.log("layer::: ", layer);
    console.log("group::: ", group);

    // image.setZIndex(0);

    var anim = new Konva.Animation(function () {
      // do nothing, animation just need to update the layer
    }, layer);

    document.getElementById("play").addEventListener("click", function () {
      video.play();
      // video2.play();
      anim.start();
    });
    document.getElementById("pause").addEventListener("click", function () {
      video.pause();
      anim.stop();
    });

    function handleImage(dataURL) {
      var img = document.createElement("img");
      img.src = "/public/logo192.png";
      // مدیریت تصویر
      var image = new Konva.Image({
        image: img,
        draggable: true,
        x: 50,
        y: 20,
        name: "object",
        id: "image" + counterImages++,
      });

      layer.add(image);
    }

    let video = document.createElement("video");
    video.src = "/controller/video.mp4";
    let image = new Konva.Image({
      image: video,
      draggable: true,
      x: 50,
      y: 20,
      name: "object",
      id: "video" + counterVideos++,
    });
    layer.add(image);
    image.width(video.videoWidth);
    image.height(video.videoHeight);
    layer.draw();
    function handleVideo(arrayBuffer) {
      // مدیریت ویدیو
      image = new Konva.Image({
        image: video,
        draggable: true,
        x: 50,
        y: 20,
        name: "object",
        id: "video" + counterVideos++,
      });

      layer.add(image);
      console.log(layer);
      image.width(video.videoWidth);
      image.height(video.videoHeight);
      layer.draw();
      const positionRelativeToVideoWall =
        updateImagePositionRelativeToVideoWall(image, videoWalls[0]);

      image.position(positionRelativeToVideoWall);
    }

    var inputElement = document.getElementById("fileInput");

    inputElement.addEventListener("change", function (e) {
      const file = e.target.files[0];
      console.log("file::: ", file);

      if (file) {
        const fileType = file.type.split("/")[0]; // "image" یا "video"

        if (fileType === "image") {
          // اگر نوع فایل تصویر باشد
          const imageURL = URL.createObjectURL(file);
          console.log("imageURL::: ", imageURL);
          handleImage(imageURL);
        } else if (fileType === "video") {
          // اگر نوع فایل ویدیو باشد
          const videoURL = URL.createObjectURL(file);
          handleVideo(videoURL);
        } else {
          console.error("Unsupported file type.");
        }
      }
    });

    image.on("click", (e) => {
      const tr = new Konva.Transformer({
        nodes: [image],
        boundBoxFunc: (oldBox, newBox) => {
          const box = getClientRect(newBox);
          // image.width(box.width);
          // image.height(box.height);
          const isOut =
            box.x < 0 ||
            box.y < 0 ||
            box.x + box.width > stage.width() ||
            box.y + box.height > stage.height();

          if (isOut) {
            return oldBox;
          }
          return newBox;
        },
      });

      tr.on("dragmove", () => {
        const boxes = tr.nodes().map((node) => node.getClientRect());
        const box = getTotalBox(boxes);
        tr.nodes().forEach((shape) => {
          const absPos = shape.getAbsolutePosition();
          // where are shapes inside bounding box of all shapes?
          const offsetX = box.x - absPos.x;
          const offsetY = box.y - absPos.y;

          // we total box goes outside of viewport, we need to move absolute position of shape
          const newAbsPos = { ...absPos };
          if (box.x < 0) {
            newAbsPos.x = -offsetX;
          }
          if (box.y < 0) {
            newAbsPos.y = -offsetY;
          }
          if (box.x + box.width > stage.width()) {
            newAbsPos.x = stage.width() - box.width - offsetX;
          }
          if (box.y + box.height > stage.height()) {
            newAbsPos.y = stage.height() - box.height - offsetY;
          }
          shape.setAbsolutePosition(newAbsPos);
        });
      });
      layer.add(tr);
    });
    stage.on("click", (e) => {
      if (e.target !== image) {
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

      setData2 = [
        {
          monitor: arrayCollisions,
          x: updatedPosition.x,
          y: updatedPosition.y,
          width: updatedPosition.width,
          height: updatedPosition.height,
          name: e.target.getNodes
            ? e.target.getNodes()[0].getAttr("id")
            : e.target.getAttr("id"),
        },
      ];
      console.log(...setData2);
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
    <main className="p-6 bg-gray-800 h-screen w-full flex  items-center gap-5">
      <div
        id="Options"
        className=" absolute h-[770px] z-50 translate-x-[-220px] hover:translate-x-[-30px] transition-all overflow-auto p-3 w-[200px] bg-slate-500 bg-opacity-100 rounded-md flex flex-col gap-5"
      >
        {/* <div
          id="Template-setting"
          className="text-center p-2 flex flex-col items-center justify-start w-full bg-gray-400 rounded-lg"
        >
          <h1>تنظیمات قالب</h1>

          <select
            className="text-white  bg-slate-600  px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-900  rtl"
            value={checkvideo}
            onChange={(e) => {
              handleCheckVideo(parseInt(e.target.value));
            }}
          >
            <option value={1}>قالب آزاد</option>
            <option value={4}>قالب ۴ تایی</option>
            <option value={8}>قالب ۸ تایی</option>
          </select>

          <label>قسمت بندی</label>
          <select
            className="text-white  bg-slate-600 w-[120px] rtl  px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-900 "
            value={checkSection}
            onChange={(e) => {
              handleCheckSection(parseInt(e.target.value));
            }}
          >
            <option value={0}> فاقد قسمت</option>
            <option value={4}> ۴ قسمتی</option>
            <option value={8}> ۸ قسمتی</option>
            <option value={12}> ۱۲ قسمتی</option>
          </select>
        </div> */}
        <div
          id="Pictures-setting"
          className="text-center bg-gray-400 rounded-lg px-1 flex flex-col items-center justify-start w-full"
        >
          <h1 className="">مدیریت مانیتورها </h1>
          <ul className="w-full px-1 flex flex-col gap-2  p-1 rounded-md h-[180px] overflow-y-auto">
            {videoWalls.map((videoName, index) => (
              <li
                key={videoName.name}
                className="flex justify-between px-1 bg-slate-500 rounded-lg  w-full"
              >
                <span>{videoName.name}</span>
                <span
                  onClick={() => deletVideoWall(videoName)}
                  className="cursor-pointer hover:shadow-md shadow-black"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-red-900" />
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div
          id="Pictures-setting"
          className="text-center bg-gray-400 rounded-lg px-1 flex flex-col items-center justify-start w-full"
        >
          <h1 className="">مدیریت محتوا </h1>
          <div>
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
          <button id="play">Play</button>
          <button id="pause">Pause</button>
          <input type="checkbox" id="checkbox" />
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
        <div className="w-full">
          <Button className="w-full" onClick={lunching}>
            اعمال
          </Button>
        </div>
        {/* <div id="Guid" className="w-[700px] text-right">
          <p>ابتدا روی مانیتور کلیک کرده سپس درگ کنید</p>
          <p>علامت ✕ نمایانگر برداشتن حالت گزینه تغییرات تصویر است</p>

          <p>با کلیک روی گزینه اعمال چیدمان‌ها در مانیتور قابل مشاهده میشوند</p>
        </div> */}
      </div>

      <div id="fff" className="w-full h-full flex ">
        <div className="flex w-[200px] absolute m-5 z-10 gap-3">
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
        </div>
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
            id="b-sec-4"
            className={`${
              checkSection === 4 ? "flex" : "hidden"
            }  absolute !z-10 w-full h-full border-dashed  border-4 border-red-800 flex-col bg-transparent pointer-events-none `}
          >
            <div className=" w-full h-1/2 flex ">
              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>
            </div>
            <div className=" w-full h-1/2 flex">
              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>
            </div>
          </div>

          <div
            id="b-sec-8"
            className={`${
              checkSection === 8 ? "flex" : "hidden"
            } absolute !z-10 w-full h-full  flex-col bg-transparent pointer-events-none `}
          >
            <div className=" w-full h-1/2 flex ">
              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>

              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>
            </div>
            <div className=" w-full h-1/2 flex ">
              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>

              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>
            </div>
          </div>

          <div
            id="b-sec-12"
            className={`${
              checkSection === 12 ? "flex" : "hidden"
            }  absolute !z-10 w-full h-full flex-col bg-transparent pointer-events-none `}
          >
            <div className=" w-full h-1/2 flex ">
              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>
            </div>
            <div className=" w-full h-1/2 flex ">
              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>
              <div className="w-full h-full border-2 border-gray-600"></div>
            </div>
          </div>

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
