// src/components/konva/Canvas.jsx
import React, { useEffect, useMemo, useRef, useState, startTransition } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Select,
  SelectItem,
  Switch,
  Checkbox,
} from "@nextui-org/react";
import {
  TbFocusCentered,
  TbMaximize,
  TbZoomReset,
  TbZoomIn,
  TbZoomOut,
  TbGridDots,
  TbTrash,
} from "react-icons/tb";
import Konva from "konva";
import { useMyContext } from "./context/MyContext";

// ===================== Helpers =====================
function getStageAndLayer(getSelectedScene) {
  const scn = getSelectedScene?.();
  return scn?.stageData && scn?.layer ? { stage: scn.stageData, layer: scn.layer } : {};
}

function getBounds(monitors = []) {
  if (!monitors?.length) return null;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  monitors.forEach((m) => {
    if (!m) return;
    const x2 = m.x + m.width;
    const y2 = m.y + m.height;
    if (m.x < minX) minX = m.x;
    if (m.y < minY) minY = m.y;
    if (x2 > maxX) maxX = x2;
    if (y2 > maxY) maxY = y2;
  });
  if (!Number.isFinite(minX)) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function fitStageToMonitorsSmart(stage, monitors) {
  if (!stage || !monitors?.length) return;
  const b = getBounds(monitors);
  if (!b) return;
  const contentW = Math.max(1, b.width);
  const contentH = Math.max(1, b.height);
  const viewW = stage.width();
  const viewH = stage.height();

  const n = monitors.length;
  const padding = Math.min(
    Math.max(Math.round(Math.min(viewW, viewH) * 0.06) + Math.ceil(Math.sqrt(n)) * 4, 24),
    160
  );
  const sX = (viewW - padding * 2) / contentW;
  const sY = (viewH - padding * 2) / contentH;
  const scale = Math.min(sX, sY, 1);

  stage.scale({ x: scale, y: scale });
  stage.position({ x: -b.x * scale + padding, y: -b.y * scale + padding });
  stage.batchDraw();
}

function centerStageOnMonitors(stage, monitors) {
  if (!stage || !monitors?.length) return;
  const b = getBounds(monitors);
  if (!b) return;
  const viewW = stage.width();
  const viewH = stage.height();
  const scale = stage.scaleX() || 1;
  const contentCenter = { x: (b.x + b.width / 2) * scale, y: (b.y + b.height / 2) * scale };
  const viewCenter = { x: viewW / 2, y: viewH / 2 };
  stage.position({ x: viewCenter.x - contentCenter.x, y: viewCenter.y - contentCenter.y });
  stage.batchDraw();
}

function zoomAt(stage, factor, point = null) {
  if (!stage) return;
  const oldScale = stage.scaleX() || 1;
  const newScale = oldScale * factor;
  const viewW = stage.width();
  const viewH = stage.height();
  const centerPoint = point || { x: viewW / 2, y: viewH / 2 };

  const mousePointTo = {
    x: (centerPoint.x - stage.x()) / oldScale,
    y: (centerPoint.y - stage.y()) / oldScale,
  };

  stage.scale({ x: newScale, y: newScale });
  const newPos = {
    x: centerPoint.x - mousePointTo.x * newScale,
    y: centerPoint.y - mousePointTo.y * newScale,
  };
  stage.position(newPos);
  stage.batchDraw();
}

// -------- Per-monitor virtual grid --------
function drawVirtualGridOnMonitor(layer, monitorId, rows, cols, startIndex = 1) {
  const group = layer.findOne(`#monitor-group-${monitorId}`);
  if (!group) return;
  const rect = group.findOne("Rect");
  if (!rect) return;

  const old = group.findOne(".virtual-grid");
  if (old) old.destroy();

  const gridGroup = new Konva.Group({ name: "virtual-grid", listening: false });

  const w = rect.width();
  const h = rect.height();

  for (let c = 1; c < cols; c++) {
    const x = (w / cols) * c;
    gridGroup.add(
      new Konva.Line({
        points: [x, 0, x, h],
        stroke: "rgba(255,255,255,0.35)",
        strokeWidth: 1,
        dash: [6, 6],
      })
    );
  }
  for (let r = 1; r < rows; r++) {
    const y = (h / rows) * r;
    gridGroup.add(
      new Konva.Line({
        points: [0, y, w, y],
        stroke: "rgba(255,255,255,0.35)",
        strokeWidth: 1,
        dash: [6, 6],
      })
    );
  }

  const cellW = w / cols;
  const cellH = h / rows;
  let idx = startIndex;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      gridGroup.add(
        new Konva.Text({
          x: c * cellW,
          y: r * cellH,
          width: cellW,
          height: cellH,
          align: "center",
          verticalAlign: "middle",
          text: String(idx++),
          fontSize: Math.max(12, Math.min(cellW, cellH) * 0.22),
          fontStyle: "bold",
          fill: "rgba(255,255,255,0.7)",
          listening: false,
        })
      );
    }
  }

  group.add(gridGroup);
  group.setAttr("gridMeta", { rows: Number(rows), cols: Number(cols) });
  group.setAttr("gridStartIndex", Number(startIndex));
  layer.batchDraw();
}

