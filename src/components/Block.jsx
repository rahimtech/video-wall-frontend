import { Rnd } from "react-rnd";
import { useEffect, useRef, useState } from "react";
import { Button } from "@nextui-org/react";
import Moveable from "react-moveable";
import { useMyContext } from "../context/MyContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrop } from "@fortawesome/free-solid-svg-icons";

// import VidVid from "../../public/1.mp4";
// import Video from "../";
export default function Block({
  videoName,
  index,
  IAG,
  customH,
  customW,
  customX,
  customY,
}) {
  const [checkVideo, setCheckVideo] = useState(false);
  const [isActiveCrop, setIsActiveCrop] = useState(true);
  const con = useMyContext();
  const targetRef = useRef(null);
  const moveable = useRef(null);

  useEffect(() => {
    con.setIsActiveG(IAG);
    if (
      targetRef.current.getBoundingClientRect().x < 100 &&
      targetRef.current.getBoundingClientRect().x > 0
    ) {
      con.setCB(targetRef.current.getBoundingClientRect());
    }
  }, [IAG]);

  return (
    <div className="mt-10 relative z-10 ">
      <canvas
        className={`overflow-hidden w-[200px] h-[150px] ${
          isActiveCrop ? " pointer-events-auto " : " pointer-events-none "
        }  shadow-gray-500 shadow-inner absolute m-2 bg-transparent border-3 border-slate-800 text-gray-400 !flex text-5xl justify-center items-center`}
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
          minWidth: customW,
          minHeight: customH,
          transform: "translate(0px, 0px) rotate(0deg)",
          left: customX,
          top: -customY,
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
        <Button
          isIconOnly
          color="primary"
          variant="faded"
          aria-label="Take a photo"
          onClick={() => setCheckVideo(true)}
          className={`${checkVideo ? " hidden " : " !flex "} w-[100px]`}
        >
          افزودن محتوا
        </Button>
        <Button
          isIconOnly
          color="primary"
          variant="faded"
          aria-label="Take a photo"
          onClick={() => setCheckVideo(false)}
          className={`${
            !checkVideo ? " hidden " : " !flex "
          } z-20 absolute w-[70px] h-[30px] top-2 left-3 opacity-15`}
        >
          حذف محتوا
        </Button>

        <div className={` ${checkVideo ? " block " : " hidden "} `}>
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
      </canvas>
    </div>
  );
}
