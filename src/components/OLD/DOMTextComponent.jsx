import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

const DOMTextComponent = ({ text, x, y }) => {
  const containerRef = useRef();

  useEffect(() => {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.pointerEvents = "none"; // برای جلوگیری از تداخل با تعاملات کنواس
    container.style.transform = `translate(${x}px, ${y}px)`;
    container.style.color = "black";
    container.style.fontSize = "16px";
    container.style.fontWeight = "bold";
    containerRef.current = container;
    document.body.appendChild(container);

    return () => {
      document.body.removeChild(containerRef.current);
    };
  }, [x, y]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
  }, [x, y]);

  return containerRef.current
    ? ReactDOM.createPortal(<div>{text}</div>, containerRef.current)
    : null;
};

export default DOMTextComponent;
