import React, { useRef, useEffect } from "react";
import { Stage, Layer } from "react-konva";
import Konva from "konva";
import { useMyContext } from "../../context/MyContext";

const KonvaStage = React.forwardRef(({ videos }, refs) => {
  const { stageRef, layerRef } = refs;
  const con = useMyContext();

  useEffect(() => {
    if (stageRef && layerRef) {
      stageRef.current = new Konva.Stage({
        container: "containerKonva",
        width: window.innerWidth,
        height: window.innerHeight,
        draggable: true,
      });

      layerRef.current = new Konva.Layer();
      stageRef.current.add(layerRef.current);
      stageRef.current.scale({ x: 0.17, y: 0.17 });
      stageRef.current.position({ x: 500, y: 400 });

      var anim = new Konva.Animation(() => {}, layerRef.current);
      anim.start();
    }

    return () => {
      if (stageRef.current) stageRef.current.destroy();
      if (layerRef.current) layerRef.current.destroy();
    };
  }, [stageRef, layerRef]);

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.find(".object").forEach((obj) => obj.destroy());
      videos.forEach((video) => {
        if (video.type === "video") {
          const image = new Konva.Image({
            image: video.videoElement,
            width: video.videoElement.videoWidth,
            height: video.videoElement.videoHeight,
            name: "object",
            fill: "gray",
            id: video.name,
            draggable: true,
          });

          layerRef.current.add(image);
        }
      });
      layerRef.current.draw();
    }
  }, [videos, layerRef]);

  return <div id="containerKonva" style={{ width: "100%", height: "100%" }}></div>;
});

export default KonvaStage;
