import React, { useState } from "react";
import {
  Button,
  Tooltip,
  Modal,
  Input,
  ModalContent,
  ModalHeader,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { FaTrashAlt } from "react-icons/fa";
import { MdAddBox, MdEdit } from "react-icons/md";
import Swal from "sweetalert2";
import ModalTimeLine from "./ModalTimeLine";
import api from "@/api/api";
import { useMyContext } from "@/context/MyContext";
import { GoBroadcast } from "react-icons/go";
import { Accordion, AccordionItem } from "@heroui/react";

const CollectionsSidebar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const {
    setIsLoading,
    setSelectedScene,
    collections,
    setCollections,
    selectedCollection,
    setSelectedCollection,
    filteredScenes,
    url,
    darkMode,
    socket,
    setActiveProgram,
    activeProgram,
    scenes,
    editingSceneId,
    setEditingSceneId,
    addScene,
    setScenes,
    deleteScene,
    handleEditSceneName,
    setSources,
    sources,
    selectedScene,
    generateScene,
    videoWalls,
    createNewStage,
  } = useMyContext();

  const selectedScenes = scenes.filter((scene) => filteredScenes?.some((f) => f.id === scene.id));
  const unselectedScenes = scenes.filter(
    (scene) => !filteredScenes?.some((f) => f.id === scene.id)
  );

  let idSave = null;

  const handleCollectionClick = (key) => {
    setSelectedCollection(key);
    setSelectedScene(collections.find((item) => item.id == key)?.schedules[0]?.scene_id ?? null);
  };

  const handleOpenModal = (collection = null) => {
    if (collection) {
      idSave = collection.id;
      setEditingCollection(collection.id);
      setNewCollectionName(collection.name);
    } else {
      setEditingCollection(null);
      setNewCollectionName("");
    }
    onOpen();
  };

  const handleSaveCollection = async () => {
    if (newCollectionName.length <= 0) {
      setIsInvalid(true);
      return;
    }
    setIsInvalid(false);

    if (editingCollection) {
      const newCollections = collections.map((collection) => {
        if (collection.id === editingCollection) {
          let updatedCollection = { ...collection, name: newCollectionName };

          let newSchedules = [...collection.schedules];
          for (const s of selectedScenes) {
            const addResult = api.addSceneToProgram(url, collection.id, s, 60, true);
            newSchedules.push(addResult);
          }

          updatedCollection.schedules = newSchedules;
          api.updateProgram(url, collection.id, { name: newCollectionName });

          return updatedCollection;
        }
        return collection;
      });

      setCollections(newCollections);
    } else {
      try {
        setIsLoading(true);
        const dataCol = await api.createProgram(url, {
          name: newCollectionName,
          metadata: {},
        });
        let newCol = { id: dataCol.id, name: newCollectionName, schedules: [] };
        setCollections((prev) => [...prev, newCol]);

        setSelectedCollection(newCol.id);
        setSelectedScene(null);
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    }

    onClose();
  };

  const handleDeleteCollection = (id) => {
    if (collections.length <= 1) {
      Swal.fire({
        title: "باید حداقل یک برنامه وجود داشته باشد",
        icon: "warning",
        confirmButtonColor: "limegreen",
        confirmButtonText: "متوجه شدم",
      });
    } else {
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
          setCollections((prev) => {
            prev.find((item) => {
              if (item.id == id) {
                let x = collections.indexOf(item);
                if (x == 0) setSelectedCollection(collections[x + 1].id);
                if (x >= 1) setSelectedCollection(collections[x - 1].id);
              }
            });
            return prev.filter((collection) => collection.id !== id);
          });

          api.deleteProgram(url, id);
        }
      });
    }
  };

  const handleSceneSelection = async (scene) => {
    if (selectedScene == scene.id) return;
    setSelectedScene(scene.id);
    const selectedLayer = scenes.find((sceneItem) => sceneItem.id === scene.id).layer;
    let sceneTarget = scenes.find((sceneItem) => sceneItem.id === scene.id);

    const newScene = await api.getSceneById(url, scene.id);
    setSources(newScene.sources);
    let flag = true;
    if (selectedLayer) {
      selectedLayer.getChildren().forEach((child) => {
        if (typeof child.getAttr("catFix") == "undefined") {
          flag = false;
        }
      });

      selectedLayer.draw();
    }

    if (newScene.sources && newScene.sources.length > 0 && selectedLayer && flag) {
      generateScene(newScene.sources, sceneTarget);
    }
  };

  const handleBroadcast = (id) => {
    Swal.fire({
      title: "پخش این برنامه بر روی ویدئووال",
      icon: "warning",
      showCancelButton: true,
      cancelButtonText: "خیر",
      confirmButtonColor: "limegreen",
      cancelButtonColor: "#d33",
      confirmButtonText: "بله",
    }).then(async (result) => {
      if (result.isConfirmed) {
        socket.emit("activate-program", id);
        setActiveProgram(id);
      }
    });
  };

  return (
    <div
      dir="rtl"
      className="p-2 rounded-lg h-full overflow-auto scrollbar-hide"
      style={{
        color: darkMode ? "#ffffff" : "#000000",
      }}
    >
      <div className="sticky top-[-10px] z-[50] px-3 py-[2px] bg-inherit">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-md font-semibold">برنامه پخش</h2>
          <Button
            className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1 text-xl`}
            size="lg"
            variant="light"
            color="default"
            onPress={() => handleOpenModal(null)}
          >
            <MdAddBox />
          </Button>
        </div>
      </div>

      <Accordion variant="splitted" isCompact>
        {collections?.map((collection) => (
          <AccordionItem
            className={`  ${
              selectedCollection === collection.id
                ? darkMode
                  ? "bg-primary-700 "
                  : ""
                : darkMode
                ? "bg-gray-600"
                : ""
            } `}
            key={collection.id}
            aria-label={collection.name}
            onPress={() => handleCollectionClick(collection.id)}
            title={
              <div className={`text-sm flex-col items-center justify-between w-full p-2  `}>
                <div className="flex items-center gap-2">
                  {collection.id == activeProgram && (
                    <video
                      className="ml-2"
                      width="50"
                      height="20"
                      controls={false}
                      muted={true}
                      loop
                      autoPlay
                    >
                      <source src="/pulseAnim.webm" type="video/webm" />
                    </video>
                  )}
                  <span className={`truncate ${darkMode ? "text-white" : ""}`}>
                    {collection.name}
                  </span>
                </div>
                <div className="flex mt-3 gap-1">
                  <Tooltip content="ویرایش برنامه">
                    <Button
                      className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                      size="sm"
                      variant="flat"
                      color="default"
                      onPress={(e) => {
                        handleOpenModal(collection);
                      }}
                    >
                      <MdEdit size={15} />
                    </Button>
                  </Tooltip>
                  <ModalTimeLine
                    setCollections={setCollections}
                    darkMode={darkMode}
                    collectionScenes={filteredScenes}
                    collections={collections}
                    selectedCollection={selectedCollection}
                    setSelectedCollection={setSelectedCollection}
                    collectionSelected={collection}
                  />
                  <Tooltip content="حذف برنامه">
                    <Button
                      className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                      size="sm"
                      variant="flat"
                      color="default"
                      onPress={(e) => {
                        handleDeleteCollection(collection.id);
                      }}
                    >
                      <FaTrashAlt size={15} />
                    </Button>
                  </Tooltip>
                  <Tooltip content="پخش روی ویدئووال">
                    <Button
                      className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                      size="sm"
                      variant="flat"
                      color="default"
                      onPress={(e) => {
                        handleBroadcast(collection.id);
                      }}
                    >
                      <GoBroadcast size={15} />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            }
          >
            <ul className="flex flex-col gap-2">
              {selectedScenes.length >= 1 ? (
                <>
                  {selectedScenes?.map((scene) => (
                    <li key={scene.id} className="flex items-center justify-between">
                      {editingSceneId === scene.id ? (
                        <input
                          type="text"
                          defaultValue={scene.name}
                          onBlur={(e) =>
                            handleEditSceneName({
                              id: scene.id,
                              newName: e.target.value,
                              setScenes,
                              setIsLoading,
                              url,
                              setEditingSceneId,
                            })
                          }
                          className="p-1 rounded-md bg-gray-700 text-white w-full"
                          autoFocus
                        />
                      ) : (
                        <div
                          className={`p-1 px-2 cursor-pointer flex justify-between rounded-md transition-colors duration-200 w-full ${
                            selectedScene === scene.id
                              ? "bg-blue-500 text-white"
                              : darkMode
                              ? "bg-gray-800 hover:bg-gray-700"
                              : "bg-gray-400 hover:bg-gray-500"
                          }`}
                          onDoubleClick={() => setEditingSceneId(scene.id)}
                          onClick={() => handleSceneSelection(scene)}
                        >
                          <span className="flex-grow font-semibold">{scene.name}</span>
                          <div className="flex gap-1">
                            <Tooltip content="حذف صحنه">
                              <Button
                                className="min-w-fit h-fit p-1"
                                size="sm"
                                variant="flat"
                                color="default"
                                onPress={() =>
                                  deleteScene({
                                    id: scene.id,
                                    setIsLoading,
                                    scenes,
                                    sources,
                                    setScenes,
                                    setSources,
                                    selectedScene,
                                    setSelectedScene,
                                    url,
                                    collections,
                                    setCollections,
                                  })
                                }
                                disabled={scenes.length === 1}
                              >
                                <FaTrashAlt size={14} />
                              </Button>
                            </Tooltip>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </>
              ) : (
                <>صحنه‌ای وجود ندارد.</>
              )}
            </ul>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Modal */}
      <Modal scrollBehavior="outside" dir="rtl" isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="mt-5">
            <Input
              placeholder="نام مجموعه"
              value={newCollectionName}
              isInvalid={newCollectionName ? false : isInvalid}
              onChange={(e) => setNewCollectionName(e.target.value)}
            />
          </ModalHeader>
          <ModalFooter>
            <Button className="w-full" color="primary" onPress={() => handleSaveCollection()}>
              ذخیره
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CollectionsSidebar;
