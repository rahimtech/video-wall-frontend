import { Rnd } from "react-rnd";
import { useEffect, useRef, useState } from "react";
import { Button } from "@nextui-org/react";
import Moveable from "react-moveable";
import { useMyContext } from "../../context/MyContext";
// import VidVid from "../../public/1.mp4";
// import Video from "../";
export default function Contents({ videoName, index, IAG }) {
  const [checkVideo, setCheckVideo] = useState(false);
  const con = useMyContext();
  const targetRef = useRef(null);
  const moveable = useRef(null);

  useEffect(() => {
    con.setIsActiveG(IAG);
  }, [IAG]);

  return (
    <div className="mt-10">
      <Moveable
        target={con.isActiveG == videoName ? targetRef : null}
        ref={con.isActiveG == videoName ? moveable : null}
        resizable={true}
        keepRatio={false}
        throttleResize={1}
        renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
        onResize={(e) => {
          e.target.style.width = `${e.width}px`;
          e.target.style.height = `${e.height}px`;
          e.target.style.transform = e.drag.transform;
        }}
        rotatable={true}
        throttleRotate={0}
        rotationPosition={"top"}
        onRotate={(e) => {
          e.target.style.transform = e.drag.transform;
        }}
        draggable={true}
        throttleDrag={1}
        edgeDraggable={false}
        startDragRotate={0}
        throttleDragRotate={0}
        onDrag={(e) => {
          e.target.style.transform = e.transform;
          con.setCF(e.target.getClientRects());
        }}
        scalable={true}
        throttleScale={0}
        onScale={(e) => {
          e.target.style.transform = e.drag.transform;
        }}
        snappable={true}
        snapDirections={{ top: true, left: true, bottom: true, right: true }}
        // snapThreshold={snapThreshold}
        verticalGuidelines={[
          50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900,
          950, 1000, 1050, 1100, 1150, 1200, 1250, 1300, 1350, 1400,
        ]}
        horizontalGuidelines={[
          50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900,
          950, 1000, 1050, 1100, 1150, 1200, 1250, 1300, 1350, 1400,
        ]}
      />

      <div
        className={`overflow-hidden w-[200px] h-[150px] absolute m-2 bg-transparent text-gray-400 !flex text-5xl justify-center items-center`}
        id="All"
        onClick={(e) => {
          e.stopPropagation();

          con.setIsActiveG(videoName);
          con.setVidN(videoName);
        }}
        ref={!checkVideo ? targetRef : null}
        style={{
          maxWidth: "auto",
          maxHeight: "auto",
          minWidth: "auto",
          minHeight: "auto",
          transform: "translate(0px, 0px) rotate(0deg)",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            con.setIsActiveG("un");
          }}
          className={`${
            con.isActiveG == videoName ? "flex" : "hidden"
          }  absolute z-10 top-[0] right-0 text-lg text-white rounded-full w-[20px] h-[20px] flex justify-center items-center m-1`}
        >
          ✕
        </button>

        <video
          className="max-w-none w-full h-full"
          src="./1.mp4"
          id="samp"
          controls={false}
          ref={checkVideo ? targetRef : null}
          style={{
            maxWidth: "auto",
            maxHeight: "auto",
            minWidth: "auto",
            minHeight: "auto",
            transform: "translate(0px, 0px) rotate(0deg)",
          }}
        ></video>
      </div>
    </div>
  );
}
