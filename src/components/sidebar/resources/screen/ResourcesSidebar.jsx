import React, { useState } from "react";
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
            type: "text",
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
              {/* Scrollable content resources */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <ul className="flex flex-col gap-2">
                  {resources?.map((resource) => (
                    <li
                      key={resource.id}
                      draggable={true}
                      onDragStart={(e) => handleDragDropItems(resource)}
                      className={`text-sm flex flex-wrap items-center justify-between ${
                        darkMode ? "bg-gray-700" : "bg-gray-300"
                      } p-2 rounded-md shadow-sm flex-wrap`}
                    >
                      <div className="flex items-center w-[50%]">
                        <Chip
                          className="flex text-[10px] p-0 items-center justify-center"
                          color="warning"
                          size="sm"
                          variant="solid"
                        >
                          {resource.type}
                        </Chip>

                        {editingResourceId === resource.id ? (
                          <input
                            type="text"
                            value={newName}
                            onChange={handleNameChange}
                            onBlur={() => handleNameSave(resource.id)}
                            className={` ${darkMode ? "text-black" : "text-black"} p-1 rounded-sm`}
                            autoFocus
                          />
                        ) : (
                          <span
                            className={` ${darkMode ? "text-white" : "text-black"} mr-2 truncate`}
                            onDoubleClick={() => handleDoubleClick(resource)}
                          >
                            {resource.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 w-[50%] justify-end">
                        <Button
                          className={`${
                            darkMode ? "text-white" : "text-black"
                          } min-w-fit h-fit p-1`}
                          size="sm"
                          variant="light"
                          color="default"
                          onPress={() => deleteResource(resource.id)}
                        >
                          <FaTrashAlt />
                        </Button>
                        <Tooltip content="افزودن به صحنه">
                          {resource.type == "IMAGE" ? (
                            <>
                              <Button
                                className={`${
                                  darkMode ? "text-white" : "text-black"
                                } min-w-fit h-fit p-1`}
                                size="sm"
                                variant="light"
                                color="default"
                                onPress={() => {
                                  videoWalls.length > 0
                                    ? addImage({
                                        img: resource,
                                        getSelectedScene,
                                        setSources,
                                        sendOperation,
                                        url,
                                        generateBlobImageURL,
                                      })
                                    : Swal.fire({
                                        title: "!مانیتوری در صحنه وجود ندارد",
                                        icon: "warning",
                                        confirmButtonText: "باشه",
                                        confirmButtonColor: "gray",
                                      });
                                }}
                              >
                                <MdAddBox />
                              </Button>
                            </>
                          ) : resource.type == "VIDEO" ? (
                            <>
                              <Button
                                className={`${
                                  darkMode ? "text-white" : "text-black"
                                } min-w-fit h-fit p-1`}
                                size="sm"
                                variant="light"
                                color="default"
                                onPress={() => {
                                  videoWalls.length > 0
                                    ? addVideo({
                                        videoItem: resource,
                                        getSelectedScene,
                                        setSources,
                                        sendOperation,
                                        url,
                                        loopVideos,
                                      })
                                    : Swal.fire({
                                        title: "!مانیتوری در صحنه وجود ندارد",
                                        icon: "warning",
                                        confirmButtonText: "باشه",
                                        confirmButtonColor: "gray",
                                      });
                                }}
                              >
                                <MdAddBox />
                              </Button>
                            </>
                          ) : resource.type == "IFRAME" ? (
                            <>
                              <Button
                                className={`${
                                  darkMode ? "text-white" : "text-black"
                                } min-w-fit h-fit p-1`}
                                size="sm"
                                variant="light"
                                color="default"
                                onPress={() => {
                                  videoWalls.length > 0
                                    ? addWeb({
                                        webResource: resource,
                                        getSelectedScene,
                                        setSources,
                                        sendOperation,
                                        url,
                                      })
                                    : Swal.fire({
                                        title: "!مانیتوری در صحنه وجود ندارد",
                                        icon: "warning",
                                        confirmButtonText: "باشه",
                                        confirmButtonColor: "gray",
                                      });
                                }}
                              >
                                <MdAddBox />
                              </Button>
                            </>
                          ) : (
                            <></>
                          )}
                        </Tooltip>
                        {/* <Dropdown>
                  <DropdownTrigger>
                    <Button
                      className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                      size="sm"
                      variant="light"
                      color="default"
                    >
                      <FaCog />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="More Actions">
                    <DropdownItem key="moveUp" onPress={() => moveSource(resource.id, -1)}>
                      بالا
                    </DropdownItem>
                    <DropdownItem key="moveDown" onPress={() => moveSource(resource.id, 1)}>
                      پایین
                    </DropdownItem>
                    {resource.type === "video" ? (
                      <DropdownItem
                        key="add-video"
                        onPress={() => {
                          videoWalls.length > 0
                            ? addVideo(resource)
                            : Swal.fire({
                                title: "!مانیتوری در صحنه وجود ندارد",
                                icon: "warning",
                                confirmButtonText: "باشه",
                                confirmButtonColor: "gray",
                              });
                        }}
                      >
                        افزودن به صحنه
                      </DropdownItem>
                    ) : resource.type === "image" ? (
                      <DropdownItem
                        key="add-image"
                        onPress={() => {
                          videoWalls.length > 0
                            ? addImage(resource)
                            : Swal.fire({
                                title: "!مانیتوری در صحنه وجود ندارد",
                                icon: "warning",
                                confirmButtonText: "باشه",
                                confirmButtonColor: "gray",
                              });
                        }}
                      >
                        افزودن به صحنه
                      </DropdownItem>
                    ) : resource.type === "text" ? (
                      [
                        <DropdownItem
                          key="add-text"
                          onPress={() => {
                            videoWalls.length > 0
                              ? addText(resource)
                              : Swal.fire({
                                  title: "!مانیتوری در صحنه وجود ندارد",
                                  icon: "warning",
                                  confirmButtonText: "باشه",
                                  confirmButtonColor: "gray",
                                });
                          }}
                        >
                          افزودن به صحنه
                        </DropdownItem>,
                        <DropdownItem key="edit-text" onPress={() => editText(resource)}>
                          ویرایش متن اصلی
                        </DropdownItem>,
                        <DropdownItem
                          key="edit-color"
                          onPress={() => {
                            setColorPickerVisible(!colorPickerVisible);
                            setColorPickerResourceId(resource.id);
                          }}
                        >
                          انتخاب رنگ متن
                        </DropdownItem>,
                      ]
                    ) : resource.type === "web" ? (
                      [
                        <DropdownItem
                          key="add-web"
                          onPress={() => {
                            videoWalls.length > 0
                              ? addWeb(resource)
                              : Swal.fire({
                                  title: "!مانیتوری در صحنه وجود ندارد",
                                  icon: "warning",
                                  confirmButtonText: "باشه",
                                  confirmButtonColor: "gray",
                                });
                          }}
                        >
                          افزودن به صحنه
                        </DropdownItem>,
                        <DropdownItem key="edit-web" onPress={() => editWeb(resource)}>
                          ویرایش URL
                        </DropdownItem>,
                      ]
                    ) : (
                      <></>
                    )}
                    <DropdownItem key="loop" onPress={() => toggleLoopVideo(resource.id)}>
                      {loopVideos[resource.id] ? "لوپ فعال" : "لوپ غیرفعال"}
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown> */}
                      </div>
                    </li>
                  ))}
                </ul>
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
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default ResourcesSidebar;