function getGridCells(layer, monitorId, { debug = false, clearPrev = true } = {}) {
  const group = layer.findOne(`#monitor-group-${monitorId}`);
  if (!group) return [];
  const gridMeta = group.getAttr("gridMeta");
  if (!gridMeta?.rows || !gridMeta?.cols) return [];

  const rect = group.findOne("Rect");
  if (!rect) return [];

  const rows = Number(gridMeta.rows);
  const cols = Number(gridMeta.cols);

  const absBox = rect.getClientRect({ relativeTo: layer }); // {x,y,width,height}

  const cellW = absBox.width / cols;
  const cellH = absBox.height / rows;

  if (clearPrev) {
    const old = layer.findOne(`#grid-debug-${monitorId}`);
    if (old) old.destroy();
  }
  const dbg = debug
    ? new Konva.Group({ id: `grid-debug-${monitorId}`, name: "grid-debug", listening: false })
    : null;

  const cells = [];
  const startIndex = Number(group.getAttr("gridStartIndex")) || 1;
  let idx = startIndex;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = absBox.x + c * cellW;
      const y = absBox.y + r * cellH;
      const cell = { index: idx++, row: r, col: c, rect: { x, y, width: cellW, height: cellH } };
      cells.push(cell);

      if (dbg) {
        dbg.add(
          new Konva.Rect({
            x,
            y,
            width: cellW,
            height: cellH,
            stroke: "rgba(255,0,0,0.8)",
            dash: [8, 6],
            strokeWidth: 1,
            fill: "rgba(255,0,0,0.08)",
          })
        );
        dbg.add(
          new Konva.Text({
            x,
            y: y + cellH / 2 - 10,
            width: cellW,
            height: 20,
            align: "center",
            text: String(cell.index),
            fontSize: Math.max(12, Math.min(cellW, cellH) * 0.22),
            fontStyle: "bold",
            fill: "rgba(255,0,0,0.9)",
          })
        );
      }
    }
  }

  if (dbg) {
    layer.add(dbg);
    layer.batchDraw();
  }
  return cells;
}

function placeResourceInCell({ type, resource, cellRect, ctx }) {
  const {
    addImage,
    addVideo,
    addWeb,
    addInput,
    getSelectedScene,
    setSources,
    sendOperation,
    url,
    loopVideos,
    generateBlobImageURL,
    contentGenerator,
  } = ctx;

  const scn = getSelectedScene();
  if (!scn) return;

  const base = { x: cellRect.x, y: cellRect.y, sceneId: scn.id };

  if (type === "IMAGE" && resource) {
    const imgObj = { ...resource, ...base };
    if (imgObj.imageElement) {
      imgObj.imageElement.width = cellRect.width;
      imgObj.imageElement.height = cellRect.height;
    }
    imgObj.width = cellRect.width;
    imgObj.height = cellRect.height;

    addImage({
      img: imgObj,
      getSelectedScene,
      setSources,
      sendOperation,
      url,
      generateBlobImageURL,
    });
  } else if (type === "VIDEO" && resource) {
    const vidObj = { ...resource, ...base, width: cellRect.width, height: cellRect.height };
    if (vidObj.videoElement) {
      vidObj.videoElement.width = cellRect.width;
      vidObj.videoElement.height = cellRect.height;
    }
    addVideo({
      videoElement: vidObj,
      getSelectedScene,
      setSources,
      sendOperation,
      url,
      loopVideos,
    });
  } else if (type === "IFRAME" && resource) {
    const webObj = { ...resource, ...base };
    if (webObj.iframeElement) {
      webObj.iframeElement.width = cellRect.width;
      webObj.iframeElement.height = cellRect.height;
      if (webObj.iframeElement.style) {
        webObj.iframeElement.style.width = `${cellRect.width}px`;
        webObj.iframeElement.style.height = `${cellRect.height}px`;
      }
    }
    webObj.width = cellRect.width;
    webObj.height = cellRect.height;

    addWeb({ webResource: webObj, getSelectedScene, setSources, sendOperation, url });
  } else if (type === "INPUT" && resource) {
    const inpObj = { ...resource, ...base };
    if (inpObj.imageElement) {
      inpObj.imageElement.width = cellRect.width;
      inpObj.imageElement.height = cellRect.height;
    }
    if (inpObj.inputElement) {
      if (inpObj.inputElement.style) {
        inpObj.inputElement.style.width = `${cellRect.width}px`;
        inpObj.inputElement.style.height = `${cellRect.height}px`;
      }
      inpObj.inputElement.width = cellRect.width;
      inpObj.inputElement.height = cellRect.height;
    }
    inpObj.width = cellRect.width;
    inpObj.height = cellRect.height;

    addInput({ input: inpObj, getSelectedScene, setSources, sendOperation });
  } else {
    console.warn("placeResourceInCell: unsupported type or empty resource", { type, resource });
  }
}

// -------- Collective / Global grid overlay --------
function drawGlobalGrid(layer, monitors, rows, cols, { showIndices = false } = {}) {
  if (!layer || !monitors?.length || rows < 1 || cols < 1) return [];

  const existing = layer.findOne("#global-virtual-grid");
  if (existing) existing.destroy();

  const b = getBounds(monitors);
  if (!b) return [];

  const g = new Konva.Group({
    id: "global-virtual-grid",
    name: "global-virtual-grid",
    listening: false,
  });

  const { x, y, width: w, height: h } = b;
  const cells = [];
  let idx = 1;
  const cellW = w / cols;
  const cellH = h / rows;

  for (let c = 1; c < cols; c++) {
    const X = x + cellW * c;
    g.add(
      new Konva.Line({
        points: [X, y, X, y + h],
        stroke: "rgba(0,200,255,0.9)",
        strokeWidth: 1,
        dash: [10, 6],
      })
    );
  }
  for (let r = 1; r < rows; r++) {
    const Y = y + cellH * r;
    g.add(
      new Konva.Line({
        points: [x, Y, x + w, Y],
        stroke: "rgba(0,200,255,0.9)",
        strokeWidth: 1,
        dash: [10, 6],
      })
    );
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = x + c * cellW;
      const cy = y + r * cellH;
      const cell = { index: idx++, rect: { x: cx, y: cy, width: cellW, height: cellH } };
      cells.push(cell);

      if (showIndices) {
        g.add(
          new Konva.Text({
            x: cx,
            y: cy,
            width: cellW,
            height: cellH,
            align: "center",
            verticalAlign: "middle",
            text: String(cell.index),
            fontSize: Math.max(12, Math.min(cellW, cellH) * 0.25),
            fontStyle: "bold",
            fill: "rgba(0,200,255,0.95)",
          })
        );
      }
    }
  }

  g.setAttr("globalGridMeta", { rows, cols, cells });
  layer.add(g);
  layer.batchDraw();
  return cells;
}

