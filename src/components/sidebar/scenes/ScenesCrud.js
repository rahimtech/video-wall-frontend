import Swal from "sweetalert2";
import api from "@/api/api";

export const addScene = async ({
  collections,
  setIsLoading,
  scenes,
  setScenes,
  setSelectedScene,
  setCollections,
  selectedCollection,
  url,
}) => {
  const newId = scenes.length > 0 ? Math.max(...scenes.map((scene) => scene.id)) + 1 : 1;
  const newLayer = new Konva.Layer();
  const newScene = {
    id: newId,
    name: `صحنه ${newId}`,
    resources: [],
    layer: newLayer,
  };

  try {
    setIsLoading(true);
    await api.createScene(url, { name: newScene.name, metadata: {} });
  } catch {
    console.log("Faild Add Scene");
  } finally {
    setIsLoading(false);
  }

  setCollections((prev) =>
    Array.isArray(prev)
      ? prev.map((item) => {
          return item.id == selectedCollection
            ? { ...item, scenes: [...(item?.scenes || []), newId] }
            : item;
        })
      : prev
  );

  setScenes((prevScenes) => [...prevScenes, newScene]);
  setSelectedScene(newId);
  // selectedCollection();

  Swal.fire({
    title: "صحنه اضافه شد",
    icon: "success",
    confirmButtonText: "متوجه شدم",
    confirmButtonColor: "green",
  });
};

export const deleteScene = ({
  id,
  setIsLoading,
  setScenes,
  scenes,
  sources,
  setSources,
  selectedScene,
  setSelectedScene,
  url,
}) => {
  Swal.fire({
    title: "آيا مطمئن هستید؟",
    showDenyButton: true,
    showCancelButton: false,
    confirmButtonText: "بله",
    denyButtonText: `خیر`,
    confirmButtonColor: "green",
    denyButtonColor: "gray",
  }).then((result) => {
    if (result.isConfirmed) {
      if (scenes.length <= 1) {
        Swal.fire({
          title: "باید حتما یک صحنه وجود داشته باشد!",
          icon: "warning",
          confirmButtonText: "باشه",
          confirmButtonColor: "gray",
        });
        return;
      }
      const updatedScenes = scenes.filter((scene) => scene.id !== id);
      const updatedSourcesUsage = sources.filter((item) => item.sceneId !== id);

      try {
        setIsLoading(true);
        api.deleteScene(`${url}`, id);
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }

      // console.log("updatedSourcesUsage::: ", updatedSourcesUsage);
      setScenes(updatedScenes);
      setSources(updatedSourcesUsage);
      if (selectedScene === id && updatedScenes.length > 0) {
        setSelectedScene(updatedScenes[0].id);
      }
    }
  });
};

export const handleEditSceneName = ({
  id,
  newName,
  setScenes,
  setIsLoading,
  url,
  setEditingSceneId,
}) => {
  setScenes((prevScenes) =>
    prevScenes.map((scene) => (scene.id === id ? { ...scene, name: newName } : scene))
  );

  try {
    setIsLoading(true);
    api.updateScene(url, id, { name: newName });
  } catch (err) {
    console.log(err);
  } finally {
    setIsLoading(false);
  }

  setEditingSceneId(null);
};
