import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Text, Transformer } from "react-konva";
import { Html } from "react-konva-utils";

const App3 = () => {
  const [content, setContent] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const transformerRef = useRef(null);

  // Handle Zooming
  useEffect(() => {
    const stage = stageRef.current;
    const scaleBy = 1.05;
    stage.on("wheel", (e) => {
      e.evt.preventDefault();
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      stage.scale({ x: newScale, y: newScale });
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      stage.position(newPos);
      stage.batchDraw();
    });
  }, []);

  // Attach Transformer to selected object
  useEffect(() => {
    if (transformerRef.current && selectedId) {
      const selectedNode = layerRef.current.findOne(`#${selectedId}`);
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId]);

  // Handle click and selection
  const handleStageMouseDown = (e) => {
    if (e.target === stageRef.current) {
      setSelectedId(null);
      return;
    }
    const clickedId = e.target.id();
    setSelectedId(clickedId);
  };

  const addText = () => {
    setContent([
      ...content,
      { type: "text", id: Date.now().toString(), text: "Sample Text", x: 50, y: 50 },
    ]);
  };

  const addImage = () => {
    const imageUrl = "https://via.placeholder.com/150"; // Replace with your image URL
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      setContent([
        ...content,
        { type: "image", id: Date.now().toString(), image: img, x: 100, y: 100 },
      ]);
    };
  };

  const addVideo = () => {
    const videoUrl = "https://www.w3schools.com/html/mov_bbb.mp4"; // Replace with your video URL
    setContent([
      ...content,
      {
        type: "video",
        id: Date.now().toString(),
        src: videoUrl,
        x: 200,
        y: 200,
        width: 300,
        height: 200,
      },
    ]);
  };

  const addWebpage = () => {
    setContent([
      ...content,
      {
        type: "webpage",
        id: Date.now().toString(),
        url: "https://www.digikala.com",
        x: 300,
        y: 300,
        width: 400,
        height: 300,
      },
    ]);
  };

  const updateContentPosition = (id, newX, newY, newWidth, newHeight) => {
    setContent(
      content.map((item) =>
        item.id === id ? { ...item, x: newX, y: newY, width: newWidth, height: newHeight } : item
      )
    );
  };

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <button onClick={addText}>Add Text</button>
        <button onClick={addImage}>Add Image</button>
        <button onClick={addVideo}>Add Video</button>
        <button onClick={addWebpage}>Add Webpage</button>
      </div>

      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}
        onMouseDown={handleStageMouseDown}
        draggable
      >
        <Layer ref={layerRef}>
          {content.map((item) => {
            switch (item.type) {
              case "text":
                return (
                  <Text
                    key={item.id}
                    id={item.id}
                    text={item.text}
                    x={item.x}
                    y={item.y}
                    draggable
                    fontSize={24}
                    fill="black"
                    onClick={() => setSelectedId(item.id)}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      node.scaleX(1);
                      node.scaleY(1);
                      updateContentPosition(
                        item.id,
                        node.x(),
                        node.y(),
                        node.width() * scaleX,
                        node.height() * scaleY
                      );
                    }}
                  />
                );
              case "image":
                return (
                  <Rect
                    key={item.id}
                    id={item.id}
                    x={item.x}
                    y={item.y}
                    width={150}
                    height={150}
                    fillPatternImage={item.image}
                    draggable
                    onClick={() => setSelectedId(item.id)}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      node.scaleX(1);
                      node.scaleY(1);
                      updateContentPosition(
                        item.id,
                        node.x(),
                        node.y(),
                        node.width() * scaleX,
                        node.height() * scaleY
                      );
                    }}
                  />
                );
              case "video":
                return (
                  <React.Fragment key={item.id}>
                    <Rect
                      id={item.id}
                      x={item.x}
                      y={item.y}
                      width={item.width}
                      height={item.height}
                      draggable
                      fill="transparent"
                      stroke="gray"
                      onClick={() => setSelectedId(item.id)}
                      onTransformEnd={(e) => {
                        const node = e.target;
                        const scaleX = node.scaleX();
                        const scaleY = node.scaleY();
                        node.scaleX(1);
                        node.scaleY(1);
                        updateContentPosition(
                          item.id,
                          node.x(),
                          node.y(),
                          node.width() * scaleX,
                          node.height() * scaleY
                        );
                      }}
                    />
                    <Html
                      divProps={{
                        style: {
                          position: "absolute",
                          top: `${item.y}px`,
                          left: `${item.x}px`,
                          width: `${item.width}px`,
                          height: `${item.height}px`,
                          pointerEvents: "none",
                        },
                      }}
                    >
                      <video src={item.src} width={item.width} height={item.height} controls />
                    </Html>
                  </React.Fragment>
                );
              case "webpage":
                return (
                  <React.Fragment key={item.id}>
                    <Rect
                      id={item.id}
                      x={item.x}
                      y={item.y}
                      width={item.width}
                      height={item.height}
                      draggable
                      fill="transparent"
                      stroke="gray"
                      onClick={() => setSelectedId(item.id)}
                      onTransformEnd={(e) => {
                        const node = e.target;
                        const scaleX = node.scaleX();
                        const scaleY = node.scaleY();
                        node.scaleX(1);
                        node.scaleY(1);
                        updateContentPosition(
                          item.id,
                          node.x(),
                          node.y(),
                          node.width() * scaleX,
                          node.height() * scaleY
                        );
                      }}
                    />
                    <Html
                      divProps={{
                        style: {
                          position: "absolute",
                          top: `${item.y}px`,
                          left: `${item.x}px`,
                          width: `${item.width}px`,
                          height: `${item.height}px`,
                          pointerEvents: "none",
                        },
                      }}
                    >
                      <iframe
                        src={item.url}
                        width={item.width}
                        height={item.height}
                        style={{ border: "none" }}
                      />
                    </Html>
                  </React.Fragment>
                );
              default:
                return null;
            }
          })}

          {/* Transformer for adding anchors */}
          <Transformer ref={transformerRef} />
        </Layer>
      </Stage>
    </div>
  );
};

export default App3;
