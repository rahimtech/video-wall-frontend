import React, { useState } from "react";
import {
  Button,
  Tooltip,
  Modal,
  Checkbox,
  Input,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { MdAddBox, MdEdit } from "react-icons/md";
import Swal from "sweetalert2";
import { PiTimerBold } from "react-icons/pi";
import ModalTimeLine from "./ModalTimeLine";
import api from "@/api/api";
import { useMyContext } from "@/context/MyContext";

const CollectionsSidebar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [selectedScenes, setSelectedScenes] = useState([]);
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
  } = useMyContext();
  let idSave = null;
  const handleCollectionClick = (key) => {
    setSelectedCollection(key);
    setSelectedScene(collections.find((item) => item.id == key).schedules[0]);
  };

  const handleOpenModal = (collection = null) => {
    if (collection) {
      idSave = collection.id;
      setEditingCollection(collection.id);
      setNewCollectionName(collection.name);
      setSelectedScenes(collection?.schedules?.map((s) => s.scene_id));
    } else {
      setEditingCollection(null);
      setNewCollectionName("");
      // setSelectedScenes([]);
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

      // به روز رسانی state collections با مجموعه‌های جدید
      setCollections(newCollections);
    } else {
      try {
        setIsLoading(true);
        console.log("tesrt");
        const dataCol = await api.createProgram(url, {
          name: newCollectionName,
          metadata: {},
        });
        let newCol = { id: dataCol.id, name: newCollectionName, scenes: selectedScenes };
        setCollections((prev) => [...prev, newCol]);

        setSelectedCollection(newCol.id);
        setSelectedScene(newCol.scenes[0]);
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    }

    onClose(); // بستن مدال
  };

  const handleDeleteCollection = (id) => {
    if (collections.length <= 1) {
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

  const handleSceneSelection = (sceneId, isSelected) => {
    setSelectedScenes((prev) =>
      isSelected ? [...prev, sceneId] : prev.filter((id) => id !== sceneId)
    );
  };

  return (
    <div
      dir="rtl"
      className="p-2 rounded-lg h-full  overflow-auto"
      style={{
        backgroundColor: darkMode ? "#1a1a1a" : "#eaeaea",
        color: darkMode ? "#ffffff" : "#000000",
      }}
    >
      <div className="flex justify-between px-2 items-center mb-3">
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

      <ul className="flex flex-col gap-2">
        {collections ? (
          collections.map((collection) => (
            <li
              key={collection.id}
              onClick={() => handleCollectionClick(collection.id)}
              className={`text-sm flex items-center justify-between w-full ${
                selectedCollection && selectedCollection === collection.id
                  ? "bg-blue-500 text-white"
                  : darkMode
                  ? "bg-gray-700"
                  : "bg-gray-300"
              } p-2 rounded-md shadow-sm cursor-pointer`}
            >
              <span className="truncate">{collection.name}</span>
              <div className="flex gap-1">
                <Button
                  className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                  size="sm"
                  variant="light"
                  color="default"
                  onPress={(e) => {
                    handleOpenModal(collection);
                  }}
                >
                  <MdEdit size={15} />
                </Button>
                <ModalTimeLine
                  setCollections={setCollections}
                  darkMode={darkMode}
                  collectionScenes={filteredScenes}
                  collections={collections}
                  selectedCollection={selectedCollection}
                  setSelectedCollection={setSelectedCollection}
                  collectionSelected={collection}
                />
                <Button
                  className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                  size="sm"
                  variant="light"
                  color="default"
                  onPress={(e) => {
                    handleDeleteCollection(collection.id);
                  }}
                >
                  <FaTrashAlt size={15} />
                </Button>
              </div>
            </li>
          ))
        ) : (
          <div>load</div>
        )}
      </ul>

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
          {/* <ModalBody>
            {scenes.map((scene) => (
              <Checkbox
                key={scene.id}
                isSelected={selectedScenes.includes(scene.id)}
                onValueChange={(isSelected) => handleSceneSelection(scene.id, isSelected)}
              >
                {scene.name}
              </Checkbox>
            ))}
          </ModalBody> */}
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
