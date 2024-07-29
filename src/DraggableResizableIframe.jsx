import React, { useEffect, useRef } from "react";
import { Stage, Layer, Rect } from "react-konva";

function DraggableResizableIframe() {
  const stageRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (stageRef.current && iframeRef.current) {
      const stage = stageRef.current.getStage();
      console.log("stage::: ", stage);
      const position = stage.getPointerPosition();
      console.log("position::: ", position);
      iframeRef.current.style.position = "absolute";
      //   iframeRef.current.style.top = `${position.y}px`;
      //   iframeRef.current.style.left = `${position.x}px`;
    }
  }, []);

  return (
    <div>
      <Stage width={window.innerWidth} height={window.innerHeight} ref={stageRef}>
        <Layer>
          <Rect
            x={100}
            y={100}
            width={800}
            height={400}
            fill="transparent"
            stroke="white"
            strokeWidth={3}
          />
        </Layer>
      </Stage>
      <iframe
        ref={iframeRef}
        src="https://www.easeup.ir"
        width="800"
        height="400"
        style={{
          position: "absolute",
          top: "100px", // same as Rect y position
          left: "100px", // same as Rect x position
          border: "none",
        }}
      ></iframe>
    </div>
  );
}

export default DraggableResizableIframe;
