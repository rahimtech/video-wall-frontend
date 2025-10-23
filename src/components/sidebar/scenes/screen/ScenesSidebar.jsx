import React from "react";
import { Button, Chip, Tooltip } from "@nextui-org/react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { MdAddBox } from "react-icons/md";
import { useMyContext } from "@/context/MyContext";
import api from "../../../../api/api";
import Swal from "sweetalert2";

const ScenesSidebar = () => {
  const {
    darkMode,
    scenes,
    selectedScene,
    setSelectedScene,
    editingSceneId,
    setEditingSceneId,
    filteredScenes,
    addScene,
    setIsLoading,
    setScenes,
    deleteScene,
    handleEditSceneName,
    setCollections,
    selectedCollection,
    url,
    setSources,
    sources,
    collections,
    generateScene,
    videoWalls,
    createNewStage,
  } = useMyContext();

  const selectedScenes = scenes.filter((scene) => filteredScenes?.some((f) => f.id === scene.id));
  const unselectedScenes = scenes.filter(
    (scene) => !filteredScenes?.some((f) => f.id === scene.id)
  );

  const handleSceneSelection = async (scene) => {
    if (selectedScene == scene.id) return;
    localStorage.setItem("sceneId", scene.id);

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

  return (
    <div
      dir="rtl"
      className="p-2 rounded-lg h-full overflow-auto"
      style={{
        color: darkMode ? "#ffffff" : "#000000",
      }}
    >
      {/* Fixed Header */}
      <div className="sticky top-[-10px] z-[50] px-3 py-[2px] bg-inherit">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-md font-semibold">صحنه‌ها</h2>
          <Button
            className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1 text-xl`}
            size="lg"
            variant="light"
            color="default"
            onPress={() =>
              addScene({
                collections,
                setIsLoading,
                scenes,
                setScenes,
                setSelectedScene,
                setCollections,
                selectedCollection,
                url,
                videoWalls,
                createNewStage,
                // selectedScene,
                // generateMonitorsForLayer,
                // getSelectedScene,
              })
            }
          >
            <MdAddBox />
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <ul className="flex flex-col gap-2">
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
                  className="p-2 rounded-md bg-gray-700 text-white w-full"
                  autoFocus
                />
              ) : (
                <div
                  className={`p-2 cursor-pointer flex justify-between rounded-md transition-colors duration-200 w-full ${
                    selectedScene === scene.id
                      ? "bg-blue-500 text-white"
                      : darkMode
                      ? " bg-gray-500 hover:bg-gray-700"
                      : "bg-gray-500 hover:bg-gray-500"
                  }`}
                  onClick={() => handleSceneSelection(scene)}
                >
                  <span className="flex-grow font-semibold">
                    {scene.name}
                    <Chip
                      size="sm"
                      color="secondary"
                      className="mr-2"
                      classNames={{ content: "text-[10px]" }}
                      variant="solid"
                    >
                      {collections.find((item) => item.id == selectedCollection).name}
                    </Chip>
                    {filteredScenes?.find((f) => f.id == scene.id) ? " (منتخب) " : ""}
                  </span>
                  <div className="flex gap-1">
                    <Tooltip content="ویرایش نام">
                      <Button
                        className="min-w-fit h-fit p-1"
                        size="sm"
                        variant="flat"
                        color="default"
                        onPress={() => {
                          Swal.fire({
                            title: "تغییر نام صحنه",
                            icon: "warning",
                            input: "text",
                            inputValue: scene.name,
                            showCancelButton: true,
                            cancelButtonText: "لغو",
                            confirmButtonColor: "limegreen",
                            cancelButtonColor: "gray",
                            confirmButtonText: "ذخیره",
                          }).then(async (result) => {
                            if (result.isConfirmed) {
                              setEditingSceneId(scene.id);
                              handleEditSceneName({
                                id: scene.id,
                                newName: result.value,
                                setScenes,
                                setIsLoading,
                                url,
                                setEditingSceneId,
                              });
                            } else {
                              native = true;
                            }
                          });
                        }}
                      >
                        <FaEdit size={14} />
                      </Button>
                    </Tooltip>
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

          {unselectedScenes?.map((scene) => (
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
                  className="p-2 rounded-md bg-gray-700 text-white w-full"
                  autoFocus
                />
              ) : (
                <div
                  className={`p-2 cursor-pointer flex justify-between rounded-md transition-colors duration-200 w-full ${
                    selectedScene === scene.id
                      ? "bg-blue-500 text-white"
                      : darkMode
                      ? "bg-gray-600 hover:bg-gray-600"
                      : "bg-gray-200 hover:bg-gray-400"
                  }`}
                  onClick={() => handleSceneSelection(scene)}
                >
                  <span className="flex-grow">
                    {scene.name}
                    {collections.find((item) => {
                      item.schedules.map((item2) => {
                        return (
                          <Chip
                            size="sm"
                            color="default"
                            className="mx-2"
                            classNames={{ content: "text-[10px]" }}
                            variant="solid"
                          >
                            {item2.name}
                          </Chip>
                        );
                      });
                    })}
                    {filteredScenes?.find((f) => f.id == scene.id) ? " (منتخب) " : ""}
                  </span>
                  <div className="flex gap-1">
                    <Tooltip content="ویرایش نام">
                      <Button
                        className="min-w-fit h-fit p-1"
                        size="sm"
                        variant="flat"
                        color="default"
                        onPress={() => {
                          Swal.fire({
                            title: "تغییر نام صحنه",
                            icon: "warning",
                            input: "text",
                            inputValue: scene.name,
                            showCancelButton: true,
                            cancelButtonText: "لغو",
                            confirmButtonColor: "limegreen",
                            cancelButtonColor: "gray",
                            confirmButtonText: "ذخیره",
                          }).then(async (result) => {
                            if (result.isConfirmed) {
                              setEditingSceneId(scene.id);
                              handleEditSceneName({
                                id: scene.id,
                                newName: result.value,
                                setScenes,
                                setIsLoading,
                                url,
                                setEditingSceneId,
                              });
                            } else {
                              native = true;
                            }
                          });
                        }}
                      >
                        <FaEdit size={14} />
                      </Button>
                    </Tooltip>
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
        </ul>
      </div>
    </div>
  );
};

export default ScenesSidebar;
