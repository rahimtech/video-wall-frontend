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
import { FaPlay, FaPause, FaTrashAlt, FaCog, FaRemoveFormat } from "react-icons/fa";
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

  const TYPE_META = {
    IMAGE: { label: "تصاویر", icon: FaImage, badge: "success" },
    VIDEO: { label: "ویدیوها", icon: FaVideo, badge: "primary" },
    IFRAME: { label: "صفحات وب", icon: FaGlobe, badge: "warning" },
    TEXT: { label: "متن‌ها", icon: FaFont, badge: "secondary" },
  };

  const groupedResources = useMemo(() => {
    const g = { IMAGE: [], VIDEO: [], IFRAME: [], TEXT: [] };
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
    if (r.type === "VIDEO") {
      return addVideo({
        videoItem: r,
        getSelectedScene,
        setSources,
        sendOperation,
        url,
        loopVideos,
      });
    }
    if (r.type === "IFRAME") {
      return addWeb({ webResource: r, getSelectedScene, setSources, sendOperation, url });
    }
    if (r.type === "TEXT") {
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
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const id = uuidv4();

          let newResource = {
            type: "TEXT",
            id,
            color: "black",
            name: result.value,
            content: result.value,
            width: 200,
            height: 200,
            x: 0,
            y: 0,
            z: 0,
            rotation: 0,
            created_at: new Date().toISOString(),
          };
          setResources((prev) => [newResource, ...prev]);
          // updateSceneResources([newResource, ...getSelectedScene().resources]);
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
            z: 0,
            rotation: 0,
          };
          setResources((prev) => [newResource, ...prev]);

          // updateSceneResources([newResource, ...getSelectedScene().resources]);
        }
      });
    }
  };

  const deleteResource = (id) => {
    // let newfileName = trimPrefix(fileName, "uploads\\");
    Swal.fire({
      title: "آیا مطمئن هستید؟",
      icon: "warning",
      showCancelButton: true,
      cancelButtonText: "خیر",
      confirmButtonColor: "limegreen",
      cancelButtonColor: "#d33",
      confirmButtonText: "بله",
    }).then(async (result) => {
      if (result.isConfirmed) {
        let flagCheckIsResourceUse = false;
        collections.find((f) => {
          f.schedules.find((s) => {
            s.scene.sources.find((item) => {
              if (item.media.id == id) {
                flagCheckIsResourceUse = true;
              }
            });
          });
        });

        if (!flagCheckIsResourceUse) {
          try {
            setMiniLoad(true);
            // await axios.delete(`${url}/delete/${fileName}`).then(console.log("deleted"));
            await api.deleteMedia(url, id);
          } finally {
            setMiniLoad(false);
          }
        }

        if (flagCheckIsResourceUse) {
          Swal.fire({
            title: "هشدار مهم این محتوا در جای دیگر استفاده شده",
            text: ".با پاک کردن این محتوا در تمامی صحنه‌ها این محتوا پاک خواهد شد",
            showDenyButton: true,
            showCancelButton: false,
            icon: "warning",
            confirmButtonText: "بله",
            denyButtonText: `خیر`,
            confirmButtonColor: "green",
            denyButtonColor: "gray",
          }).then(async (result) => {
            if (result.isConfirmed) {
              const colEndPoint = collections.map((so) => {
                so.schedules.map((s) => {
                  const newSch = s.scene.sources.filter((sch) => {
                    if (sch.media.id !== id) {
                      return sch;
                    } else {
                      let groupToRemove = getSelectedScene()
                        ?.layer.getParent()
                        .find(`#${sch.externalId}`);
                      if (groupToRemove) {
                        for (let index = 0; index < groupToRemove.length; index++) {
                          groupToRemove[index].remove();
                        }
                        getSelectedScene()?.layer.getParent().draw();
                      } else {
                        // console.error(`Group with id ${id} not found`);
                      }
                    }
                  });

                  setSources(newSch || []);
                  return { ...s, schedules: newSch };
                });
                return so;
              });

              try {
                setMiniLoad(true);
                // await axios.delete(`${url}/delete/${fileName}`).then(console.log("deleted"));
                await api.deleteMedia(url, id);
              } finally {
                setMiniLoad(false);
              }

              // const colEndPoint2 = collections.map((col) => {
              //   const newSch = col.schedules.filter((sch) => sch.scene_id !== id);
              //   return { ...col, schedules: newSch };
              //   // return col;
              // });

              console.log("colEndPoint::: ", colEndPoint);
              setCollections(colEndPoint);
              setResources(resources.filter((res) => res.id !== id));

              return;
            }
          });
          return;
        }

        setResources(resources.filter((res) => res.id !== id));

        const groupToRemove = getSelectedScene()?.layer.findOne(`#${id}`);
        if (groupToRemove) {
          groupToRemove.destroy();
          getSelectedScene()?.layer.draw();
        } else {
          // console.error(`Group with id ${id} not found`);
        }

        // const videoElement = resources.find((item) => item.id === id)?.videoElement;
        // if (videoElement) {
        //   videoElement.pause();
        //   videoElement.src = "";
        // }
      } else {
        return;
      }
    });
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
        videoItem: resource,
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
    } else if (resource.type == "INPUT") {
      setDataDrag({ type: "INPUT", input: resource, getSelectedScene, setSources, sendOperation });
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
            defaultSelectedKey={"resources"}
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
            <Tab key="resources" title={`فایل‌ها: ${resources.length}`}>
              <div className="flex flex-col gap-3 px-1 pb-2">
                {["IMAGE", "VIDEO", "IFRAME", "TEXT"].map((t) => {
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
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default ResourcesSidebar;