function clearGlobalGrid(layer) {
  if (!layer) return;
  const existing = layer.findOne("#global-virtual-grid");
  if (existing) existing.destroy();
  layer.batchDraw();
}

function getGlobalGridCells(layer, monitors, rows, cols) {
  const b = getBounds(monitors);
  if (!layer || !b || rows < 1 || cols < 1) return [];
  const cells = [];
  const cellW = b.width / cols;
  const cellH = b.height / rows;
  let idx = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = b.x + c * cellW;
      const y = b.y + r * cellH;
      cells.push({ index: idx++, row: r, col: c, rect: { x, y, width: cellW, height: cellH } });
    }
  }
  return cells;
}

function getSpanRectForGlobalSelection(selectedIndices = [], allCells = []) {
  const set = new Set(Array.from(selectedIndices).map(String));
  const picked = allCells.filter((c) => set.has(String(c.index)));
  if (!picked.length) return null;
  const minX = Math.min(...picked.map((c) => c.rect.x));
  const minY = Math.min(...picked.map((c) => c.rect.y));
  const maxX = Math.max(...picked.map((c) => c.rect.x + c.rect.width));
  const maxY = Math.max(...picked.map((c) => c.rect.y + c.rect.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// ===================== Component =====================
export default function Canvas({
  title = "بوم نمایش",
  subtitle = "Drag & Drop منابع روی صحنه",
  onFit,
}) {
  const {
    darkMode,
    scenes,
    selectedScene,
    handleDragOver,
    handleDrop,
    getSelectedScene,
    videoWalls,
    resources,
    inputs,
    addImage,
    addVideo,
    addWeb,
    addInput,
    setSources,
    sendOperation,
    url,
    loopVideos,
    generateBlobImageURL,
    isToggleLayout,
    isRealTime,
    setIsRealTime,
    contentGenerator,
  } = useMyContext();

  // ---------- State ----------
  const [activeTab, setActiveTab] = useState("global"); // grid | global | groups | place | placeGlobal

  // Per-monitor grid
  const [dragEnabled, setDragEnabled] = useState(true);
  const [zoomStep] = useState(1.1);
  const [gridRows, setGridRows] = useState(2);
  const [gridCols, setGridCols] = useState(2);
  const [gridMonitorId, setGridMonitorId] = useState(null);

  // Global (collective) grid
  const [globalRows, setGlobalRows] = useState(3);
  const [globalCols, setGlobalCols] = useState(5);
  const [showGlobalIndex, setShowGlobalIndex] = useState(false);
  const [globalCells, setGlobalCells] = useState([]);
  const [selectedGlobalCells, setSelectedGlobalCells] = useState(new Set());

  // Place resources
  const [selectedCellIndex, setSelectedCellIndex] = useState(null);
  const [selectedAssetKey, setSelectedAssetKey] = useState(null);

  // Groups
  const [monitorGroups, setMonitorGroups] = useState([]);
  const [selectedMonitors, setSelectedMonitors] = useState([]);
  const [groupCounter, setGroupCounter] = useState(1);
  const [groups, setGroups] = useState([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);

  const [isActiveGrid, setIsActiveGrid] = useState(false);
  const [cellOptions, setCellOptions] = useState([]);

  const cellCacheRef = useRef(new Map());

  const [calibMonitorId, setCalibMonitorId] = useState(null);

  // ---------- Effects ----------

  useEffect(() => {
    if (videoWalls?.length && !calibMonitorId) {
      setCalibMonitorId(videoWalls[0].id);
    }
  }, [videoWalls]);

  useEffect(() => {
    cellCacheRef.current.clear();
  }, [selectedScene]);

  useEffect(() => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer || !gridMonitorId) {
      setCellOptions([]);
      return;
    }
    let cells = cellCacheRef.current.get(gridMonitorId);
    if (!cells) {
      cells = getGridCells(layer, gridMonitorId);
      cellCacheRef.current.set(gridMonitorId, cells);
    }
    startTransition(() => {
      setCellOptions(
        cells.map((c) => ({
          key: String(c.index),
          value: String(c.index),
          label: `سلول ${c.index}`,
        }))
      );
    });
  }, [gridMonitorId]);

  useEffect(() => {
    const { stage } = getStageAndLayer(getSelectedScene);
    if (stage) setDragEnabled(stage.draggable());
  }, [selectedScene, scenes]);

  useEffect(() => {
    if (!gridMonitorId && videoWalls?.length) {
      setGridMonitorId(videoWalls[0].id);
    }
  }, [videoWalls]);

  // Build global cell options (even before drawing) to enable labels; selection remains disabled until applied.
  useEffect(() => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer) return;
    const cells = getGlobalGridCells(layer, videoWalls, parseInt(globalRows), parseInt(globalCols));
    setGlobalCells((prev) => (prev.length ? prev : cells)); // keep if already drawn
  }, [globalRows, globalCols, selectedScene, scenes, videoWalls]);

  useEffect(() => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer || !gridMonitorId) {
      setCellOptions([]);
      return;
    }
    const cells = getGridCells(layer, gridMonitorId);
    setCellOptions(
      cells.map((c) => ({ key: String(c.index), value: String(c.index), label: `سلول ${c.index}` }))
    );
  }, [gridMonitorId, gridRows, gridCols, selectedScene, scenes]);

  useEffect(() => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer) return;

    monitorGroups.forEach((g) => {
      let existing = layer.findOne(`#monitor-group-box-${g.id}`);
      if (existing) existing.destroy();

      const rect = new Konva.Rect({
        id: `monitor-group-box-${g.id}`,
        x: g.rect.x,
        y: g.rect.y,
        width: g.rect.width,
        height: g.rect.height,
        stroke: "red",
        dash: [10, 5],
        strokeWidth: 2,
        listening: false,
      });
      layer.add(rect);
    });

    layer.batchDraw();
  }, [monitorGroups, selectedScene, scenes]);

  // ---------- Actions ----------
  const doFit = () => {
    const { stage } = getStageAndLayer(getSelectedScene);
    if (!stage) return;
    fitStageToMonitorsSmart(stage, videoWalls);
  };

  const doFitMonitor = (monitorId) => {
    const { stage } = getStageAndLayer(getSelectedScene);
    if (!stage) return;
    const m = videoWalls.find((v) => Number(v.id) === Number(monitorId));
    if (!m) return;
    fitStageToMonitorsSmart(stage, [m]);
  };
  const doCenter = () => {
    const { stage } = getStageAndLayer(getSelectedScene);
    if (!stage) return;
    centerStageOnMonitors(stage, videoWalls);
  };

  const doReset = () => {
    const { stage } = getStageAndLayer(getSelectedScene);
    if (!stage) return;
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();
  };

  const doZoomIn = () => {
    const { stage } = getStageAndLayer(getSelectedScene);
    if (!stage) return;
    zoomAt(stage, 1.1);
  };
  const doZoomOut = () => {
    const { stage } = getStageAndLayer(getSelectedScene);
    if (!stage) return;
    zoomAt(stage, 1 / 1.1);
  };

  const toggleDrag = (checked) => {
    const { stage } = getStageAndLayer(getSelectedScene);
    if (!stage) return;
    stage.draggable(checked);
    stage.batchDraw();
    setDragEnabled(checked);
  };

  function renumberAllGrids(layer, videoWalls) {
    let start = 1;
    for (const m of videoWalls) {
      const g = layer.findOne(`#monitor-group-${m.id}`);
      if (!g) continue;
      const meta = g.getAttr("gridMeta");
      if (!meta?.rows || !meta?.cols) continue;
      drawVirtualGridOnMonitor(layer, m.id, meta.rows, meta.cols, start);
      start += meta.rows * meta.cols;
    }
  }

  const applyGrid = () => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer || !gridMonitorId) return;

    const orderIndex = videoWalls.findIndex((m) => m.id === gridMonitorId);
    let startIndex = 1;
    for (let i = 0; i < orderIndex; i++) {
      const prevId = videoWalls[i].id;
      const g = layer.findOne(`#monitor-group-${prevId}`);
      const meta = g?.getAttr("gridMeta");
      if (meta?.rows && meta?.cols) startIndex += meta.rows * meta.cols;
    }

    drawVirtualGridOnMonitor(
      layer,
      gridMonitorId,
      parseInt(gridRows),
      parseInt(gridCols),
      startIndex
    );
    const cells = getGridCells(layer, gridMonitorId);
    cellCacheRef.current.set(gridMonitorId, cells);
    startTransition(() => {
      setCellOptions(
        cells.map((c) => ({
          key: String(c.index),
          value: String(c.index),
          label: `سلول ${c.index}`,
        }))
      );
    });
  };

  const applyGlobal = () => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer) return;
    const cells = drawGlobalGrid(layer, videoWalls, parseInt(globalRows), parseInt(globalCols), {
      showIndices: showGlobalIndex,
    });
    setGlobalCells(cells);
  };

  const clearGlobal = () => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer) return;
    clearGlobalGrid(layer);
    setGlobalCells([]);
    setSelectedGlobalCells(new Set());
  };

  const handlePlaceGlobal = () => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer || !selectedAssetKey || !selectedGlobalCells || !selectedGlobalCells.size) return;

    const [type, id] = selectedAssetKey.split(":");
    let resource = null;
    if (["IMAGE", "VIDEO", "IFRAME"].includes(type)) {
      resource = resources.find((r) => String(r.id) === id);
    } else if (type === "INPUT") {
      resource = inputs.find((r) => String(r.id) === id);
    }
    if (!resource) return;

    const spanRect = getSpanRectForGlobalSelection(selectedGlobalCells, globalCells);
    if (!spanRect) return;

    placeResourceInCell({
      type,
      resource,
      cellRect: spanRect,
      ctx: {
        addImage,
        contentGenerator,
        addVideo,
        addWeb,
        addInput,
        getSelectedScene,
        setSources,
        sendOperation,
        url,
        loopVideos,
        generateBlobImageURL,
      },
    });
  };

  const handlePlace = () => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer || !gridMonitorId || !selectedCellIndex || !selectedAssetKey) return;

    const cells = getGridCells(layer, gridMonitorId);
    const cell = cells.find((c) => String(c.index) === String(selectedCellIndex));
    if (!cell) return;

    const [type, id] = selectedAssetKey.split(":");
    let resource = null;
    if (type === "IMAGE" || type === "VIDEO" || type === "IFRAME") {
      resource = resources.find((r) => String(r.id) === id);
    } else if (type === "INPUT") {
      resource = inputs.find((r) => String(r.id) === id);
    }
    if (!resource) return;

    placeResourceInCell({
      type,
      resource,
      cellRect: cell.rect,
      ctx: {
        contentGenerator,
        addImage,
        addVideo,
        addWeb,
        addInput,
        getSelectedScene,
        setSources,
        sendOperation,
        url,
        loopVideos,
        generateBlobImageURL,
      },
    });
  };

  const handlePlaceIntoGroup = () => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer) return;
    if (selectedGroupIndex === null || selectedGroupIndex === undefined) return;
    if (!selectedAssetKey) return;

    const targetGroup = groups[selectedGroupIndex];
    if (!targetGroup) return;

    const rectNode = targetGroup.findOne("Rect");
    if (!rectNode) return;

    const cellRect = {
      x: rectNode.x(),
      y: rectNode.y(),
      width: rectNode.width(),
      height: rectNode.height(),
    };

    const [type, id] = selectedAssetKey.split(":");
    let resource = null;
    if (type === "IMAGE" || type === "VIDEO" || type === "IFRAME") {
      resource = resources.find((r) => String(r.id) === id);
    } else if (type === "INPUT") {
      resource = inputs.find((r) => String(r.id) === id);
    }
    if (!resource) return;

    placeResourceInCell({
      type,
      resource,
      cellRect,
      ctx: {
        addImage,
        contentGenerator,
        addVideo,
        addWeb,
        addInput,
        getSelectedScene,
        setSources,
        sendOperation,
        url,
        loopVideos,
        generateBlobImageURL,
      },
    });
  };

  const handleCreateGroup = () => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer || !selectedMonitors.length) return;

    const groupName = `Group ${groupCounter}`;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    selectedMonitors.forEach((mId) => {
      const m = videoWalls.find((v) => Number(v.id) === Number(mId));
      if (!m) return;
      const x2 = m.x + m.width;
      const y2 = m.y + m.height;
      if (m.x < minX) minX = m.x;
      if (m.y < minY) minY = m.y;
      if (x2 > maxX) maxX = x2;
      if (y2 > maxY) maxY = y2;
    });

    if (
      !Number.isFinite(minX) ||
      !Number.isFinite(minY) ||
      !Number.isFinite(maxX) ||
      !Number.isFinite(maxY)
    )
      return;

    const group = new Konva.Group({ name: "monitor-grouping", listening: false });

    const rect = new Konva.Rect({
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      stroke: "red",
      strokeWidth: 2,
      dash: [10, 6],
      listening: false,
    });

    const label = new Konva.Text({
      x: minX,
      y: minY + (maxY - minY) / 2 - 30,
      width: maxX - minX,
      align: "center",
      text: groupName,
      fontSize: 70,
      fontStyle: "bold",
      fill: "white",
      listening: false,
    });

    group.add(rect);
    group.add(label);
    group.setAttr("groupName", groupName);
    group.setAttr("kind", "monitor-grouping");

    const { layer: lyr } = getStageAndLayer(getSelectedScene);
    lyr.add(group);
    lyr.batchDraw();

    setGroups((prev) => [...prev, group]);
    setGroupCounter((c) => c + 1);
    setSelectedMonitors([]);
  };

  const handleCancelGroup = () => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!groups.length || !layer) return;
    const last = groups[groups.length - 1];
    if (last && last.destroy) last.destroy();
    setGroups((prev) => prev.slice(0, -1));
    layer.batchDraw();
  };

  // ---------------- Visual (JSX) ----------------
  const gridBg = useMemo(() => {
    const line = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
    const dot = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    return {
      backgroundImage: `
        linear-gradient(0deg, ${line} 1px, transparent 1px),
        linear-gradient(90deg, ${line} 1px, transparent 1px),
        radial-gradient(${dot} 1px, transparent 1px)
      `,
      backgroundSize: "24px 24px, 24px 24px, 24px 24px",
      backgroundPosition: "0 0, 0 0, 12px 12px",
    };
  }, [darkMode]);

  return (
    <Card
      radius="lg"
      shadow="lg"
      className={`my-auto ${isToggleLayout ? " w-[98%]" : " w-[58%]"} py-2 h-[85%] bottom-0 top-5 
        ${darkMode ? "bg-[#171b22] border border-[#2a2f36]" : "bg-white border border-gray-200"}
      `}
    >
      <CardHeader className="flex flex-wrap gap-3 justify-between items-center py-3 px-4">
        <div className="flex flex-col">
          <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
            {subtitle}
          </span>
          <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
            {title}
          </h3>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Switch
            classNames={{ label: `${darkMode ? "dark" : "light"}` }}
            size="sm"
            isSelected={isActiveGrid}
            onValueChange={() => setIsActiveGrid(!isActiveGrid)}
          >
            چیدمان مجازی
          </Switch>
          <Switch
            classNames={{ label: `${darkMode ? "dark" : "light"}` }}
            size="sm"
            isSelected={isRealTime}
            onValueChange={() => setIsRealTime(!isRealTime)}
            className="ml-1"
          >
            RealTime
          </Switch>
          <Switch
            classNames={{ label: `${darkMode ? "dark" : "light"}` }}
            size="sm"
            isSelected={dragEnabled}
            onValueChange={toggleDrag}
            className="ml-1"
          >
            درگ کردن
          </Switch>
          <Button
            size="sm"
            variant="flat"
            className={`${darkMode ? "dark" : "light"}`}
            onPress={onFit}
            startContent={<TbMaximize />}
          >
            کالیبره مرکزی
          </Button>
          <Button
            size="sm"
            className={`${darkMode ? "dark" : "light"}`}
            variant="flat"
            onPress={doCenter}
            startContent={<TbFocusCentered />}
          >
            مرکز صفحه
          </Button>
          <Button
            size="sm"
            variant="flat"
            className={`${darkMode ? "dark" : "light"}`}
            onPress={doReset}
            startContent={<TbZoomReset />}
          >
            100%
          </Button>

          <div className="h-6 w-px bg-gray-300/30 mx-1" />

          <Button
            size="sm"
            variant="flat"
            className={`${darkMode ? "dark" : "light"}`}
            onPress={doZoomOut}
            startContent={<TbZoomOut />}
          >
            Zoom-
          </Button>
          <Button
            size="sm"
            variant="flat"
            className={`${darkMode ? "dark" : "light"}`}
            onPress={doZoomIn}
            startContent={<TbZoomIn />}
          >
            Zoom+
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select
            size="sm"
            aria-label="انتخاب مانیتور کالیبراسیون"
            className={`${darkMode ? "dark" : "light"} min-w-[160px]`}
            selectedKeys={calibMonitorId ? [String(calibMonitorId)] : []}
            onChange={(e) => setCalibMonitorId(Number(e.target.value))}
          >
            {videoWalls.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.name ?? `Monitor ${m.id}`}
              </SelectItem>
            ))}
          </Select>
          <Button
            size="sm"
            variant="flat"
            className={`${darkMode ? "dark" : "light"}`}
            onPress={() => doFitMonitor(calibMonitorId)}
            startContent={<TbMaximize />}
            isDisabled={!calibMonitorId}
          >
            کالیبره مانیتور
          </Button>
        </div>
      </CardHeader>
      <CardBody className="px-0 pb-0">
        {/* کانواس */}
        <div
          className={`
            relative mx-auto
            w-[96%]
            h-[72vh]
            rounded-2xl overflow-hidden
            ${darkMode ? "ring-1 ring-[#2a2f36]" : "ring-1 ring-gray-200"}
          `}
          style={gridBg}
        >
          {/* قاب داخلی نرم */}
          <div
            className={`absolute inset-3 rounded-xl 
              ${darkMode ? "border border-white/10" : "border border-black/10"}
              pointer-events-none
            `}
          />

          {/* Konva Containers */}
          <div className="absolute inset-0">
            <div id="Video-Wall-Section" className="w-full h-full">
              <div
                id="Monitor"
                className="block w-full h-full overflow-hidden relative active:cursor-grabbing"
              >
                <div id="infiniteDiv" style={{ scale: 1 }} className="w-full h-full relative">
                  <div id="content" className="absolute inset-0">
                    {scenes.map((scene) => (
                      <div
                        key={scene.id}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        id={`containerKonva-${scene.id}`}
                        style={{ display: selectedScene === scene.id ? "block" : "none" }}
                        className="w-full h-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isActiveGrid && (
            <div
              className={`
                absolute left-3 right-3 bottom-2 rounded-2xl
                backdrop-blur-md shadow-lg border
                ${darkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}
              `}
            >
              <div className="px-3 pb-3">
                <div
                  className={`mt-2 rounded-xl overflow-hidden border ${
                    darkMode ? "border-white/10" : "border-black/10"
                  }`}
                >
                  {/* Tabs */}
                  <div
                    className={`grid grid-cols-4 text-center text-sm font-medium ${
                      darkMode ? "bg-white/5 text-white/70" : "bg-gray-400 text-black/70"
                    }`}
                  >
                    <button
                      className={`py-2 hover:opacity-80 ${
                        activeTab === "grid" ? "bg-primary/20" : ""
                      }`}
                      onClick={() => setActiveTab("grid")}
                    >
                      گرید مانیتور
                    </button>
                    <button
                      className={`py-2 hover:opacity-80 ${
                        activeTab === "global" ? "bg-primary/20" : ""
                      }`}
                      onClick={() => setActiveTab("global")}
                    >
                      گرید جمعی
                    </button>
                    <button
                      className={`py-2 hover:opacity-80 ${
                        activeTab === "groups" ? "bg-primary/20" : ""
                      }`}
                      onClick={() => setActiveTab("groups")}
                    >
                      گروه‌ها
                    </button>
                    <button
                      className={`py-2 hover:opacity-80 ${
                        activeTab === "place" ? "bg-primary/20" : ""
                      }`}
                      onClick={() => setActiveTab("place")}
                    >
                      قرار دادن
                    </button>
                  </div>

                  {/* Panels */}
                  <div className={`${darkMode ? "bg-[#0f131a]" : "bg-white"} p-3`}>
                    {/* === Grid (per monitor) === */}
                    <div className={activeTab === "grid" ? "grid grid-cols-12 gap-2" : "hidden"}>
                      <div className="col-span-12 md:col-span-3">
                        <Select
                          size="sm"
                          label="مانیتور"
                          selectedKeys={gridMonitorId ? [String(gridMonitorId)] : []}
                          onChange={(e) => setGridMonitorId(Number(e.target.value))}
                        >
                          {videoWalls.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.name ?? `Monitor ${m.id}`}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <Input
                          size="sm"
                          type="number"
                          min={1}
                          label="سطر"
                          value={String(gridRows)}
                          onChange={(e) => setGridRows(e.target.value)}
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <Input
                          size="sm"
                          type="number"
                          min={1}
                          label="ستون"
                          value={String(gridCols)}
                          onChange={(e) => setGridCols(e.target.value)}
                        />
                      </div>
                      <div className="col-span-12 md:col-span-2 flex items-end">
                        <Button size="sm" color="primary" className="w-full" onPress={applyGrid}>
                          اعمال گرید
                        </Button>
                      </div>
                    </div>

                    {/* === Global (collective) grid === */}
                    <div className={activeTab === "global" ? "grid grid-cols-12 gap-2" : "hidden"}>
                      <div className="col-span-6 md:col-span-2">
                        <Input
                          size="sm"
                          type="number"
                          min={1}
                          label="سطر (کل دیوار)"
                          value={String(globalRows)}
                          onChange={(e) => setGlobalRows(e.target.value)}
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <Input
                          size="sm"
                          type="number"
                          min={1}
                          label="ستون (کل دیوار)"
                          value={String(globalCols)}
                          onChange={(e) => setGlobalCols(e.target.value)}
                        />
                      </div>
                      <div className="col-span-12 md:col-span-3 flex items-center md:items-end">
                        <Checkbox
                          isSelected={showGlobalIndex}
                          onValueChange={setShowGlobalIndex}
                          classNames={{ label: `${darkMode ? "text-white" : "text-[#0f131a]"}` }}
                          className={`${
                            darkMode ? "text-white" : "text-[#0f131a]"
                          } p-3 col-span-12 text-xs opacity-70 mt-1 w-full`}
                          size="sm"
                        >
                          شماره‌گذاری خانه‌ها
                        </Checkbox>
                      </div>
                      <div className="col-span-6 md:col-span-2 flex items-end">
                        <Button size="sm" color="primary" className="w-full" onPress={applyGlobal}>
                          اعمال گرید جمعی
                        </Button>
                      </div>
                      <div className="col-span-6 md:col-span-2 flex items-end">
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={clearGlobal}
                          startContent={<TbTrash />}
                        >
                          حذف گرید جمعی
                        </Button>
                      </div>
                      <div
                        className={`${
                          darkMode ? "text-white" : "text-[#0f131a]"
                        } p-3 col-span-12 text-xs opacity-70 mt-1`}
                      >
                        این گرید روی کل محدودهٔ همهٔ مانیتورها خط‌کشی می‌کند (مثلاً ۵×۳ روی چیدمان
                        ۴×۴).
                      </div>
                    </div>

                    {/* === Place Global (span) panel === */}
                    <div
                      className={activeTab === "placeGlobal" ? "grid grid-cols-12 gap-2" : "hidden"}
                    >
                      <div className="col-span-12 md:col-span-6">
                        <Select
                          size="sm"
                          selectionMode="multiple"
                          label="سلول‌های گرید جمعی"
                          selectedKeys={Array.from(selectedGlobalCells)}
                          onSelectionChange={(keys) =>
                            setSelectedGlobalCells(
                              new Set(Array.isArray(keys) ? keys : Array.from(keys ?? []))
                            )
                          }
                          isDisabled={!globalCells.length}
                        >
                          {!globalCells.length ? (
                            <SelectItem key="__empty" isReadOnly>
                              ابتدا گرید جمعی را اعمال کنید
                            </SelectItem>
                          ) : (
                            globalCells.map((c) => (
                              <SelectItem key={String(c.index)} value={String(c.index)}>
                                قطعه {c.index}
                              </SelectItem>
                            ))
                          )}
                        </Select>

                        <Select
                          size="sm"
                          label="منبع"
                          selectedKeys={selectedAssetKey ? [selectedAssetKey] : []}
                          onChange={(e) => setSelectedAssetKey(e.target.value)}
                        >
                          {inputs.length > 0 && (
                            <SelectItem key="__group_inputs" isReadOnly>
                              — ورودی‌ها —
                            </SelectItem>
                          )}
                          {inputs.map((i) => (
                            <SelectItem key={`INPUT:${i.id}`} value={`INPUT:${i.id}`}>
                              [INPUT] {i.name}
                            </SelectItem>
                          ))}

                          {resources.length > 0 && (
                            <SelectItem key="__group_files" isReadOnly>
                              — فایل‌ها —
                            </SelectItem>
                          )}
                          {resources.map((r) => (
                            <SelectItem key={`${r.type}:${r.id}`} value={`${r.type}:${r.id}`}>
                              [{r.type}] {r.name}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>

                      <div className="col-span-12 md:col-span-3 flex items-end">
                        <Button
                          size="sm"
                          color="success"
                          className="w-full"
                          onPress={handlePlaceGlobal}
                          isDisabled={!selectedAssetKey || !selectedGlobalCells.size}
                        >
                          قرار بده (جمعی)
                        </Button>
                      </div>
                    </div>

                    {/* === Groups panel === */}
                    <div className={activeTab === "groups" ? "grid grid-cols-12 gap-2" : "hidden"}>
                      <div className="col-span-12 md:col-span-5">
                        <Select
                          size="sm"
                          selectionMode="multiple"
                          label="انتخاب مانیتورها"
                          selectedKeys={selectedMonitors.map(String)}
                          onSelectionChange={(keys) => setSelectedMonitors([...keys].map(Number))}
                        >
                          {videoWalls.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.name ?? `Monitor ${m.id}`}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>
                      <div className="col-span-6 md:col-span-2 flex items-end">
                        <Button
                          size="sm"
                          color="danger"
                          className="w-full"
                          isDisabled={!selectedMonitors.length}
                          onPress={handleCreateGroup}
                        >
                          ایجاد گروه
                        </Button>
                      </div>
                      <div className="col-span-6 md:col-span-2 flex items-end">
                        <Button
                          size="sm"
                          color="warning"
                          className="w-full"
                          isDisabled={!groups.length}
                          onPress={handleCancelGroup}
                        >
                          لغو گروه اخیر
                        </Button>
                      </div>
                    </div>

                    {/* === Place panel (per monitor) === */}
                    <div className={activeTab === "place" ? "grid grid-cols-12 gap-2" : "hidden"}>
                      <div className="col-span-12 md:col-span-6">
                        <div className="col-span-12 flex flex-col gap-2 md:col-span-3">
                          <div className="w-full flex items-center justify-center mx-auto gap-2">
                            <Select
                              size="sm"
                              label="گروه"
                              selectedKeys={
                                selectedGroupIndex !== null && selectedGroupIndex !== undefined
                                  ? [String(selectedGroupIndex)]
                                  : []
                              }
                              onChange={(e) => setSelectedGroupIndex(Number(e.target.value))}
                              isDisabled={!groups.length}
                            >
                              {groups.length === 0 ? (
                                <SelectItem key="__ng" isReadOnly>
                                  گروهی ندارید
                                </SelectItem>
                              ) : (
                                groups.map((g, idx) => (
                                  <SelectItem key={idx} value={String(idx)}>
                                    {g.getAttr("groupName") || `Group ${idx + 1}`}
                                  </SelectItem>
                                ))
                              )}
                            </Select>
                            <Select
                              size="sm"
                              label="سلول"
                              selectedKeys={selectedCellIndex ? [String(selectedCellIndex)] : []}
                              onChange={(e) => setSelectedCellIndex(e.target.value)}
                              isDisabled={!cellOptions.length}
                            >
                              {cellOptions.length === 0 ? (
                                <SelectItem key="__empty" isReadOnly>
                                  ابتدا گرید را اعمال کنید
                                </SelectItem>
                              ) : (
                                cellOptions.map((c) => (
                                  <SelectItem key={c.key} value={c.value}>
                                    {c.label}
                                  </SelectItem>
                                ))
                              )}
                            </Select>
                          </div>

                          {/* Global grid multi-select (span from here as well) */}
                          <Select
                            size="sm"
                            label="گرید جمعی (چندانتخاب)"
                            selectionMode="multiple"
                            selectedKeys={Array.from(selectedGlobalCells)}
                            onSelectionChange={(keys) =>
                              setSelectedGlobalCells(
                                new Set(Array.isArray(keys) ? keys : Array.from(keys ?? []))
                              )
                            }
                            isDisabled={!globalCells.length}
                          >
                            {!globalCells.length ? (
                              <SelectItem key="__no_global" isReadOnly>
                                ابتدا گرید جمعی را اعمال کنید
                              </SelectItem>
                            ) : (
                              globalCells.map((c) => (
                                <SelectItem key={String(c.index)} value={String(c.index)}>
                                  قطعه {c.index}
                                </SelectItem>
                              ))
                            )}
                          </Select>

                          <Select
                            size="sm"
                            label="منبع"
                            selectedKeys={selectedAssetKey ? [selectedAssetKey] : []}
                            onChange={(e) => setSelectedAssetKey(e.target.value)}
                          >
                            {inputs.length > 0 && (
                              <SelectItem key="__group_inputs" isReadOnly>
                                — ورودی‌ها —
                              </SelectItem>
                            )}
                            {inputs.map((i) => (
                              <SelectItem key={`INPUT:${i.id}`} value={`INPUT:${i.id}`}>
                                [INPUT] {i.name}
                              </SelectItem>
                            ))}
                            {resources.length > 0 && (
                              <SelectItem key="__group_files" isReadOnly>
                                — فایل‌ها —
                              </SelectItem>
                            )}
                            {resources.map((r) => (
                              <SelectItem key={`${r.type}:${r.id}`} value={`${r.type}:${r.id}`}>
                                [{r.type}] {r.name}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                      </div>
                      <div className="col-span-6 md:col-span-3 flex items-end">
                        <Button
                          size="sm"
                          color="success"
                          className="w-full"
                          onPress={handlePlace}
                          isDisabled={!selectedCellIndex || !selectedAssetKey}
                        >
                          قرار بده (سلول)
                        </Button>
                      </div>
                      <div className="col-span-6 md:col-span-3 flex items-end">
                        <Button
                          size="sm"
                          color="success"
                          className="w-full"
                          onPress={handlePlaceIntoGroup}
                          isDisabled={
                            !selectedAssetKey ||
                            selectedGroupIndex === null ||
                            selectedGroupIndex === undefined ||
                            !groups.length
                          }
                        >
                          قرار بده (گروه)
                        </Button>
                      </div>
                      <div className="col-span-6 md:col-span-3 flex items-end">
                        <Button
                          size="sm"
                          color="success"
                          className="w-full"
                          onPress={handlePlaceGlobal}
                          isDisabled={!selectedAssetKey || !selectedGlobalCells.size}
                        >
                          قرار بده (گرید جمعی)
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
