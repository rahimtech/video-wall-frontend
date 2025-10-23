import Konva from "konva";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import config from "../../public/config.json";
import api from "../api/api";
import { deleteSourceFromScene } from "../components/konva/common/deleteSourceFromScene";
import { fitToMonitors } from "../components/konva/common/FitToMonitor";
import { addImage } from "../components/konva/items/image/ImageKonva";
import { addInput } from "../components/konva/items/input/InputKonva";
import {
  LayoutDropdownArrMonitor,
  MonitorLayoutModal,
  MonitorPositionEditor,
  updateKonvaMonitorPosition,
  updateMonitorPosition,
} from "../components/konva/items/monitor/position/MonitorPosition";
import {
  addMonitorsToScenes,
  arrangeMForScenes,
  arrangeMonitors,
  generateMonitorsForLayer,
} from "../components/konva/items/monitor/MonitorKonva";
import { addText, startMarquee, stopMarquee } from "../components/konva/items/text/TextKonva";
import {
  addVideo,
  pauseVideo,
  playVideo,
  toggleLoopVideo,
} from "../components/konva/items/video/VideoKonva";
import { addWeb, editWeb } from "../components/konva/items/web/WebKonva";
import { IconMenuSidebar } from "../components/sidebar/common/IconMenuSidebar";

import {
  addScene,
  deleteScene,
  handleEditSceneName,
} from "../components/sidebar/scenes/ScenesCrud";
import { io } from "socket.io-client";
import axios from "axios";
import Hls from "hls.js";

export const ChangeRT = Object.freeze({ PENDING: "PENDING", DONE: "DONE", CANCEL: "CANCEL" });
const MyContext = createContext();

