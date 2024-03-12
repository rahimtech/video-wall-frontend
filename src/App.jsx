import { Rnd } from "react-rnd";
import React, { useEffect, useRef, useState } from "react";
import Block from "./components/Block";
import Box4 from "./components/Box4";
import Box8 from "./components/Box8";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
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
      name: null,
      width: 1440,
      width_mm: null,
      x: 0,
      y: 0,
    },
    {
      height: 1080,
      height_mm: null,
      is_primary: false,
      name: null,
      width: 1920,
      width_mm: null,
      x: -1920,
      y: 696,
    },
  ]);
  const [content, setContent] = useState([]);
  const [checkvideo, setCheckVideo] = useState(1);
  const [checkSection, setCheckSection] = useState(0);
  const [scale, setScale] = useState(1);
  const con = useMyContext();
  const transformComponentRef = useRef(null);

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

    const newImageX = (image.x() - x) / scaleX;
    const newImageY = -(image.y() + y) / scaleY; // Y باید منفی شود چون در Konva محور Y به سمت پایین است

    const newImageWidth = image.width() / scaleX;
    const newImageHeight = image.height() / scaleY;

    return {
      x: newImageX,
      y: newImageY,
      width: newImageWidth,
      height: newImageHeight,
    };
  }

  useEffect(() => {
    var width = window.innerWidth;
    var height = window.innerHeight;

    var stage = new Konva.Stage({
      container: "containerKonva",
      width: width,
      height: height,
      draggable: true,
    });

    var layer = new Konva.Layer();
    stage.add(layer);

    var WIDTH = 3000;
    var HEIGHT = 3000;
    var NUMBER = 2;

    function generateNode(x, y, width, height) {
      const group = new Konva.Group({
        clip: {
          x: x,
          y: -y,
          width: width,
          height: height,
        },
      });

      // ایجاد مستطیل داخل گروه
      const rect = new Konva.Rect({
        x: x,
        y: -y,
        width: width,
        height: height,
        radius: 50,
        fill: "transparent",
        stroke: "white",
      });

      // اضافه کردن مستطیل به گروه
      group.add(rect);

      return group;
    }

    for (var i = 0; i < NUMBER; i++) {
      layer.add(
        generateNode(
          videoWalls[i].x,
          videoWalls[i].y,
          videoWalls[i].width,
          videoWalls[i].height
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

    var video = document.createElement("video");
    video.src = "/controller/video.mp4";

    var image = new Konva.Image({
      image: video,
      draggable: true,
      x: 50,
      y: 20,
    });
    layer.add(image);

    video.addEventListener("loadedmetadata", function (e) {
      image.width(video.videoWidth);
      image.height(video.videoHeight);

      const positionRelativeToVideoWall =
        updateImagePositionRelativeToVideoWall(image, videoWalls[0]);

      image.position(positionRelativeToVideoWall);
      console.log(
        "positionRelativeToVideoWall::: ",
        positionRelativeToVideoWall
      );
      layer.draw();

      image.on("dragmove", function () {
        const updatedPosition = updateImagePositionRelativeToVideoWall(
          image,
          videoWalls[0]
        );

        console.log("updatedPosition::: ", updatedPosition);
        // می‌توانید از مقادیر جدید به دلخواه خود برای بروزرسانی استفاده کنید
      });
    });

    document.getElementById("play").addEventListener("click", function () {
      video.play();
    });
    document.getElementById("pause").addEventListener("click", function () {
      video.pause();
    });
  }, []);

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
        <div
          id="Template-setting"
          className="text-center w-full flex flex-col items-center justify-start  bg-gray-400 rounded-lg p-1"
        >
          <h1>مدیریت محتوا</h1>
          <ModalCustom />
          {/* <Button
            onClick={addVideoWall}
            className={`${
              checkvideo == 4 || checkvideo == 8
                ? "bg-slate-500"
                : "bg-slate-600  cursor-pointer"
            } w-[120px] px-3 py-2 rounded-xl text-white m-1`}
            disabled={checkvideo == 4 || checkvideo == 8 ? true : false}
          >
            افزودن مانتیور
          </Button> */}
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
        </div>
        <div
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
        </div>
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
      <button id="play">Play</button>
      <button id="pause">Pause</button>
      <input type="file" placeholder="افزودن تصویر یا فیلم" id="fileInput" />
      <div id="fff" className="w-full h-full flex ">
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
            console.log(con.isActiveG);
          }}
          id="Monitor"
          className={`${
            checkvideo == 1 ? " block " : " hidden "
          } w-full overflow-scroll relative  h-full border-dashed  border-3 border-red-600  bg-slate-500  bg-opacity-30`}
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
            id="containerKonva"
            style={{ scale: `${scale}` }}
            className={`xxx w-full h-full`}
          >
            {videoWalls.map((videoName, index) => (
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
            ))}
          </div>
          <div className="ff">
            {content.map((contentName, index) => (
              <Contents
                key={contentName}
                videoName={contentName}
                index={index}
                IAG={con.isActiveG}
              />
            ))}
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
