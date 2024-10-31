import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Transformer } from "react-konva";

const IFrameComponent = ({ url, x, y, width, height, onTransform }) => {
  const iframeRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.pointerEvents = "none"; // Konva اجزای DOM را مدیریت می‌کند
    containerRef.current = container;
    document.body.appendChild(container);

    return () => {
      document.body.removeChild(containerRef.current);
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.transform = `translate(${x}px, ${y}px)`;
      containerRef.current.style.width = `${width}px`;
      containerRef.current.style.height = `${height}px`;
    }
  }, [x, y, width, height]);

  return containerRef.current
    ? ReactDOM.createPortal(
        <iframe
          ref={iframeRef}
          src={url}
          style={{
            width: "100%",
            height: "100%",
            border: "1px solid black",
          }}
        />,
        containerRef.current
      )
    : null;
};

export default IFrameComponent;