export const MyContextProvider = ({ children }) => {
  let anim;
  let host = localStorage.getItem("host") ?? config.host;
  let port = localStorage.getItem("port") ?? config.port;
  // let initSofware = false;

  // INIT DATA Bad-Practice
  let fetchDataScene = [];
  let fetchDataColl = [];

  // States
  const [videoWalls, setVideoWalls] = useState([
    // --- Row 1 ---
    {
      id: 1,
      name: "TV1",
      x: 0,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 101,
      monitorNumber: 1,
    },
    {
      id: 2,
      name: "TV2",
      x: 1440,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 102,
      monitorNumber: 2,
    },
    {
      id: 3,
      name: "TV3",
      x: 2880,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 103,
      monitorNumber: 3,
    },
    {
      id: 4,
      name: "TV4",
      x: 4320,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 104,
      monitorNumber: 4,
    },
    {
      id: 5,
      name: "TV5",
      x: 5760,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 105,
      monitorNumber: 5,
    },
    {
      id: 6,
      name: "TV6",
      x: 7200,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 106,
      monitorNumber: 6,
    },
    {
      id: 7,
      name: "TV7",
      x: 8640,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 107,
      monitorNumber: 7,
    },
    {
      id: 8,
      name: "TV8",
      x: 10080,
      y: 0,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 108,
      monitorNumber: 8,
    },

    // --- Row 2 ---
    {
      id: 9,
      name: "TV9",
      x: 0,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 109,
      monitorNumber: 9,
    },
    {
      id: 10,
      name: "TV10",
      x: 1440,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 110,
      monitorNumber: 10,
    },
    {
      id: 11,
      name: "TV11",
      x: 2880,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 111,
      monitorNumber: 11,
    },
    {
      id: 12,
      name: "TV12",
      x: 4320,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 112,
      monitorNumber: 12,
    },
    {
      id: 13,
      name: "TV13",
      x: 5760,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 113,
      monitorNumber: 13,
    },
    {
      id: 14,
      name: "TV14",
      x: 7200,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 114,
      monitorNumber: 14,
    },
    {
      id: 15,
      name: "TV15",
      x: 8640,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 115,
      monitorNumber: 15,
    },
    {
      id: 16,
      name: "TV16",
      x: 10080,
      y: 900,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 116,
      monitorNumber: 16,
    },

    // --- Row 3 ---
    {
      id: 17,
      name: "TV17",
      x: 0,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 117,
      monitorNumber: 17,
    },
    {
      id: 18,
      name: "TV18",
      x: 1440,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 118,
      monitorNumber: 18,
    },
    {
      id: 19,
      name: "TV19",
      x: 2880,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 119,
      monitorNumber: 19,
    },
    {
      id: 20,
      name: "TV20",
      x: 4320,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 120,
      monitorNumber: 20,
    },
    {
      id: 21,
      name: "TV21",
      x: 5760,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 121,
      monitorNumber: 21,
    },
    {
      id: 22,
      name: "TV22",
      x: 7200,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 122,
      monitorNumber: 22,
    },
    {
      id: 23,
      name: "TV23",
      x: 8640,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 123,
      monitorNumber: 23,
    },
    {
      id: 24,
      name: "TV24",
      x: 10080,
      y: 1800,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 124,
      monitorNumber: 24,
    },

    // --- Row 4 ---
    {
      id: 25,
      name: "TV25",
      x: 0,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 125,
      monitorNumber: 25,
    },
    {
      id: 26,
      name: "TV26",
      x: 1440,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 126,
      monitorNumber: 26,
    },
    {
      id: 27,
      name: "TV27",
      x: 2880,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 127,
      monitorNumber: 27,
    },
    {
      id: 28,
      name: "TV28",
      x: 4320,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 128,
      monitorNumber: 28,
    },
    {
      id: 29,
      name: "TV29",
      x: 5760,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 129,
      monitorNumber: 29,
    },
    {
      id: 30,
      name: "TV30",
      x: 7200,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 130,
      monitorNumber: 30,
    },
    {
      id: 31,
      name: "TV31",
      x: 8640,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 131,
      monitorNumber: 31,
    },
    {
      id: 32,
      name: "TV32",
      x: 10080,
      y: 2700,
      width: 1440,
      height: 900,
      connected: false,
      monitorUniqId: 132,
      monitorNumber: 32,
    },
  ]);

  const [monitorConnection, setMonitorConnection] = useState([]);
  const [initSofware, setInitSoftwaew] = useState(false);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  const [activeModal, setActiveModal] = useState(null);
  const openModal = (modalType) => setActiveModal(modalType);
  const closeModal = () => setActiveModal(null);
  let tempSocket = null;

  const [isToggleLayout, setIsToggleLayout] = useState(
    localStorage.getItem("layout") === "true" ? true : false || false
  );
  const [isRightControlsVisible, setIsRightControlsVisible] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [miniLoad, setMiniLoad] = useState(false);
  const [isToggleVideoWall, setIsToggleVideoWall] = useState(false);
  const [loopVideos, setLoopVideos] = useState({});
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true" ? true : false || false
  );
  const [connecting, setConnecting] = useState(false);
  const [connectionMode, setConnectionMode] = useState(
    localStorage.getItem("onlineMode") === "true" ? true : false || true
  );
  const [inputs, setInputs] = useState([]);
  const videoWallsRef = useRef(videoWalls);
  const connectionModeRef = useRef(connectionMode);
  const [selectedScene, setSelectedScene] = useState(null);
  const selectedSceneRef = useRef(selectedScene);

  const [isBottomControlsVisible, setIsBottomControlsVisible] = useState(true);
  const [editingSceneId, setEditingSceneId] = useState(null);

  //Scheduling Checks...
  const [activeSceneId, setActiveSceneId] = useState(null);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [activeProgram, setActiveProgram] = useState(null);

  const [timeLine, setTimeLine] = useState([]);

  const [collections, setCollections] = useState([]);
  const [scenes, setScenes] = useState([]);
  const scenesRef = useRef(scenes);
  const [url, setUrl] = useState(null);
  const urlRef = useRef(url);

  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(1);
  const [sources, setSources] = useState([]);
  const sourcesRef = useRef(sources);

  const [pendingOperations, setPendingOperation] = useState([]);
  const [flagOperations, setFlagOperation] = useState(false);
  const [resources, setResources] = useState([]);
  const [flagReset, setFlagReset] = useState(false);
  const [dataDrag, setDataDrag] = useState({});
  const [filteredScenes, setFilteredScenes] = useState([]);
  const [isChangeRealTime, setIsChangeRealTime] = useState(ChangeRT.CANCEL);
  const [dataChangeRealTime, setDataChangeRealTime] = useState([]);
  const [isRealTime, setIsRealTime] = useState(true);
  const isRealTimeRef = useRef(isRealTime);

  const [isRunFitStage, setIsRunFitStage] = useState(false);

  let arrayCollisions = [];
  let counterImages = 0;
  let counterVideos = 0;
  let allDataMonitors = videoWalls;
  let motherLayer;
  let motherStage;
  let isMonitorOff = false;

  // addMonitorsToScenes({ jsonData: videoWalls, scenes: fetchDataScene, setScenes });

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  async function fetchRSSDescriptions(
    rssUrl,
    {
      fetchFeedPageTitle = true, // تایتل HTML صفحه‌ی feed.link
      fetchItemPageTitles = false, // در صورت true، برای چند آیتم اول هم تایتل HTML می‌گیرد
      itemPageTitleLimit = 5, // حداکثر چند آیتم اول
    } = {}
  ) {
    const l = console.log;

    async function tryFetchHTMLTitle(pageUrl, timeoutMs = 7000) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(pageUrl, {
          headers: { Accept: "text/html,application/xhtml+xml,*/*" },
          redirect: "follow",
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) return null;
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const title = doc.querySelector("title")?.textContent?.trim() || "";
        const og =
          doc.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim() || "";
        return title || og || null;
      } catch {
        return null; // احتمال CORS یا timeout
      }
    }

    try {
      l(`🔵 Fetching RSS from: ${rssUrl}`);

      const res = await fetch(rssUrl, {
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml, */*",
          "User-Agent": "VideoWall-Controller-RSS-Fetcher/1.0",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const xmlText = await res.text();
      const xml = new DOMParser().parseFromString(xmlText, "application/xml");

      const parserError = xml.querySelector("parsererror");
      if (parserError) throw new Error("XML parse error");

      const isRSS = !!xml.querySelector("rss, rdf\\:RDF");
      const isAtom = !!xml.querySelector("feed");
      if (!isRSS && !isAtom) throw new Error("Not an RSS/Atom feed");

      let feedTitle = "",
        feedLink = "";
      let items = [];

      if (isRSS) {
        feedTitle = (xml.querySelector("channel > title")?.textContent || "").trim();
        feedLink = (xml.querySelector("channel > link")?.textContent || "").trim();

        items = Array.from(xml.querySelectorAll("channel > item")).map((item) => {
          const title = (item.querySelector("title")?.textContent || "").trim();
          const link = (item.querySelector("link")?.textContent || "").trim();
          const description = (
            item.querySelector("content\\:encoded")?.textContent ||
            item.querySelector("description")?.textContent ||
            ""
          ).trim();
          return { title, link, description };
        });
      } else {
        // Atom
        feedTitle = (xml.querySelector("feed > title")?.textContent || "").trim();
        feedLink = (
          xml.querySelector('feed > link[rel="alternate"]')?.getAttribute("href") ||
          xml.querySelector("feed > link[href]")?.getAttribute("href") ||
          ""
        ).trim();

        items = Array.from(xml.querySelectorAll("feed > entry")).map((entry) => {
          const title = (entry.querySelector("title")?.textContent || "").trim();
          const link = (
            entry.querySelector('link[rel="alternate"]')?.getAttribute("href") ||
            entry.querySelector("link[href]")?.getAttribute("href") ||
            ""
          ).trim();
          const description = (
            entry.querySelector("content")?.textContent ||
            entry.querySelector("summary")?.textContent ||
            ""
          ).trim();
          return { title, link, description };
        });
      }

      // برای سازگاری با کد قبلی‌ات
      const descriptions = items.map((i) => i.description).filter(Boolean);

      // عنوان HTML صفحه‌ی لینک فید (در صورت تمایل)
      let siteTitle = "";
      if (fetchFeedPageTitle && feedLink) {
        siteTitle = (await tryFetchHTMLTitle(feedLink)) || "";
      }

      // عنوان HTML صفحات هر خبر (اختیاری و محدود)
      if (fetchItemPageTitles && items.length) {
        const n = Math.min(itemPageTitleLimit, items.length);
        await Promise.all(
          items.slice(0, n).map(async (it) => {
            if (it.link) {
              it.pageTitle = await tryFetchHTMLTitle(it.link);
            }
          })
        );
      }

      return {
        success: true,
        data: descriptions, // قبلی‌ها همچنان کار می‌کنند
        feed: {
          title: feedTitle, // عنوان خود فید
          link: feedLink,
          siteTitle, // تایتل HTML صفحه‌ی اصلی (در صورت دسترسی)
        },
        items, // هر آیتم: {title, link, description, pageTitle?}
      };
    } catch (error) {
      l(`❌ RSS fetch error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  function getContentPointerFromDomEvent(stage, evt) {
    const ne = evt?.nativeEvent ?? evt;
    if (!ne) return null;

    stage.setPointersPositions({ clientX: ne.clientX, clientY: ne.clientY });

    const p = stage.getPointerPosition(); // مختصات روی کانواس نمایش (screen coords)
    if (!p) return null;

    const inv = stage.getAbsoluteTransform().copy().invert();
    return inv.point(p); // {x, y} در فضای محتوای استیج
  }

  function forcePlaceById({ layer, id, x, y, center = false }) {
    requestAnimationFrame(() => {
      // گروه را پیدا کن
      const g = layer.findOne(`#${id}`) || layer.findOne(`[id="${id}"]`) || layer.findOne(`.${id}`);
      if (!g) return;

      if (center) {
        // اگر می‌خواهی مرکز شیء زیر موس بیفتد:
        const node = g.findOne(".object") || g.findOne("Image") || g.findOne("Rect") || g;
        const w = (node.width?.() ?? 0) * (g.scaleX?.() ?? 1);
        const h = (node.height?.() ?? 0) * (g.scaleY?.() ?? 1);
        g.absolutePosition({ x: x - w / 2, y: y - h / 2 });
      } else {
        // گوشه‌ی بالا-چپ دقیقا زیر موس
        g.absolutePosition({ x, y });
      }

      g.getLayer()?.batchDraw();
    });
  }

  // 3) یک کمک کوچک برای درآوردن id بیرونیِ آیتمِ درَگ شده
  function pickExternalId(payload) {
    // بسته به ساختار شما:
    return (
      payload?.externalId ||
      payload?.id ||
      payload?.img?.externalId ||
      payload?.videoElement?.externalId ||
      payload?.webResource?.externalId ||
      payload?.input?.externalId
    );
  }

  // ---- handler اصلی
  const handleDrop = (e) => {
    e.preventDefault();

    const scn = getSelectedScene();
    const stage = scn?.stageData;
    const layer = scn?.layer;
    if (!stage || !layer) return;

    if (e.nativeEvent) stage.setPointersPositions(e.nativeEvent);

    let screenPt = stage.getPointerPosition();
    if (!screenPt) {
      const rect = stage.container().getBoundingClientRect();
      screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    const inv = stage.getAbsoluteTransform().copy().invert();
    const contentPt = inv.point(screenPt);
    const baseSceneId = scn.id;

    if (dataDrag.type === "IMAGE" && dataDrag.img) {
      addImage({
        ...dataDrag,
        img: { ...dataDrag.img, x: contentPt.x, y: contentPt.y, sceneId: baseSceneId },
      });
    } else if (dataDrag.type === "VIDEO" && dataDrag.videoElement) {
      addVideo({
        ...dataDrag,
        videoElement: {
          ...dataDrag.videoElement,
          x: contentPt.x,
          y: contentPt.y,
          sceneId: baseSceneId,
        },
      });
    } else if (dataDrag.type === "IFRAME" && dataDrag.webResource) {
      addWeb({
        ...dataDrag,
        webResource: {
          ...dataDrag.webResource,
          x: contentPt.x,
          y: contentPt.y,
          sceneId: baseSceneId,
        },
      });
    } else if (dataDrag.type === "INPUT" && dataDrag.input) {
      addInput({
        ...dataDrag,
        input: { ...dataDrag.input, x: contentPt.x, y: contentPt.y, sceneId: baseSceneId },
      });
    } else if ((dataDrag.type === "TEXT" || dataDrag.type === "RSS") && dataDrag.textItem) {
      addText({
        ...dataDrag,
        textItem: { ...dataDrag.textItem, x: contentPt.x, y: contentPt.y, sceneId: baseSceneId },
      });
    } else if (dataDrag.type === "STREAM" && dataDrag.videoElement) {
      addVideo({
        ...dataDrag,
        videoElement: {
          ...dataDrag.videoElement,
          x: contentPt.x,
          y: contentPt.y,
          sceneId: baseSceneId,
        },
      });
    }
  };

  // --- helper: تبدیل مختصات client به مختصات استیج
  function clientToStagePoint(stage, evtOrReactEvent) {
    const ev = evtOrReactEvent?.nativeEvent ?? evtOrReactEvent;
    const rect = stage.container().getBoundingClientRect();
    const clientX = ev?.clientX ?? 0;
    const clientY = ev?.clientY ?? 0;

    // نقطه در مختصات «کانتینر»
    const point = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    // اعمال اسکیل و ترنسلیت استیج
    const transform = stage.getAbsoluteTransform().copy();
    const inv = transform.invert();
    return inv.point(point);
  }

  const getSelectedScene = () => {
    let scn = scenes.find((scene) => scene.id === selectedScene);
    return scn;
  };

  function generateBlobURL(newBaseURL, videoName) {
    const newBlobURL = `${newBaseURL}/uploads/${videoName}.mp4`;

    return newBlobURL;
  }

  function generateBlobImageURL(newBaseURL, videoName) {
    const newBlobURL = `${newBaseURL}/${videoName}.mp4`;

    return newBlobURL;
  }

  function trimPrefix(str, prefix) {
    if (str.startsWith(prefix)) {
      return str.slice(prefix.length);
    }
    return str;
  }

  function contentGenerator(type, item) {
    let endObj;
    if (type === "INPUT") {
      endObj = { name: item.name ?? "INPUT", externalId: item.externalId, metadata: item.metadata };
    } else if (type === "IMAGE") {
      const imageURL = `${urlRef.current}/${item.media?.content || item.content}`;
      const img = new Image();
      img.src = imageURL;
      const imageName = "image" + counterImages++;
      endObj = {
        name: item.name ?? imageName,
        imageElement: img,
        externalId: item.externalId,
      };
    } else if (type === "VIDEO") {
      const video = document.createElement("video");
      video.src = `${urlRef.current}/${item.media?.content || item.content}`;
      const videoName = "video" + counterVideos++;
      video.setAttribute("name", videoName);
      video.setAttribute("id", item.id);
      endObj = {
        videoElement: video,
        name: item.name ?? videoName,
        externalId: item.externalId,
      };
    } else if (type === "IFRAME") {
      endObj = { externalId: item.externalId };
    } else if (type === "TEXT") {
      endObj = { externalId: item.externalId, metadata: item.metadata };
    } else if (type === "RSS") {
      endObj = { externalId: item.externalId, metadata: item.metadata };
    } else if (type === "STREAM") {
      const video = document.createElement("video");
      video.src = `${item.media?.content}`;
      const videoName = "video" + counterVideos++;
      video.setAttribute("name", videoName);
      video.setAttribute("id", item.id);
      endObj = {
        videoElement: video,
        name: item.name ?? videoName,
        externalId: item.externalId,
      };
    }
    endObj = {
      ...endObj,
      id: item.id,
      sceneId: item.sceneId,
      type,
      content: item.media?.content || item.content,
      width: item.width,
      height: item.height,
      x: item.x,
      y: item.y,
      z: item.z,
      name: item.name ?? "",
      rotation: parseInt(item.rotation) || 0,
    };

    return { endObj, type };
  }

  // برای دیباگ بهتر، این را به context اضافه کنید
  const logRealTimeEvent = (type, id, data = {}) => {
    console.log(`🎯 ${type}: ${id}`, {
      scene: selectedSceneRef.current,
      realTime: isRealTimeRef.current,
      sourcesCount: sourcesRef.current.length,
      ...data,
    });
  };

  const removeSource = (id) => {
    const scene = scenesRef.current.find((s) => s.id === selectedSceneRef.current);
    if (!scene) {
      console.log("❌ Scene not found for removal");
      return;
    }

    // حذف از Konva
    const toRemove = scene.layer.find(`#${id}`);
    if (toRemove.length > 0) {
      toRemove.forEach((g) => g.destroy());
      scene.layer.batchDraw();
      console.log("✅ Removed from Konva:", id);
    } else {
      console.log("⚠️ Not found in Konva:", id);
    }

    // حذف از state
    setSources((prev) => {
      const newSources = prev.filter((item) => item.externalId !== id);
      console.log("✅ Removed from state:", id, "Remaining:", newSources.length);
      return newSources;
    });
  };

  const updateSourceRealTime = (id, attrs) => {
    const scene = scenesRef.current.find(
      (s) => s.id === (attrs?.sceneId ?? selectedSceneRef.current)
    );
    if (!scene) return;

    const group = scene.layer.findOne(`#${id}`);
    if (!group) return;

    // موقعیت
    if (attrs.x !== undefined || attrs.y !== undefined) {
      group.position({
        x: attrs.x !== undefined ? attrs.x : group.x(),
        y: attrs.y !== undefined ? attrs.y : group.y(),
      });
    }

    // پیدا کردن نود محتوایی بر اساس نوع
    const contentNode = group.findOne("Image") || group.findOne("Rect") || group.findOne("Text");

    if (contentNode && (attrs.width !== undefined || attrs.height !== undefined)) {
      if (attrs.width !== undefined) contentNode.width(attrs.width);
      if (attrs.height !== undefined) contentNode.height(attrs.height);
      group.scale({ x: 1, y: 1 });
    }

    // چرخش
    if (attrs.rotation !== undefined) {
      group.rotation(attrs.rotation);
    }

    // z-index (لایه‌بندی)
    if (attrs.z !== undefined) {
      group.remove();
      const children = scene.layer.getChildren();
      const insertIndex = children.findIndex((child) => {
        const childZ = sourcesRef.current.find((s) => s.externalId === child.id())?.z ?? 0;
        return childZ <= attrs.z;
      });

      if (insertIndex === -1) {
        scene.layer.add(group);
      } else {
        scene.layer.add(group);
        group.moveToBottom();
        for (let i = 0; i < insertIndex; i++) {
          group.moveUp();
        }
      }
    }

    // مدیریت متن و زیرنویس
    const textNode = group.findOne("Text") || group.findOne(".marqueeInner Text");
    if (textNode) {
      // محتوای متن
      if (attrs.content !== undefined) {
        textNode.text(attrs.content);

        // اگر زیرنویس فعال است، ری‌استارت کن
        const isMarquee = !!group.getAttr("_marquee");
        if (isMarquee) {
          const cfg = group.getAttr("_marqueeCfg");
          if (cfg) {
            stopMarquee(group);
            setTimeout(() => {
              startMarquee(group, textNode, cfg);
            }, 10);
          }
        }
      }

      // استایل متن
      if (attrs.metadata?.style) {
        const style = attrs.metadata.style;
        if (style.fontSize !== undefined) textNode.fontSize(style.fontSize);
        if (style.color !== undefined) textNode.fill(style.color);
        if (style.align !== undefined) textNode.align(style.align);
        if (style.dir !== undefined && typeof textNode.direction === "function") {
          textNode.direction(style.dir);
        }
      }

      // مدیریت زیرنویس (Marquee)
      if (attrs.metadata?.marquee !== undefined) {
        const marqueeConfig = attrs.metadata.marquee;

        if (marqueeConfig.enabled) {
          // فعال کردن زیرنویس
          const cfg = {
            width: attrs.width || 400,
            height: attrs.height || 50,
            speed: marqueeConfig.speed || 80,
            dir: marqueeConfig.scrollDirection || "rtl",
            bg: attrs.metadata?.bgColor || "#000000",
          };
          startMarquee(group, textNode, cfg);
        } else {
          // غیرفعال کردن زیرنویس
          stopMarquee(group);
        }
      }

      // رنگ پس‌زمینه
      if (attrs.metadata?.bgColor !== undefined) {
        const bgRect = group.findOne(".marqueeBG") || group.findOne("Rect");
        if (bgRect) {
          bgRect.fill(attrs.metadata.bgColor);
        }
      }
    }

    // نام
    if (attrs.name !== undefined) {
      const nameTextNode = group.findOne("Text");
      if (nameTextNode) {
        nameTextNode.text(attrs.name);
      }
    }

    scene.layer.batchDraw();

    // به‌روزرسانی state
    setSources((prev) => prev.map((src) => (src.externalId === id ? { ...src, ...attrs } : src)));
  };

  const handleSourceEvent = useCallback(({ action, payload, id }) => {
    // if (!sourcesRef.current) return;

    if (isRealTimeRef.current) {
      const getScene = () => scenesRef.current.find((s) => s.id === selectedSceneRef.current);
      const scene = getScene();
      if (!scene || !scene.layer) return;

      const exist = sourcesRef.current.find((item) => item.externalId == id);

      switch (action) {
        case "add": {
          const existingNodes = scene.layer.find(`#${id}`);
          existingNodes.forEach((node) => node.destroy());
          scene.layer.batchDraw();

          if (!exist) return;

          const { endObj, type } = contentGenerator(payload.type || payload.media?.type, payload);
          console.log("🟢 Real-time ADD:", type, id);

          const getSelected = () => getScene();

          if (type === "VIDEO" || type === "STREAM") {
            addVideo({
              videoElement: endObj,
              mode: false,
              getSelectedScene: getSelected,
              setSources,
              sendOperation,
              url: urlRef.current,
              loopVideos,
            });
          } else if (type === "IMAGE") {
            addImage({
              img: endObj,
              mode: false,
              getSelectedScene: getSelected,
              setSources,
              sendOperation,
              url: urlRef.current,
              generateBlobImageURL,
            });
          } else if (type === "INPUT") {
            addInput({
              input: endObj,
              mode: false,
              getSelectedScene: getSelected,
              setSources,
              sendOperation,
            });
          } else if (type === "IFRAME") {
            addWeb({
              webResource: endObj,
              mode: false,
              getSelectedScene: getSelected,
              setSources,
              sendOperation,
            });
          } else if (type === "TEXT" || type === "RSS") {
            addText({
              textItem: endObj,
              mode: false,
              getSelectedScene: getSelected,
              setSources,
              sendOperation,
            });
          }
          break;
        }

        case "remove":
          console.log("🔴 Real-time REMOVE:", id);
          removeSource(id);
          break;

        case "update":
        case "move":
        case "resize":
          console.log("🟡 Real-time UPDATE:", action, id, payload);
          updateSourceRealTime(id, payload);
          break;

        case "rotate":
          console.log("🟠 Real-time ROTATE:", id, payload);
          updateSourceRealTime(id, { rotation: payload.rotation });
          break;

        case "play":
          console.log("▶️ Real-time PLAY:", id);
          playVideo({ id, sources });
          break;

        case "pause":
          console.log("⏸️ Real-time PAUSE:", id);
          pauseVideo({ id, sources });
          break;

        case "loop":
          console.log("🔁 Real-time LOOP:", id);
          toggleLoopVideo({ id, sources });
          break;

        case "fit":
          console.log("📐 Real-time FIT:", id, payload);
          fitToMonitors({
            uniqId: id,
            selectedMonitors: payload?.selectedMonitors || [],
            getSelectedScene: getScene,
            allDataMonitors,
            sendOperation,
            id,
          });
          break;

        // عملیات جدید برای متن و زیرنویس
        case "marquee-toggle":
          console.log("📜 Real-time MARQUEE TOGGLE:", id, payload);
          const marqueeGroup = scene.layer.findOne(`#${id}`);
          if (marqueeGroup) {
            const textNode =
              marqueeGroup.findOne("Text") || marqueeGroup.findOne(".marqueeInner Text");
            if (textNode) {
              const isMarquee = !!marqueeGroup.getAttr("_marquee");
              if (isMarquee) {
                stopMarquee(marqueeGroup);
              } else {
                startMarquee(marqueeGroup, textNode, payload);
              }
            }
          }
          break;

        case "text-edit":
          console.log("✏️ Real-time TEXT EDIT:", id, payload);
          const editGroup = scene.layer.findOne(`#${id}`);
          if (editGroup) {
            const textNode = editGroup.findOne("Text") || editGroup.findOne(".marqueeInner Text");
            if (textNode) {
              textNode.text(payload.content);
              if (payload.style) {
                if (payload.style.fontSize) textNode.fontSize(payload.style.fontSize);
                if (payload.style.color) textNode.fill(payload.style.color);
                if (payload.style.align) textNode.align(payload.style.align);
              }
              scene.layer.batchDraw();
            }
          }
          break;

        case "reset":
          console.log("🔄 Real-time RESET");
          break;

        default:
          console.log(`❓ Unsupported action ${action}:${id}`, payload);
          break;
      }
    } else {
      console.log("📦 Buffering operation:", action, id);
      setIsChangeRealTime(ChangeRT.PENDING);
      setDataChangeRealTime((prev) => [...prev, { action, payload, id }]);
    }
  }, []);

  useEffect(() => {
    if (isRealTime) return;
    if (isChangeRealTime === ChangeRT.DONE && dataChangeRealTime.length) {
      const getScene = () => scenesRef.current.find((s) => s.id === selectedSceneRef.current);
      const scene = getScene();
      if (!scene || !scene.layer) return;
      for (const { action, payload, id } of dataChangeRealTime) {
        switch (action) {
          case "add": {
            const { endObj, type } = contentGenerator(payload.type, payload);
            console.log("T2");

            const getSelected = () => getScene();
            if (type === "VIDEO") {
              addVideo({
                videoElement: endObj,
                mode: false,
                getSelectedScene: getSelected,
                setSources,
                sendOperation,
                url: urlRef.current,
                loopVideos,
              });
            } else if (type === "IMAGE") {
              addImage({
                img: endObj,
                mode: false,
                getSelectedScene: getSelected,
                setSources,
                sendOperation,
                url: urlRef.current,
                generateBlobImageURL,
              });
            } else if (type === "INPUT") {
              addInput({
                input: endObj,
                mode: false,
                getSelectedScene: getSelected,
                setSources,
                sendOperation,
              });
            } else if (type === "IFRAME") {
              addWeb({
                webResource: endObj,
                mode: false,
                getSelectedScene: getSelected,
                setSources,
                sendOperation,
              });
            } else if (type === "TEXT") {
              addText({
                textItem: endObj,
                mode: false,
                getSelectedScene: getSelected,
                setSources,
                sendOperation,
              });
            } else if (type === "RSS") {
              // console.log("endObj::: ", endObj);
              addText({
                textItem: endObj,
                mode: false,
                getSelectedScene: getSelected,
                setSources,
                sendOperation,
              });
            } else if (type === "STREAM") {
              addVideo({
                videoElement: endObj,
                mode: false,
                getSelectedScene: getSelected,
                setSources,
                sendOperation,
                url: urlRef.current,
                loopVideos,
              });
            }
            break;
          }
          case "remove":
            removeSource(id);
            break;
          case "update":
          case "move":
          case "resize":
            updateSourceRealTime(id, payload);
            break;
          case "rotate":
            updateSourceRealTime(id, payload);
            break;
          case "play":
            playVideo({ id, sources });
            break;
          case "pause":
            pauseVideo({ id, sources });
            break;
          case "loop":
            toggleLoopVideo({ id, sources });
            break;
          case "fit":
            fitToMonitors({
              uniqId: id,
              selectedMonitors: payload?.selectedMonitors || [],
              getSelectedScene: getScene,
              allDataMonitors,
              sendOperation,
              id,
            });
            break;
          case "reset":
            console.log("Resetting all sources and the entire driver canvas");
            break;
          default:
            console.log(`Unsupported action ${action}:${id}`, payload);
            break;
        }
        setDataChangeRealTime([]);
        setIsChangeRealTime(ChangeRT.CANCEL);
      }
    } else if (isChangeRealTime === ChangeRT.CANCEL) {
      // رد کردن تغییرات
      setDataChangeRealTime([]);
    }
  }, [isChangeRealTime, dataChangeRealTime, isRealTime]);

  useEffect(() => {
    isRealTimeRef.current = isRealTime;
  }, [isRealTime]);

  function generateScene(data, sceneData) {
    data.forEach((item) => {
      let { endObj, type } = contentGenerator(item.media?.type, item);

      //Just convert to fuction
      const convertToFunction = () => {
        return sceneData;
      };
      if (type === "IMAGE") {
        addImage({
          img: endObj,
          mode: false,
          getSelectedScene: convertToFunction,
          setSources,
          sendOperation,
          url: urlRef.current,
          generateBlobImageURL,
        });
      } else if (type === "INPUT") {
        addInput({
          input: endObj,
          mode: false,
          getSelectedScene: convertToFunction,
          setSources,
          sendOperation,
        });
      } else if (type === "VIDEO") {
        addVideo({
          videoElement: endObj,
          mode: false,
          getSelectedScene: convertToFunction,
          setSources,
          sendOperation,
          url: urlRef.current,
          loopVideos,
        });
      } else if (type == "IFRAME") {
        addWeb({
          webResource: endObj,
          mode: false,
          getSelectedScene: convertToFunction,
          setSources,
          sendOperation,
        });
      } else if (type === "TEXT") {
        addText({
          textItem: endObj,
          mode: false,
          getSelectedScene: convertToFunction,
          setSources,
          sendOperation,
        });
      } else if (type === "RSS") {
        addText({
          textItem: endObj,
          mode: false,
          getSelectedScene: convertToFunction,
          setSources,
          sendOperation,
        });
      } else if (type === "STREAM") {
        addVideo({
          videoElement: endObj,
          mode: false,
          getSelectedScene: convertToFunction,
          setSources,
          sendOperation,
          url: urlRef.current,
          loopVideos,
        });
      }
    });
  }

  function fitStageToMonitors({ stage, monitors, padding = 40, clampTo1 = true }) {
    if (!stage || !monitors?.length) return;

    // 0) اندازه‌ی واقعی استیج را از DOM بگیر (گاهی stage.width/height قدیمی است)
    const rect = stage.container().getBoundingClientRect();
    const viewW = Math.max(1, rect.width);
    const viewH = Math.max(1, rect.height);
    if (
      Math.round(stage.width()) !== Math.round(viewW) ||
      Math.round(stage.height()) !== Math.round(viewH)
    ) {
      stage.size({ width: viewW, height: viewH });
    }

    // 1) BBox کل مانیتورها
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const m of monitors) {
      if (m.x < minX) minX = m.x;
      if (m.y < minY) minY = m.y;
      if (m.x + m.width > maxX) maxX = m.x + m.width;
      if (m.y + m.height > maxY) maxY = m.y + m.height;
    }
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);

    // 2) مقیاس لازم برای جا شدن داخل "inner view" با درنظر گرفتن padding از هر طرف
    const innerW = Math.max(1, viewW - 2 * padding);
    const innerH = Math.max(1, viewH - 2 * padding);
    let scale = Math.min(innerW / contentW, innerH / contentH);
    if (clampTo1) scale = Math.min(scale, 1); // بزرگ‌نمایی بیش از ۱ نکن

    // 3) مرکز محتوا و مرکز ویو
    const contentCenter = { x: (minX + contentW / 2) * scale, y: (minY + contentH / 2) * scale };
    const viewCenter = { x: viewW / 2, y: viewH / 2 };

    // 4) اعمال اسکیل و جابه‌جایی برای هم‌مرکز کردن
    stage.scale({ x: scale, y: scale });
    stage.position({
      x: viewCenter.x - contentCenter.x,
      y: viewCenter.y - contentCenter.y,
    });

    stage.batchDraw();
  }

  // const filteredScenes = scenes.filter((scene) =>
  //   collections.find((item) => item.id == selectedCollection).scenes.includes(scene.id)
  // );

  const createNewStage = (isLayer) => {
    const stage = new Konva.Stage({
      container: `containerKonva-${selectedScene}`,
      width: window.innerWidth,
      height: window.innerHeight,
      draggable: true,
    });
    const newLayer = new Konva.Layer();

    var scaleBy = 1.04;
    stage.on("wheel", (e) => {
      e.evt.preventDefault();
      var oldScale = stage.scaleX();
      var pointer = stage.getPointerPosition();
      var mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      let direction = e.evt.deltaY > 0 ? -1 : 1;
      if (e.evt.ctrlKey) direction = -direction;
      var newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      stage.scale({ x: newScale, y: newScale });
      var newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      stage.position(newPos);
      localStorage.setItem("wheelX", e.currentTarget.attrs.scaleX);
      localStorage.setItem("wheelY", e.currentTarget.attrs.scaleY);
      localStorage.setItem("positionX", e.currentTarget.attrs.x);
      localStorage.setItem("positionY", e.currentTarget.attrs.y);
    });
    let x = eval(window.innerWidth / 2);
    let y = eval(window.innerHeight / 2);
    let oldX = localStorage.getItem("wheelX");
    let oldY = localStorage.getItem("wheelY");
    let oldPX = localStorage.getItem("positionX");
    let oldPY = localStorage.getItem("positionY");

    stage.position({ x: x, y: y });
    stage.scale({ x: 0.35, y: 0.35 });
    // stage.position({ x: parseInt(oldX) ?? 380, y: parseInt(oldY) ?? 200 });
    // stage.scale({ x: parseInt(oldPX) ?? 0.09, y: parseInt(oldPY) ?? 0.09 });

    stage.add(isLayer ?? newLayer);
    motherLayer = newLayer;
    motherStage = stage;
    return { stage, layer: isLayer ?? newLayer };
  };
  const sendOperation = (action, payload) => {
    console.log("payload::: ", payload);
    console.log("action::: ", action);
    if (connectionModeRef.current) {
      if (socketRef.current) {
        socketRef.current?.emit(action, payload);
      } else {
        socket?.emit(action, payload);
      }
      // api.createSource(url
      // , payload.payload);
    } else {
      console.log(pendingOperations);

      setPendingOperation((prev) => [...prev, { action, payload }]);
    }
  };

  const addTempMonitorToScreen = () => {
    if (!connectionMode || !socketRef.current) {
      console.log(
        "%cCONNECTION DOWN",
        "color: red; font-weight: bold; font-size: 20px; background: yellow; padding: 5px; border: 2px solid red; border-radius: 5px;"
      );
      if (scenesRef.current.length <= 0) {
        setScenes([
          {
            name: "صحنه پیش فرض",
            id: 1,
            resources: [],
            stageData: null,
            layer: new Konva.Layer(),
          },
        ]);
        const result = addMonitorsToScenes({
          jsonData: videoWalls,
          scenes: [
            {
              name: "صحنه پیش فرض",
              id: 1,
              resources: [],
              stageData: null,
              layer: new Konva.Layer(),
            },
          ],
          setScenes,
        });
        setScenes(result);
        localStorage.setItem("sceneId", 1);
        setSelectedScene(1);
      }
    }
  };

  function getGridCellAtPointer(layer, pointer) {
    if (!layer || !pointer) return null;

    // شکلی که زیر پوینتره
    const target = layer.getStage().getIntersection(pointer);
    if (!target) return null;

    // رفتن به بالا تا برسیم به گروپ مانیتور
    let group = target.getParent();
    while (
      group &&
      !(group.getClassName() === "Group" && String(group.id()).startsWith("monitor-group-"))
    ) {
      group = group.getParent();
    }
    if (!group) return null;

    const gridMeta = group.getAttr("gridMeta");
    if (!gridMeta?.rows || !gridMeta?.cols) return null;

    const rect = group.findOne("Rect");
    if (!rect) return null;

    // تبدیل مختصات pointer به لوکال مانیتور
    const abs = group.getAbsoluteTransform().copy();
    const inv = abs.invert();

    const local = inv.point(pointer); // pointer در مختصات خود مانیتور
    const { rows, cols } = gridMeta;
    const cellW = rect.width() / cols;
    const cellH = rect.height() / rows;

    // ایندکس سطر/ستون
    const ci = Math.floor(local.x / cellW);
    const ri = Math.floor(local.y / cellH);
    if (ci < 0 || ci >= cols || ri < 0 || ri >= rows) return null;

    const cellLocal = { x: ci * cellW, y: ri * cellH, width: cellW, height: cellH };

    const cellTLAbs = abs.point({ x: cellLocal.x, y: cellLocal.y });
    const cellBRAbs = abs.point({
      x: cellLocal.x + cellLocal.width,
      y: cellLocal.y + cellLocal.height,
    });

    return {
      monitorGroup: group,
      rows,
      cols,
      rowIndex: ri,
      colIndex: ci,
      // مستطیل سلول در مختصات لایه/استیج:
      rect: {
        x: cellTLAbs.x,
        y: cellTLAbs.y,
        width: cellBRAbs.x - cellTLAbs.x,
        height: cellBRAbs.y - cellTLAbs.y,
      },
    };
  }

  function fitGroupToRect(sourceGroup, cellRect) {
    if (!sourceGroup || !cellRect) return;

    // جابه‌جایی خود گروه
    sourceGroup.position({ x: cellRect.x, y: cellRect.y });

    // تغییر اندازه نود محتوایی داخل گروه (Image/Rect/Video-Rect/...)
    const contentNode =
      sourceGroup.findOne(".object") || sourceGroup.findOne("Image") || sourceGroup.findOne("Rect");

    if (contentNode) {
      contentNode.width(cellRect.width);
      contentNode.height(cellRect.height);
    }

    // هرگونه scale قبلی رو خنثی کن
    sourceGroup.scale({ x: 1, y: 1 });
  }

  useEffect(() => {
    const hostURL = window.location.hostname;
    if (!localStorage.getItem("host")) {
      if (localStorage.getItem("host")) {
        localStorage.setItem("host", config.host);
      } else {
        localStorage.setItem("host", hostURL);
      }
      localStorage.setItem("port", config.port);
    } else {
      host = localStorage.getItem("host");
      localStorage.setItem("port", 4000);
      port = localStorage.getItem("port") || 4000;
    }

    // PRODUCTION_MODE
    // host = hostURL || localStorage.setItem("host", hostURL);
    // port = 4000;
    const u = `http://${host}:${port}`;
    setUrl(u);
    urlRef.current = u;
  }, [config.host, config.port, localStorage.getItem("host"), localStorage.getItem("port")]);

  useEffect(() => {
    scenesRef.current = scenes;
  }, [scenes]);

  useEffect(() => {
    selectedSceneRef.current = selectedScene;

    async function sceneINDEX() {
      if (!getSelectedScene()?.id) return;
      const newScene = await api.getSceneById(`http://${host}:${port}`, getSelectedScene()?.id);
      // console.log('fetchDataScene[0].id::: ', );
      const integratedSource = newScene?.sources
        .slice() // کپیِ آرایه تا منابع اصلی تغییر نکنند
        .sort((a, b) => {
          // پشتیبانی از چند نام فیلد (z یا zIndex) و تبدیل به عدد امن
          const az = Number(a.z ?? a.zIndex ?? 0);
          const bz = Number(b.z ?? b.zIndex ?? 0);

          // نزولی: مقدار بزرگتر z اول نمایش داده می‌شود (روی لایه جلوتر)
          return bz - az;
        });
      if (integratedSource)
        integratedSource.forEach((item) => {
          const node = getSelectedScene()?.layer.findOne(`#${item.externalId}`);
          if (item.z > 0) {
            for (let index = 0; index < item.z; index++) {
              node?.moveUp();
            }
          } else {
            for (let index = 0; index > item.z; index--) {
              node?.moveDown();
            }
          }
        });
    }

    sceneINDEX();
  }, [selectedScene]);

  useEffect(() => {
    sourcesRef.current = sources;
  }, [sources]);

  useEffect(() => {
    if (!url) {
      return;
    }
    async function initializeSocket() {
      try {
        if (!connectionMode) {
          addTempMonitorToScreen();
          return;
        }

        const response = await axios.get("/config.json");
        const data = response.data;
        if (data.host) host = localStorage.getItem("host") ?? data.host;
        if (data.port) port = localStorage.getItem("port") ?? data.port;

        const s = io(`http://${host}:${port}`);
        socketRef.current = s;
        setSocket(s);

        // s.on("source", handleSourceEvent);

        s.on("connect", () => {
          console.log("✅ Socket connected");
          setConnecting(true);

          if (pendingOperations.length > 0) {
            pendingOperations.forEach((op) => s.emit(op.action, op.payload));
            setPendingOperation([]);
          }
        });

        s.on("disconnect", () => {
          setConnecting(false);
        });

        if (!s.connected) addTempMonitorToScreen();

        s.on("connect", () => {
          console.log("✅ Socket connected");
        });
        s.on("disconnect", () => {
          setConnecting(false);
        });

        s.on("init", async (data) => {
          setIsLoading(false);
          console.log(
            "%c❇️ CONNECTED INIT DATA",
            "color: green; font-weight: bold; font-size: 20px; background: limegreen; padding: 5px; border: 2px solid green; border-radius: 5px;",
            data
          );

          if (data.activeProgram >= 0) {
            setActiveProgram(data.activeProgram);
          }

          if (flagOperations) {
            setFlagOperation(false);
            return;
          }

          if (data.inputs) {
            const inputs = data.inputs.map((item) => ({
              ...item,
              id: item?.id,
              deviceId: item?.content,
              width: item?.width,
              height: item?.height,
              name: item?.name,
              type: item?.type,
            }));
            setInputs(inputs);
            // setResources([inputs, ...resources]);
          }

          // if (data.mosaicDisplays) {
          //   const displays = data.mosaicDisplays.map((monitor, index) => {
          //     return {
          //       ...monitor,
          //       // numberMonitor: parseInt(monitor.index), // if software have error return this parametr
          //       id: monitor.id,
          //       name: monitor.name,
          //       x: monitor.x,
          //       y: monitor.y,
          //       width: monitor.width,
          //       height: monitor.height,
          //       connected: monitor.connected,
          //       monitorUniqId: monitor.monitorUniqId,
          //       monitorNumber: monitor.monitorNumber,
          //     };
          //   });

          //   await initData();
          //   setVideoWalls(displays);

          //   addMonitorsToScenes({ jsonData: displays, scenes: fetchDataScene, setScenes });
          //   const newScene = await api.getSceneById(`http://${host}:${port}`, fetchDataScene[0].id);
          //   console.log("newScene.sources::: ", newScene.sources);
          //   setSources(newScene.sources);
          //   generateScene(newScene.sources, fetchDataScene[0]);
          // }

          if (data.displays) {
            const displays = data.displays.map((monitor, index) => {
              return {
                ...monitor,
                // numberMonitor: parseInt(monitor.index), // if software have error return this parametr
                id: monitor.id,
                name: monitor.name,
                x: monitor.x,
                y: monitor.y,
                width: monitor.width,
                height: monitor.height,
                connected: monitor.connected,
              };
            });

            await initData();
            setVideoWalls(displays);

            const savedScene = parseInt(localStorage.getItem("sceneId"));
            let checkSavedScene = savedScene ?? fetchDataScene[0].id;

            addMonitorsToScenes({ jsonData: displays, scenes: fetchDataScene, setScenes });

            const newScene = await api.getSceneById(`http://${host}:${port}`, checkSavedScene);
            const integratedSource = newScene.sources
              .filter((s) => s.sceneId == checkSavedScene)
              .slice()
              .sort((a, b) => {
                const az = Number(a.z ?? a.zIndex ?? 0);
                const bz = Number(b.z ?? b.zIndex ?? 0);

                return bz - az;
              });
            setSources(integratedSource);
            const sceneNeedToGenerating = fetchDataScene.find((item) => item.id == checkSavedScene);
            generateScene(integratedSource, sceneNeedToGenerating);
            setMonitorConnection(true);
            requestAnimationFrame(() => {
              const scn = scenesRef.current.find((s) => s.id === selectedSceneRef.current);

              if (scn?.stageData) {
                fitStageToMonitors({
                  stage: scn.stageData,
                  monitors: displays,
                });
              }
            });
          }

          // if (data.sources && false) {
          //   const sources = data.sources.map((item) => {
          //     let type;
          //     let content;
          //     let endObj = {};
          //     let fixedContent = item.source?.replace(/\\/g, "/");

          //     if (item.source?.startsWith("input:")) {
          //       type = "input";
          //       content = trimPrefix(item.source, "input:");
          //       endObj = { name: item.name ?? "input", deviceId: content };
          //     } else if (item.source?.startsWith("image:")) {
          //       type = "image";
          //       content = trimPrefix(item.source, "image:");
          //       const imageURL = content;
          //       let img = new Image();
          //       img.src = imageURL;
          //       let imageName = "image" + counterImages++;
          //       endObj = {
          //         name: item.name ?? imageName,
          //         imageElement: img,
          //       };
          //     } else if (item.source?.startsWith("video:")) {
          //       type = "video";
          //       content = trimPrefix(item.source, "video:");
          //       const video = document.createElement("video");
          //       video.src = content;
          //       const videoName = "video" + counterVideos++;
          //       video.setAttribute("name", videoName);
          //       video.setAttribute("id", item.id);
          //       endObj = {
          //         videoElement: video,
          //         name: item.name ?? videoName,
          //       };
          //     } else if (item.source.startsWith("iframe:")) {
          //       type = "iframe";
          //       content = trimPrefix(item.source, "iframe:");
          //     }

          //     endObj = {
          //       ...endObj,
          //       id: item.id,
          //       sceneId: selectedScene,
          //       type,
          //       content: type === "input" ? content : fixedContent,
          //       width: item.width,
          //       height: item.height,
          //       x: item.x,
          //       y: item.y,
          //       name: item.name ?? "",
          //       rotation: parseInt(item.rotation),
          //     };

          //     if (type === "image") {
          //       addImage({
          //         img: endObj,
          //         mode: false,
          //         getSelectedScene,
          //         setSources,
          //         sendOperation,
          //         url,
          //         generateBlobImageURL,
          //       });
          //     } else if (type === "input") {
          //       addInput({
          //         input: endObj,
          //         mode: false,
          //         getSelectedScene,
          //         setSources,
          //         sendOperation,
          //       });
          //     } else if (type === "video") {
          //       addVideo({
          //         videoElement: endObj,
          //         mode: false,
          //         getSelectedScene,
          //         setSources,
          //         sendOperation,
          //         url,
          //         loopVideos,
          //       });
          //       // addRectangle();
          //     } else if (type == "iframe") {
          //       addWeb({ webResource: endObj, mode: false, getSelectedScene, setSources });
          //     }
          //     return endObj;
          //   });
          //   setSources(sources);
          // }

          //resources
          if (data.media) {
            const newResource = data.media
              .map((item) => {
                let type;
                let url;
                let endObj = {};
                if (item.type === "INPUT") {
                  return null;
                }
                if (item.type == "IMAGE") {
                  url = `http://${host}:${port}/${item.content}`;
                  type = "IMAGE";
                  let img = new Image();
                  img.src = url;
                  let imageName = "imageBase" + counterImages++;
                  endObj = {
                    imageElement: img,
                  };
                } else if (item.type == "VIDEO") {
                  type = "VIDEO";
                  url = `http://${host}:${port}/${item.content}`;
                  const video = document.createElement("video");
                  video.src = url;
                  const videoName = "videoBase" + counterVideos++;
                  video.setAttribute("name", videoName);
                  endObj = {
                    videoElement: video,
                  };
                } else if (item.type == "IFRAME") {
                  type = "IFRAME";
                } else if (item.type == "TEXT") {
                  type = "TEXT";
                } else if (item.type == "RSS") {
                  type = "RSS";
                } else if (item.type == "STREAM") {
                  type = "STREAM";
                  url = `${item.content}`;
                  const video = document.createElement("video");
                  video.src = url;
                  const videoName = "videoBase" + counterVideos++;
                  video.setAttribute("name", videoName);
                  endObj = {
                    videoElement: video,
                  };
                }
                let dataOBJ = {
                  ...item,
                  name: item.name || "نامشخص",
                  type: type,
                  ...endObj,
                };

                return dataOBJ;
              })
              .filter((item) => item !== null);

            setResources(newResource);
            // updateSceneResources([...newResource, ...getSelectedScene().resources]);
          }
        });

        // s.on("currentScene", (e) => {
        //   console.log(e);
        // });

        // s.on("source", (e) => {
        //   console.log("incoming", e);
        //   // initializeSocket();
        // });

        s.on("update-cameras", (data) => {
          setInputs(data);
        });

        s.on("connect", () => {
          setConnecting(true);
        });

        const width = window.innerWidth;
        const height = window.innerHeight;
        const stage = new Konva.Stage({
          container: "containerKonva",
          width,
          height,
          draggable: true,
        });

        const layer = new Konva.Layer();
        stage.add(layer);

        anim = new Konva.Animation(() => {}, layer);

        layer.on("dragmove", function (e) {
          var absPos = e.target.absolutePosition();
          e.target.absolutePosition(absPos);

          var target = e.target;
          var targetRect = e.target.getClientRect();
          layer.children.forEach(function (group) {
            if (group === target) return;
            if (haveIntersection(group.getClientRect(), targetRect)) {
              if (group instanceof Konva.Group) {
                const shape = group.findOne(".fillShape");
                if (shape) {
                  shape.stroke("red");
                  let x = arrayCollisions.find((item) => item == shape.getAttr("id"));
                  if (!x) arrayCollisions.push(shape.getAttr("id"));
                }
              }
            } else {
              if (group instanceof Konva.Group) {
                const shape = group.findOne(".fillShape");
                if (shape) {
                  let x = arrayCollisions.find((item) => item == shape.getAttr("id"));
                  if (x) {
                    let y = arrayCollisions.indexOf(x);
                    if (y !== -1) arrayCollisions.splice(y, 1);
                  }
                  shape.stroke("white");
                }
              }
            }
          });

          // let searchIndexArray = e.target.children[0].getAttr("id");
        });

        layer.on("dragend", (e) => {
          layer.find(".guid-line").forEach((l) => l.destroy());
        });
      } catch (err) {
        console.warn("Failed to fetch config.json or initialize s", err);
      }
    }

    async function initData() {
      try {
        setIsLoading(true);
        const dataCol = await api.getPrograms(url);
        fetchDataColl = dataCol;
        setCollections(dataCol ?? []);
        setSelectedCollection(fetchDataColl[0]?.id);

        const dataSen = await api.getScenes(url);
        fetchDataScene =
          dataSen?.map((item) => ({
            name: item.name,
            id: item.id,
            resources: [],
            stageData: null,
            layer: new Konva.Layer(),
          })) ?? [];

        if (fetchDataScene.length >= 0) {
          setScenes(fetchDataScene);
        } else {
          setScenes({
            name: "صحنه پیش فرض",
            id: 0,
            resources: [],
            stageData: null,
            layer: new Konva.Layer(),
          });
        }
        const selectedScene = parseInt(localStorage.getItem("sceneId"));
        if (!selectedScene) localStorage.setItem("sceneId", fetchDataScene[0].id);
        setSelectedScene(selectedScene ?? fetchDataScene[0].id);
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    }

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.off("source", handleSourceEvent);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // if (getSelectedScene()?.stageData) getSelectedScene()?.stageData.destroy();
      // if (motherLayer) motherLayer.destroy();
    };
  }, [connectionMode, url]);

  useEffect(() => {
    const selectedScene = getSelectedScene();
    if (!selectedScene || selectedScene.stageData) return;
    const containerId = `containerKonva-${selectedScene.id}`;
    const container = document.getElementById(containerId);
    if (container) {
      const { stage, layer } = createNewStage(selectedScene.layer);
      if ((scenes.length > 1 || scenes.length === 0) && initSofware) {
        generateMonitorsForLayer(layer, videoWalls, setMonitorConnection);
      } else {
        setInitSoftwaew(true);
        anim = new Konva.Animation(() => {}, scenes[0].newLayer);
      }

      setScenes((prevScenes) =>
        prevScenes.map((scene) =>
          scene.id === selectedScene.id
            ? { ...scene, stageData: stage, layer: scene.layer ?? layer }
            : scene
        )
      );
    }
  }, [selectedScene, initSofware]);

  useEffect(() => {
    if (!collections.length) {
      return;
    }
    const selectedCollectionObj = collections.find((c) => c.id == selectedCollection);
    if (!selectedCollectionObj)
      return console.warn(
        "No collection selected!",
        selectedCollectionObj,
        selectedCollection,
        collections
      );
    const selectedCollectionScenes = selectedCollectionObj?.schedules?.map((s) => ({
      ...s.scene,
      resources: [],
      stageData: null,
      layer: new Konva.Layer(),
    }));
    setFilteredScenes(
      selectedCollectionScenes
      // scenes.filter((scene) =>
      //   collections.find((item) => item.id == selectedCollection)?.scenes?.includes(scene.id)
      // )
    );
  }, [collections, selectedCollection, flagReset]);

  useEffect(() => {
    const scn = getSelectedScene();
    if (!scn?.stageData) return;
    if (!videoWalls?.length) return;
    if (isRunFitStage) return;
    setIsRunFitStage(true);

    fitStageToMonitors({
      stage: scn.stageData,
      monitors: videoWalls,
    });
  }, [selectedScene, videoWalls, scenes]);

  useEffect(() => {
    const scn = getSelectedScene();

    if (!scn?.stageData) return;

    const onResize = () => {
      fitStageToMonitors({
        stage: scn.stageData,
        monitors: videoWalls,
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [selectedScene, videoWalls]);

  useEffect(() => {
    const scn = getSelectedScene();

    if (!scn?.stageData) return;

    fitStageToMonitors({
      stage: scn.stageData,
      monitors: videoWalls,
    });
  }, [selectedScene]);

  const [flag, setFlag] = useState(true);

  useEffect(() => {
    if (flag == false) return;

    const scn = getSelectedScene();
    if (!scn?.stageData) return;

    fitStageToMonitors({
      stage: scn.stageData,
      monitors: videoWalls,
    });

    if (sourcesRef.current.length <= 0) return;

    console.log("sourcesRef.current::: ", sourcesRef.current);

    // تاخیر برای اطمینان از لود کامل
    const timeoutId = setTimeout(() => {
      if (sourcesRef.current.length > 0) {
        const sceneSources = sourcesRef.current.filter((item) => item.sceneId === scn.id);

        // چک کن که همه المان‌ها در لایه موجود باشند
        const allNodesExist = sceneSources.every((item) => {
          const node = scn.layer.findOne(`#${item.externalId}`);
          return node !== null && node !== undefined;
        });

        if (!allNodesExist) {
          console.log("بعضی المان‌ها هنوز load نشدن، retry در 100ms...");
          // اگر همه المان‌ها موجود نبودن، دوباره تلاش کن
          setTimeout(() => {
            arrangeLayersByZIndex(scn);
          }, 100);
          return;
        }

        arrangeLayersByZIndex(scn);
      }

      setFlag(false);
    }, 50); // تاخیر اولیه

    return () => clearTimeout(timeoutId);
  }, [selectedSceneRef.current, sourcesRef.current, flag]);

  // تابع جداگانه برای مرتب‌سازی لایه‌ها
  const arrangeLayersByZIndex = (scn) => {
    const sceneSources = sourcesRef.current.filter((item) => item.sceneId === scn.id);
    const sortedSources = [...sceneSources].sort((a, b) => (b.z ?? 0) - (a.z ?? 0));

    console.log("Sorted sources by z-index:", sortedSources);

    // حرکت دادن المان‌ها بر اساس z-index
    sortedSources.forEach((item, index) => {
      const node = scn.layer.findOne(`#${item.externalId}`);
      if (node) {
        // ابتدا المان رو به بالاترین موقعیت ببر
        node.moveToTop();

        // سپس بر اساس موقعیتش در لیست مرتب‌شده، پایین‌تر ببر
        for (let i = 0; i < index; i++) {
          node.moveDown();
        }
      }
    });

    scn.layer.batchDraw();
    console.log("لایه‌ها با موفقیت مرتب شدند");
  };

  return (
    <MyContext.Provider
      value={{
        host,
        port,
        videoWalls,
        setVideoWalls,
        monitorConnection,
        setMonitorConnection,
        activeModal,
        setActiveModal,
        openModal,
        closeModal,
        isToggleLayout,
        setIsToggleLayout,
        isLoading,
        setIsLoading,
        miniLoad,
        setMiniLoad,
        isToggleVideoWall,
        setIsToggleVideoWall,
        loopVideos,
        setLoopVideos,
        darkMode,
        setDarkMode,
        connecting,
        setConnecting,
        connectionMode,
        setConnectionMode,
        inputs,
        setInputs,
        scenes,
        setScenes,
        scenesRef,
        videoWallsRef,
        connectionModeRef,
        selectedScene,
        setSelectedScene,
        isBottomControlsVisible,
        setIsBottomControlsVisible,
        editingSceneId,
        setEditingSceneId,
        collections,
        setCollections,
        selectedCollection,
        setSelectedCollection,
        sources,
        setSources,
        pendingOperations,
        setPendingOperation,
        flagOperations,
        setFlagOperation,
        resources,
        setResources,
        filteredScenes,
        arrayCollisions,
        counterImages,
        counterVideos,
        allDataMonitors,
        getSelectedScene,
        url,
        flagReset,
        setFlagReset,
        generateBlobURL,
        generateBlobImageURL,
        LayoutDropdownArrMonitor,
        MonitorLayoutModal,
        MonitorPositionEditor,
        updateKonvaMonitorPosition,
        updateMonitorPosition,

        isRightControlsVisible,
        setIsRightControlsVisible,

        addMonitorsToScenes,
        arrangeMForScenes,
        arrangeMonitors,
        generateMonitorsForLayer,

        addVideo,
        pauseVideo,
        playVideo,
        toggleLoopVideo,

        addScene,
        deleteScene,
        handleEditSceneName,
        deleteSourceFromScene,
        fitToMonitors,
        addImage,
        addInput,
        addText,
        addWeb,
        editWeb,
        IconMenuSidebar,
        createNewStage,
        sendOperation,
        socket,
        anim,
        trimPrefix,
        generateScene,

        activeSceneId,
        setActiveSceneId,
        activeSchedule,
        setActiveSchedule,
        activeProgram,
        setActiveProgram,

        setFilteredScenes,

        timeLine,
        setTimeLine,
        motherLayer,

        selectedSource,
        setSelectedSource,

        handleDragOver,
        handleDrop,

        dataDrag,
        setDataDrag,

        fitStageToMonitors,
        selectedSceneRef,

        isChangeRealTime,
        setIsChangeRealTime,
        isRealTime,
        setIsRealTime,
        contentGenerator,
        fetchRSSDescriptions,

        isMonitorOff,
      }}
    >
      {children}
    </MyContext.Provider>
  );
};

export const MCPC = ({ children }) => {
  return <MyContext.Consumer>{children}</MyContext.Consumer>;
};

export const useMyContext = () => {
  return useContext(MyContext);
};
