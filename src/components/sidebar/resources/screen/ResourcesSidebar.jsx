import React, { useState, useMemo } from "react";
import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip,
} from "@nextui-org/react";
import {
  FaPlay,
  FaPause,
  FaTrashAlt,
  FaCog,
  FaRemoveFormat,
  FaNetworkWired,
  FaStream,
  FaEdit,
  FaRss,
} from "react-icons/fa";
import { MdAddBox, MdDeleteForever, MdDeleteSweep } from "react-icons/md";
import { SketchPicker } from "react-color";
import Swal from "sweetalert2";
import { useMyContext } from "@/context/MyContext";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import api from "@/api/api";
import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import { addText } from "../../../konva/items/text/TextKonva";
import { FaImage, FaVideo, FaGlobe, FaFont } from "react-icons/fa";
import Hls from "hls.js";

const ResourcesSidebar = () => {
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [newName, setNewName] = useState("");
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [colorPickerResourceId, setColorPickerResourceId] = useState(null);
  const {
    videoWalls,
    darkMode,
    inputs,
    resources,
    addVideo,
    addImage,
    addInput,
    getSelectedScene,
    setSources,
    sendOperation,
    url,
    host,
    loopVideos,
    generateBlobImageURL,
    setResources,
    setMiniLoad,
    addWeb,
    collections,
    setCollections,
    sources,
    trimPrefix,
    dataDrag,
    setDataDrag,
  } = useMyContext();

  // cleanup function
  const cleanupVideoElement = (videoElement) => {
    try {
      if (!videoElement) return;
      if (videoElement._hls) {
        try {
          videoElement._hls.destroy();
        } catch (e) {
          console.warn(e);
        }
      }
      videoElement.pause && videoElement.pause();
      try {
        videoElement.removeAttribute("src");
        videoElement.src = "";
        videoElement.load && videoElement.load();
      } catch (e) {}
      // اگر از URL.createObjectURL استفاده کردی revoke کن
      if (videoElement._blobUrl) {
        URL.revokeObjectURL(videoElement._blobUrl);
      }
    } catch (err) {
      console.warn("cleanupVideoElement error", err);
    }
  };

  const MEDIA_SERVER_BASE = `http://${host}:4001`;
  // شروع کانورژن RTSP -> HLS
  const startRtspConversion = async (streamId, rtspUrl) => {
    try {
      // call start endpoint
      await axios.get(`${MEDIA_SERVER_BASE}/stream/start/${streamId}`, {
        params: { rtspUrl },
      });
      // ساده‌ترین شکل: poll تا status تغییر کنه به running/ready
      const waitForReady = async (maxAttempts = 30, interval = 1000) => {
        for (let i = 0; i < maxAttempts; i++) {
          const res = await axios.get(`${MEDIA_SERVER_BASE}/stream/status/${streamId}`);
          const status = res.status || res.data; // بستگی به پیلود سرور داره
          if (status === 200 || status) return true;
          await new Promise((r) => setTimeout(r, interval));
        }
        return false;
      };

      const ok = await waitForReady(30, 1000);
      return ok;
    } catch (err) {
      console.error("startRtspConversion error:", err);
      return false;
    }
  };

  const TYPE_META = {
    IMAGE: { label: "تصاویر", icon: FaImage, badge: "success" },
    VIDEO: { label: "ویدیوها", icon: FaVideo, badge: "primary" },
    IFRAME: { label: "صفحات وب", icon: FaGlobe, badge: "warning" },
    TEXT: { label: "متن‌ها", icon: FaFont, badge: "secondary" },
    STREAM: { label: "استریم‌ها", icon: FaStream, badge: "danger" },
    RSS: { label: "خبرخوان", icon: FaRss, badge: "default" },
  };

  const openRenameModal = (r) => {
    Swal.fire({
      title: "تغییر نام",
      input: "text",
      inputValue: r.name || "",
      inputPlaceholder: "نام جدید",
      showCancelButton: true,
      confirmButtonText: "ذخیره",
      cancelButtonText: "انصراف",
      confirmButtonColor: "green",
      cancelButtonColor: "gray",
      inputValidator: (v) => {
        if (!v || !v.trim()) return "نام نمی‌تواند خالی باشد";
        if (v.trim().length > 128) return "حداکثر ۱۲۸ کاراکتر";
        return null;
      },
    }).then(async ({ isConfirmed, value }) => {
      if (isConfirmed) {
        const newName = value.trim();
        if (newName && newName !== r.name) {
          await updateResourceName(r.id, newName);
        }
      }
    });
  };

  const groupedResources = useMemo(() => {
    const g = { IMAGE: [], VIDEO: [], IFRAME: [], TEXT: [], STREAM: [], RSS: [] };
    for (const r of resources || []) if (g[r.type]) g[r.type].push(r);
    return g;
  }, [resources]);

  const addResourceToScene = (r) => {
    if (r.type === "IMAGE") {
      return addImage({
        img: r,
        getSelectedScene,
        setSources,
        sendOperation,
        url,
        generateBlobImageURL,
      });
    }
    if (r.type === "VIDEO" || r.type === "STREAM") {
      if (r.type === "STREAM") {
        const video = document.createElement("video");
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = "anonymous";

        const src = r.content?.trim();

        const isHls = /\.m3u8(\?|$)/i.test(src);
        const isDash = /\.mpd(\?|$)/i.test(src);
        const isRtsp = /^rtsp:\/\//i.test(src);

        if (isRtsp) {
          Swal.fire({
            icon: "error",
            title: "RTSP در مرورگر پخش نمی‌شود",
            text: "لطفاً لینک RTSP را به HLS/DASH/WebRTC تبدیل کنید (مثلاً با FFmpeg یا Nginx-rtmp).",
          });
          return;
        }

        if (isHls) {
          if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = src; // Safari
          } else if (Hls.isSupported()) {
            const hls = new Hls({ lowLatencyMode: true });
            hls.loadSource(src);
            hls.attachMedia(video);
            // خوب است برای cleanup، هلس را روی آبجکت ذخیره کنید تا بعداً destroy شود
            video._hls = hls;
          } else {
            Swal.fire({ icon: "error", title: "HLS پشتیبانی نمی‌شود" });
            return;
          }
        } else if (isDash) {
          // اگر خواستید از dash.js استفاده کنید
          // const player = dashjs.MediaPlayer().create();
          // player.initialize(video, src, true);
          video.src = src; // موقت؛ بهتر است dash.js را اضافه کنید
        } else {
          // mp4 یا progressive
          video.src = src;
        }

        video.width = 800;
        video.height = 450;

        const obj = {
          ...r,
          videoElement: video,
          type: "STREAM",
          // بهتر است نام و اندازه را مشخص کنید
          name: r.name || src,
        };

        return addVideo({
          videoElement: obj,
          getSelectedScene,
          setSources,
          sendOperation,
          url,
          loopVideos,
        });
      } else {
        return addVideo({
          videoElement: r,
          getSelectedScene,
          setSources,
          sendOperation,
          url,
          loopVideos,
        });
      }
    }
    if (r.type === "IFRAME") {
      return addWeb({ webResource: r, getSelectedScene, setSources, sendOperation, url });
    }
    if (r.type === "TEXT") {
      return addText({ textItem: r, getSelectedScene, setSources, sendOperation, url });
    }
    if (r.type === "RSS") {
      return addText({ textItem: r, getSelectedScene, setSources, sendOperation, url });
    }
  };

  const uploadMedia = async (file, videoName) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("videoName", videoName);
    setMiniLoad(true);
    try {
      const response = await axios.post(`${url}/upload`, formData, videoName, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // console.log("File uploaded successfully:", response.data.filePath);
      return response.data;
    } catch (error) {
      // console.error("Error uploading file:", error);
    } finally {
      setMiniLoad(false);
    }
  };

  const addResource = (type) => {
    if (type === "VIDEO" || type === "IMAGE") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = type === "VIDEO" ? "video/*" : "image/*";
      input.onchange = (e) => handleFileInput(e, type);
      input.click();
    } else if (type === "TEXT") {
      Swal.fire({
        title: "متن خود را وارد کنید:",
        input: "text",
        showCancelButton: true,
        confirmButtonColor: "green",
        cancelButtonColor: "gray",
      }).then(async (result) => {
        if (result.isConfirmed && result.value) {
          const id = uuidv4();
          const textInit = result.value;
          const media = await api.createMedia(url, {
            type: "TEXT",
            content: textInit,
            width: 0.0,
            height: 100,
            name: textInit,
            externalId: id,
            metadata: {
              bgColor: "transparent",
              style: {
                dir: "rtl",
                fontFamily: "Vazirmatn, IRANSans, Arial",
                fontSize: 40,
                color: "gray",
              },
              marquee: {
                speed: 90,
                enabled: false,
                scrollDirection: "rtl",
              },
            },
          });

          let newResource = {
            type: "TEXT",
            id: media?.id,
            mediaId: media?.id,
            externalId: media?.externalId,
            name: textInit,
            content: textInit,
            color: "gray",
            width: 0.0,
            height: 100,
            x: 0,
            y: 0,
            z: 1,
            rotation: 0,
            metadata: {
              bgColor: "transparent",
              style: {
                dir: "rtl",
                fontFamily: "Vazirmatn, IRANSans, Arial",
                fontSize: 40,
                color: "gray",
              },
              marquee: {
                speed: 90,
                enabled: false,
                scrollDirection: "rtl",
              },
            },
          };
          setResources((prev) => [newResource, ...prev]);
          // updateSceneResources([newResource, ...getSelectedScene().resources]);
        }
      });
    } else if (type === "RSS") {
      Swal.fire({
        title: "لینک RSS را وارد کنید:",
        input: "text",
        showCancelButton: true,
        inputPlaceholder: "https://example.com/rss",
        confirmButtonColor: "green",
        cancelButtonColor: "gray",
        preConfirm: async (value) => {
          if (!value) {
            Swal.showValidationMessage("لطفاً یک لینک وارد کنید");
            return false;
          }

          try {
            const url = new URL(value);
            if (!/^https?:$/i.test(url.protocol)) {
              Swal.showValidationMessage("لینک باید با http:// یا https:// شروع شود");
              return false;
            }

            // بررسی با درخواست
            const res = await fetch(value, {
              headers: {
                Accept: "application/rss+xml, application/xml, text/xml, */*",
              },
            });
            if (!res.ok) {
              Swal.showValidationMessage(`خطای دسترسی به لینک (HTTP ${res.status})`);
              return false;
            }
            const text = await res.text();
            const doc = new DOMParser().parseFromString(text, "application/xml");
            const hasError = doc.querySelector("parsererror");
            const isRSS = doc.querySelector("rss, rdf\\:RDF");
            const isAtom = doc.querySelector("feed");
            if (hasError || (!isRSS && !isAtom)) {
              Swal.showValidationMessage("این لینک RSS/Atom معتبر نیست");
              return false;
            }

            return value; // معتبره
          } catch (err) {
            Swal.showValidationMessage("لینک وارد شده معتبر نیست");
            return false;
          }
        },
      }).then(async (result) => {
        if (result.isConfirmed && result.value) {
          const id = uuidv4();
          const textInit = result.value;

          const media = await api.createMedia(url, {
            type: "RSS",
            content: textInit,
            width: 0.0,
            height: 100,
            name: textInit,
            externalId: id,
            metadata: {
              rssContent: [],
              bgColor: "transparent",
              style: {
                dir: "rtl",
                fontFamily: "Vazirmatn, IRANSans, Arial",
                fontSize: 40,
                color: darkMode ? "white" : "black",
              },
              marquee: {
                speed: 90,
                enabled: false,
                scrollDirection: "rtl",
              },
            },
          });
          let newResource = {
            type: "RSS",
            id: media?.id,
            mediaId: media?.id,
            externalId: media?.externalId,
            name: textInit, // Show text and Editble
            content: textInit,
            color: "gray",
            width: 0.0,
            height: 100,
            x: 0,
            y: 0,
            // z: 1,
            rotation: 0,
            metadata: {
              rssContent: media.metadata.rssContent,
              bgColor: "transparent",
              style: {
                dir: "rtl",
                fontFamily: "Vazirmatn, IRANSans, Arial",
                fontSize: 40,
                color: "gray",
              },
              marquee: {
                speed: 90,
                enabled: false,
                scrollDirection: "rtl",
              },
            },
          };
          setResources((prev) => [newResource, ...prev]);
        }
      });
    } else if (type === "IFRAME") {
      Swal.fire({
        title: "Enter the URL:",
        input: "text",
        inputPlaceholder: "https://example.com",
        showCancelButton: true,
        confirmButtonColor: "green",
        cancelButtonColor: "gray",
        inputValidator: (value) => {
          if (!value) {
            return "لطفاً یک لینک وارد کنید";
          }
          try {
            const url = new URL(value);
            if (!/^https?:$/i.test(url.protocol)) {
              return "لینک باید با http:// یا https:// شروع شود";
            }
            // بررسی دامنه معتبر (حداقل یک نقطه داشته باشد)
            if (!url.hostname.includes(".")) {
              return "لینک وارد شده معتبر نیست";
            }
          } catch {
            return "لینک وارد شده معتبر نیست";
          }
        },
      }).then(async (result) => {
        if (result.isConfirmed && result.value) {
          const id = uuidv4();
          const webURL = result.value;
          const media = await api.createMedia(url, {
            type: "IFRAME",
            content: webURL,
            width: 1920,
            height: 1080,
            name: webURL,
            externalId: id,
          });

          let newResource = {
            type: "IFRAME",
            id: media.id,
            mediaId: media.id,
            externalId: media.externalId,
            name: webURL,
            content: webURL,
            width: 1920,
            height: 1080,
            x: 0,
            y: 0,
            z: 1,
            rotation: 0,
          };
          setResources((prev) => [newResource, ...prev]);

          // updateSceneResources([newResource, ...getSelectedScene().resources]);
        }
      });
    } else if (type === "STREAM") {
      Swal.fire({
        title: "آدرس استریم را وارد کنید:",
        input: "text",
        inputPlaceholder: "فقط لینک‌های http:// یا https:// مجاز هستند",
        showCancelButton: true,
        confirmButtonColor: "green",
        cancelButtonColor: "gray",
        inputValidator: (value) => {
          if (!value) return "لطفاً یک لینک وارد کنید";

          // رد کردن هر لینکی که rtsp باشد
          if (/^rtsp:\/\//i.test(value)) {
            return "لینک‌های RTSP پشتیبانی نمی‌شوند. فقط HTTP یا HTTPS مجاز است.";
          }

          try {
            const parsed = new URL(value);
            if (!/^https?:$/i.test(parsed.protocol))
              return "لینک باید با http:// یا https:// شروع شود";
            if (!parsed.hostname.includes(".")) return "لینک وارد شده معتبر نیست";
            console.log("TEST ERROR");
            return null;
          } catch {
            return "لینک وارد شده معتبر نیست";
          }
        },
      }).then(async (result) => {
        if (result.isConfirmed && result.value) {
          const id = uuidv4();
          const textInit = result.value;

          // بدون پشتیبانی از RTSP
          const media = await api.createMedia(url, {
            type: "STREAM",
            content: textInit,
            width: 640,
            height: 360,
            name: textInit,
            externalId: id,
          });

          const newResource = {
            type: "STREAM",
            id: media?.id,
            mediaId: media?.id,
            externalId: media?.externalId,
            name: textInit,
            content: media.content,
            color: darkMode ? "white" : "black",
            width: 640,
            height: 360,
            x: 0,
            y: 0,
            z: 1,
            rotation: 0,
          };
          setResources((prev) => [newResource, ...prev]);
        }
      });
    }
  };

  const deleteResource = async (id) => {
    const result = await Swal.fire({
      title: "آیا مطمئن هستید؟",
      icon: "warning",
      showCancelButton: true,
      cancelButtonText: "خیر",
      confirmButtonColor: "limegreen",
      cancelButtonColor: "#d33",
      confirmButtonText: "بله",
    });
    console.log(sources);

    if (!result.isConfirmed) return;

    try {
      setMiniLoad(true);

      const newSources = await api.getSources(url);
      const isResourceUsed = newSources.some((item) => item.media?.id == id);
      console.log("isResourceUsed::: ", isResourceUsed);

      if (!isResourceUsed) {
        // اگر منبع استفاده نشده، مستقیم پاک کن
        await handleDeleteMedia(id);
        setResources((prev) => prev.filter((res) => res.id !== id));
        return;
      }

      // اگر منبع استفاده شده
      const deleteConfirmed = await Swal.fire({
        title: "هشدار مهم این محتوا در جای دیگر استفاده شده",
        text: ".با پاک کردن این محتوا در تمامی صحنه‌ها این محتوا پاک خواهد شد",
        showDenyButton: true,
        showCancelButton: false,
        icon: "warning",
        confirmButtonText: "بله",
        denyButtonText: `خیر`,
        confirmButtonColor: "green",
        denyButtonColor: "gray",
      });

      if (!deleteConfirmed.isConfirmed) return;

      // پیدا کردن همه سورس‌های مربوط به این media
      const sourcesToRemove = newSources.filter((item) => item.media?.id == id);
      console.log("sourcesToRemove::: ", sourcesToRemove);

      // حذف از Konva و ارسال درخواست به سرور
      for (const source of sourcesToRemove) {
        // حذف از Konva
        const groupToRemove = getSelectedScene()?.layer.findOne(`#${source.externalId}`);
        if (groupToRemove) {
          groupToRemove.destroy();
        }

        // ارسال درخواست remove به سرور
        sendOperation("source", {
          action: "remove",
          id: source.externalId,
          payload: {},
        });
      }

      // رفرش صفحه Konva
      getSelectedScene()?.layer.draw();
      // به‌روزرسانی state منابع

      setSources((prev) => {
        return prev.filter((item) => (item?.media?.id || item.id) != id);
      });

      // حذف از collections
      setCollections((prev) =>
        prev.map((col) => ({
          ...col,
          schedules: col.schedules.filter((sch) => {
            const sourceExists = sourcesToRemove.some((s) => s.externalId === sch.externalId);
            return !sourceExists;
          }),
        }))
      );

      // اگر استریم هست، توقفش کن
      const resObj = resources.find((r) => r.id === id);
      if (resObj?.type === "STREAM") {
        try {
          const streamId = resObj.externalId || resObj.id;
          await axios.get(`${MEDIA_SERVER_BASE}/stream/stop/${streamId}`);
        } catch (err) {
          console.warn("Failed to stop stream on media server", err);
        }
      }

      // حذف مدیا
      await handleDeleteMedia(id);

      // به‌روزرسانی resources
      setResources((prev) => prev.filter((res) => res.id !== id));
    } catch (error) {
      console.error("Error deleting resource:", error);
    } finally {
      setMiniLoad(false);
    }
  };

  // تابع کمکی برای حذف مدیا
  const handleDeleteMedia = async (id) => {
    try {
      await api.deleteMedia(url, id);
    } catch (error) {
      console.error("Error deleting media:", error);
      throw error;
    }
  };

  const handleFileInput = async (e, type) => {
    const file = e.target.files[0];

    if (file) {
      const fileType = file.type.split("/")[0];
      if (fileType === "image" && type === "IMAGE") {
        const imageURL = URL.createObjectURL(file);
        let img = new Image();
        img.src = imageURL;
        const id = uuidv4();
        const imageName = file.name.split(".").slice(0, -1).join(".");
        img.addEventListener("load", async () => {
          // const sourceName = await uploadMedia(file, id);
          const media = await uploadMedia(file, id);

          let newResource = {
            type: "IMAGE",
            id: media.id,
            externalId: media.externalId,
            name: imageName,
            imageElement: img,
            content: media.content,
            width: img.width,
            height: img.height,
            x: 0,
            y: 0,
            z: 1,
            rotation: 0,
          };
          setResources((prev) => [newResource, ...prev]);
          // updateSceneResources([newResource, ...getSelectedScene().resources]);
        });
      } else if (fileType === "video" && type === "VIDEO") {
        const video = document.createElement("video");
        video.src = URL.createObjectURL(file);
        const id = uuidv4();
        const videoName = file.name.split(".").slice(0, -1).join(".");
        video.setAttribute("name", videoName);
        const media = await uploadMedia(file, id);
        video.setAttribute("id", media.id);

        const width = video.videoWidth;
        const height = video.videoHeight;

        let newResource = {
          type: "VIDEO",
          id: media.id,
          externalId: media.externalId,
          name: videoName,
          videoElement: video,
          content: media.content,
          width,
          height,
          x: 0,
          y: 0,
          z: 1,
          rotation: 0,
        };
        setResources((prev) => [newResource, ...prev]);
        // updateSceneResources([newResource, ...getSelectedScene().resources]);
      } else {
        // console.error("Unsupported file type.");
      }
    }
  };

  const handleDoubleClick = (resource) => {
    setEditingResourceId(resource.id);
    setNewName(resource.name);
  };

  const handleNameChange = (e) => {
    setNewName(e.target.value);
  };

  const updateResourceName = async (resourceId, newName) => {
    await api.updateMedia(url, resourceId, { name: newName });
    setResources((prev) =>
      prev.map((item) => (item.id === resourceId ? { ...item, name: newName } : item))
    );
  };

  const handleNameSave = (resourceId) => {
    updateResourceName(resourceId, newName);
    setEditingResourceId(null);
    setNewName("");
  };

  const handleDragDropItems = (resource) => {
    if (resource.type == "IMAGE") {
      setDataDrag({
        type: "IMAGE",
        img: resource,
        getSelectedScene,
        setSources,
        sendOperation,
        url,
        generateBlobImageURL,
      });
    } else if (resource.type == "VIDEO") {
      setDataDrag({
        type: "VIDEO",
        videoElement: resource,
        getSelectedScene,
        setSources,
        sendOperation,
        url,
        loopVideos,
      });
    } else if (resource.type == "IFRAME") {
      setDataDrag({
        type: "IFRAME",
        webResource: resource,
        getSelectedScene,
        setSources,
        sendOperation,
        url,
      });
    } else if (resource.type == "TEXT") {
      setDataDrag({
        type: "TEXT",
        textItem: resource,
        getSelectedScene,
        setSources,
        sendOperation,
        url,
      });
    } else if (resource.type == "RSS") {
      setDataDrag({
        type: "RSS",
        textItem: resource,
        getSelectedScene,
        setSources,
        sendOperation,
        url,
      });
    } else if (resource.type == "INPUT") {
      setDataDrag({ type: "INPUT", input: resource, getSelectedScene, setSources, sendOperation });
    } else if (resource.type == "STREAM") {
      const video = document.createElement("video");
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";

      const src = resource.content?.trim();

      const isHls = /\.m3u8(\?|$)/i.test(src);
      const isDash = /\.mpd(\?|$)/i.test(src);
      const isRtsp = /^rtsp:\/\//i.test(src);

      if (isRtsp) {
        // RTSP را باید سمت سرور به HLS/DASH/WebRTC تبدیل کنید
        Swal.fire({
          icon: "error",
          title: "RTSP در مرورگر پخش نمی‌شود",
          text: "لطفاً لینک RTSP را به HLS/DASH/WebRTC تبدیل کنید (مثلاً با FFmpeg یا Nginx-rtmp).",
        });
        return;
      }

      if (isHls) {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src; // Safari
        } else if (Hls.isSupported()) {
          const hls = new Hls({ lowLatencyMode: true });
          hls.loadSource(src);
          hls.attachMedia(video);
          // خوب است برای cleanup، هلس را روی آبجکت ذخیره کنید تا بعداً destroy شود
          video._hls = hls;
        } else {
          Swal.fire({ icon: "error", title: "HLS پشتیبانی نمی‌شود" });
          return;
        }
      } else if (isDash) {
        // اگر خواستید از dash.js استفاده کنید
        // const player = dashjs.MediaPlayer().create();
        // player.initialize(video, src, true);
        video.src = src; // موقت؛ بهتر است dash.js را اضافه کنید
      } else {
        // mp4 یا progressive
        video.src = src;
      }

      video.width = 800;
      video.height = 450;

      const obj = {
        ...resource,
        videoElement: video,
        type: "STREAM",
        // بهتر است نام و اندازه را مشخص کنید
        name: resource.name || src,
      };

      setDataDrag({
        type: "STREAM",
        videoElement: obj,
        getSelectedScene,
        setSources,
        sendOperation,
        url,
        loopVideos,
      });
    }
  };

  // const handleColorChange = (color) => {
  //   setSelectedColor(color.hex);
  //   if (colorPickerResourceId) {
  //     updateSourceColor(colorPickerResourceId, color.hex);
  //   }
  // };

  const handleNameCancel = () => {
    setEditingResourceId(null);
    setNewName("");
  };

  return (
    <div
      dir="rtl"
      className="p-2 rounded-lg h-full overflow-auto  flex flex-col"
      style={{
        color: darkMode ? "#ffffff" : "#000000",
      }}
    >
      {colorPickerVisible && (
        <div className="absolute left-0 right-0 top-0 bottom-0 m-auto z-[100] w-fit h-fit">
          <SketchPicker color={selectedColor} onChange={handleColorChange} />
          <Button
            className="w-full my-2"
            onPress={() => {
              setColorPickerVisible(false);
            }}
            color="primary"
            variant="solid"
          >
            انجام شد
          </Button>
        </div>
      )}

      {/* Fixed Header */}
      <div className="sticky flex z-[50] ">
        <div className="w-full">
          <Tabs
            classNames={{ base: "sticky top-[-10px] z-[50] px-3 py-[2px] bg-inherit" }}
            aria-label="Options"
            defaultSelectedKey={"items"}
            className={`${darkMode ? "dark" : "light"}`}
          >
            <Tab key="inputs" title={`ورودی‌ها: ${inputs.length}`}>
              {/* Scrollable content INPUT */}
              <div className="flex-1 overflow-y-auto scrollbar-hide ">
                <ul className="flex flex-col gap-2">
                  {inputs?.map((input) => (
                    <li
                      key={input.id}
                      draggable={true}
                      onDragStart={(e) => handleDragDropItems(input)}
                      className={`text-sm flex flex-wrap items-center justify-between ${
                        darkMode ? "bg-orange-600" : "bg-orange-600 "
                      } p-2 rounded-md shadow-sm flex-wrap`}
                    >
                      <div className="flex items-center w-[50%]">
                        {editingResourceId === input.id ? (
                          <input
                            type="text"
                            value={newName}
                            onChange={handleNameChange}
                            onBlur={() => handleNameSave(input.id)}
                            className={` ${darkMode ? "text-black" : "text-black"} p-1 rounded-sm`}
                            autoFocus
                          />
                        ) : (
                          <span
                            className={` ${darkMode ? "text-white" : "text-white"} mr-2 truncate`}
                            // onDoubleClick={() => handleDoubleClick(input)}
                          >
                            {input.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 w-[50%] justify-end">
                        <Tooltip content="افزودن به صحنه">
                          <Button
                            className={`${
                              darkMode ? "text-white" : "text-black"
                            } min-w-fit h-fit p-1`}
                            size="sm"
                            variant="light"
                            color="default"
                            onPress={() =>
                              addInput({ input, getSelectedScene, setSources, sendOperation })
                            }
                          >
                            <MdAddBox />
                          </Button>
                        </Tooltip>
                        {/* <Dropdown>
                  <DropdownTrigger>
                    <Button
                      className={`${darkMode ? "text-white" : "text-white"} min-w-fit h-fit p-1`}
                      size="sm"
                      variant="light"
                      color="default"
                    >
                      <FaCog />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="More Actions">
                    <DropdownItem key="moveUp" onPress={() => moveSource(input.id, -1)}>
                      بالا
                    </DropdownItem>
                    <DropdownItem key="moveDown" onPress={() => moveSource(input.id, 1)}>
                      پایین
                    </DropdownItem>
                    <DropdownItem key="add-image" onPress={() => addInput(input)}>
                      افزودن به صحنه
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown> */}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Tab>
            <Tab
              key="resources"
              title={`فایل‌ها: ${
                resources.filter((item) => item.type == "IMAGE" || item.type == "VIDEO").length
              }`}
            >
              <div className="flex flex-col gap-3 px-1 pb-2">
                {["IMAGE", "VIDEO"].map((t) => {
                  const Icon = TYPE_META[t].icon;
                  const items = groupedResources[t];

                  return (
                    <Card
                      key={t}
                      shadow="sm"
                      className={`${darkMode ? "bg-gray-800 border border-white/10" : "bg-white"}`}
                    >
                      <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`${darkMode ? "text-white/90" : "text-black/80"}`} />
                          <span
                            className={`text-sm font-medium ${
                              darkMode ? "text-white" : "text-black"
                            }`}
                          >
                            {TYPE_META[t].label}
                          </span>
                          <Chip size="sm" variant="flat">
                            {items.length}
                          </Chip>
                        </div>
                        {/* دکمه‌ی افزودن مستقیم همان نوع */}
                        <Button
                          size="sm"
                          variant="flat"
                          className="min-w-fit"
                          onPress={() => addResource(t)}
                        >
                          افزودن {TYPE_META[t].label}
                        </Button>
                      </div>

                      <CardBody className="pt-0">
                        {items.length === 0 ? (
                          <div
                            className={`text-xs px-3 pb-3 ${
                              darkMode ? "text-white/60" : "text-black/60"
                            }`}
                          >
                            موردی موجود نیست.
                          </div>
                        ) : (
                          <ul className="grid grid-cols-2 gap-2 max-h-64 overflow-auto pr-1">
                            {items.map((r) => {
                              // --- محاسبه‌ی src و هندلر درگ، همه داخل همین بلاک ---
                              const fromElement =
                                r.type === "IMAGE"
                                  ? r.imageElement?.src
                                  : r.type === "VIDEO"
                                  ? r.videoElement?.src
                                  : null;

                              let src = fromElement || r.content || "";
                              if (src && url && /^\/(?!\/)/.test(src)) {
                                src = `${url.replace(/\/+$/, "")}/${src.replace(/^\/+/, "")}`;
                              }
                              const isHls = /\.m3u8(\?|$)/i.test(src);

                              const size = 96; // اندازه‌ی مربع

                              const handleTileDragStart = (e) => {
                                // payload واقعی برای سازگاری مرورگرها
                                try {
                                  e.dataTransfer.setData(
                                    "application/json",
                                    JSON.stringify({ id: r.id, type: r.type })
                                  );
                                  e.dataTransfer.setData("text/plain", r.id);
                                  e.dataTransfer.effectAllowed = "copy";
                                } catch {}

                                // drag image شفاف تا موانع تصویری ایجاد نشود
                                const ghost = document.createElement("div");
                                ghost.style.width = "1px";
                                ghost.style.height = "1px";
                                ghost.style.opacity = "0";
                                document.body.appendChild(ghost);
                                try {
                                  e.dataTransfer.setDragImage(ghost, 0, 0);
                                } catch {}
                                setTimeout(() => document.body.removeChild(ghost), 0);

                                // ست کردن دیتا برای سیستم شما
                                handleDragDropItems(r);
                              };

                              return (
                                <li
                                  key={r.id}
                                  draggable
                                  onDragStart={handleTileDragStart}
                                  onDoubleClick={() => openRenameModal(r)}
                                  className="group relative m-auto rounded-lg overflow-hidden select-none cursor-grab active:cursor-grabbing"
                                  style={{ width: "90%", height: size }}
                                  title={r.name}
                                >
                                  {r.type === "IMAGE" && src ? (
                                    <img
                                      src={src}
                                      alt={r.name || "image"}
                                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                      draggable={false}
                                    />
                                  ) : r.type === "VIDEO" && src && !isHls ? (
                                    <video
                                      src={src}
                                      muted
                                      playsInline
                                      preload="metadata"
                                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                      onMouseEnter={(e) => {
                                        try {
                                          e.currentTarget.play();
                                        } catch {}
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.pause();
                                        e.currentTarget.currentTime = 0;
                                      }}
                                      draggable={false}
                                    />
                                  ) : (
                                    <div
                                      className={`absolute inset-0 grid place-items-center ${
                                        darkMode ? "bg-gray-800" : "bg-gray-200"
                                      } pointer-events-none`}
                                    >
                                      <span className="text-2xl">
                                        {r.type === "VIDEO" || r.type === "STREAM"
                                          ? "🎬"
                                          : r.type === "IMAGE"
                                          ? "🖼️"
                                          : "🧩"}
                                      </span>
                                    </div>
                                  )}

                                  {/* اوورلی بالا: نوع */}
                                  <div
                                    className="absolute top-0 left-0 right-0 px-1 py-0.5 pointer-events-none"
                                    style={{
                                      background:
                                        "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0))",
                                    }}
                                  >
                                    <div className="flex items-center gap-1 text-[10px] text-white/90">
                                      {TYPE_META[r.type]?.icon &&
                                        React.createElement(TYPE_META[r.type].icon, {
                                          className: "text-[12px]",
                                        })}
                                      <span className="font-medium">{r.type}</span>
                                    </div>
                                  </div>

                                  {/* اوورلی پایین: نام */}
                                  <div
                                    className="absolute bottom-0 left-0 right-0 px-1.5 py-1 pointer-events-none"
                                    style={{
                                      background:
                                        "linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0))",
                                    }}
                                  >
                                    <span className="block text-[11px] text-white truncate">
                                      {r.name}
                                    </span>
                                  </div>

                                  {/* اکشن‌ها روی هاور (فقط روی دکمه‌ها رویداد را نگه می‌داریم) */}
                                  <div className="absolute top-1 right-1 hidden gap-1 group-hover:flex">
                                    <button
                                      className={`rounded-md p-1 text-xs ${
                                        darkMode
                                          ? "bg-black/50 text-white"
                                          : "bg-white/70 text-black"
                                      }`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        addResourceToScene(r);
                                      }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      title="افزودن به صحنه"
                                    >
                                      <MdAddBox size={16} />
                                    </button>
                                    <button
                                      className={`rounded-md p-1 text-xs ${
                                        darkMode
                                          ? "bg-black/50 text-white"
                                          : "bg-white/70 text-black"
                                      }`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        deleteResource(r.id);
                                      }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      title="حذف"
                                    >
                                      <FaTrashAlt size={14} />
                                    </button>
                                    <button
                                      className={`rounded-md p-1 text-xs ${
                                        darkMode
                                          ? "bg-black/50 text-white"
                                          : "bg-white/70 text-black"
                                      }`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openRenameModal(r);
                                      }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      title="حذف"
                                    >
                                      <FaEdit size={14} />
                                    </button>
                                  </div>

                                  {/* حلقه‌ی حاشیه */}
                                  <div
                                    className={`absolute inset-0 pointer-events-none ring-1 ${
                                      darkMode ? "ring-white/10" : "ring-black/10"
                                    } rounded-lg`}
                                  />
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </Tab>
            <Tab
              key="items"
              title={`آیتم‌ها: ${
                resources.filter((item) => item.type != "IMAGE" && item.type != "VIDEO").length
              }`}
            >
              <div className="flex flex-col gap-3 px-1 pb-2">
                {["IFRAME", "TEXT", "STREAM", "RSS"].map((t) => {
                  const Icon = TYPE_META[t].icon;
                  const items = groupedResources[t];

                  return (
                    <Card
                      key={t}
                      shadow="sm"
                      className={`${darkMode ? "bg-gray-800 border border-white/10" : "bg-white"}`}
                    >
                      <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`${darkMode ? "text-white/90" : "text-black/80"}`} />
                          <span
                            className={`text-sm font-medium ${
                              darkMode ? "text-white" : "text-black"
                            }`}
                          >
                            {TYPE_META[t].label}
                          </span>
                          <Chip size="sm" variant="flat">
                            {items.length}
                          </Chip>
                        </div>
                        {/* دکمه‌ی افزودن مستقیم همان نوع */}
                        <Button
                          size="sm"
                          variant="flat"
                          className="min-w-fit"
                          onPress={() => addResource(t)}
                        >
                          افزودن {TYPE_META[t].label}
                        </Button>
                      </div>

                      <CardBody className="pt-0">
                        {items.length === 0 ? (
                          <div
                            className={`text-xs px-3 pb-3 ${
                              darkMode ? "text-white/60" : "text-black/60"
                            }`}
                          >
                            موردی موجود نیست.
                          </div>
                        ) : (
                          <ul className="flex flex-col gap-2 max-h-64 overflow-auto pr-1">
                            {items.map((r) => (
                              <li
                                key={r.id}
                                // وقتی در حالت ادیت هستیم، درگ را خاموش کنیم تا input درست کار کند
                                draggable={editingResourceId !== r.id}
                                onDragStart={(e) => {
                                  handleDragDropItems(r);
                                }}
                                className={`flex items-center justify-between p-1 rounded-md cursor-grab active:cursor-grabbing select-none ${
                                  darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-black"
                                }`}
                              >
                                <div className="flex items-center gap-2 w-[70%]">
                                  <Chip
                                    size="sm"
                                    className="text-[10px] p-0"
                                    variant="solid"
                                    color={TYPE_META[r.type]?.badge || "default"}
                                  >
                                    {r.type}
                                  </Chip>

                                  {editingResourceId === r.id ? (
                                    <input
                                      value={newName}
                                      onChange={handleNameChange}
                                      onBlur={() => handleNameSave(r.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleNameSave(r.id);
                                        if (e.key === "Escape") handleNameCancel();
                                      }}
                                      className="px-2 py-1 rounded bg-white text-black w-[180px]"
                                      autoFocus
                                      // جلوگیری از شروع درگ وقتی داخل input کلیک می‌کنیم
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onPointerDown={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span
                                      className="truncate max-w-[180px] text-sm"
                                      onDoubleClick={() => {
                                        setEditingResourceId(r.id);
                                        setNewName(r.name);
                                      }}
                                      title="برای تغییر نام دوبار کلیک کنید"
                                    >
                                      {r.name}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="light"
                                    className={`${
                                      darkMode ? "text-white" : "text-black"
                                    } min-w-fit h-fit p-1`}
                                    draggable={false}
                                    // جلوگیری از شروع درگ روی دکمه‌ها
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onPress={() => addResourceToScene(r)}
                                  >
                                    <MdAddBox />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="light"
                                    className={`${
                                      darkMode ? "text-white" : "text-black"
                                    } min-w-fit h-fit p-1`}
                                    draggable={false}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onPress={() => deleteResource(r.id)}
                                  >
                                    <FaTrashAlt />
                                  </Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </Tab>
          </Tabs>
        </div>
        <div className="w-fit h-fit absolute left-0 top-[5px]">
          <Dropdown dir="rtl" className="vazir">
            <DropdownTrigger>
              <Button
                className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1 text-xl`}
                size="lg"
                variant="light"
                color="default"
              >
                <MdAddBox />
              </Button>
            </DropdownTrigger>

            <DropdownMenu aria-label="Static Actions">
              <DropdownItem onPress={() => addResource("VIDEO")} key="video">
                افزودن ویدیو
              </DropdownItem>
              <DropdownItem onPress={() => addResource("IMAGE")} key="image">
                افزودن تصویر
              </DropdownItem>
              {/* <DropdownItem onPress={() => addResource("TEXT")} key="text">
                افزودن متن
              </DropdownItem> */}
              <DropdownItem onPress={() => addResource("IFRAME")} key="web">
                افزودن صفحه وب
              </DropdownItem>
              <DropdownItem onPress={() => addResource("TEXT")} key="text">
                افزودن متن
              </DropdownItem>
              <DropdownItem onPress={() => addResource("RSS")} key="rss">
                افزودن خبرخوان
              </DropdownItem>
              {/* <DropdownItem onPress={() => addResource("STREAM")} key="stream">
                افزودن استریم
              </DropdownItem> */}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default ResourcesSidebar;
