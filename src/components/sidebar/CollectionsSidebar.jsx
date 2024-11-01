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

const CollectionsSidebar = ({ scenes, darkMode, collections, setCollections }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  console.log("isInvalid::: ", isInvalid);
  const [selectedScenes, setSelectedScenes] = useState([]);
  const [editingCollection, setEditingCollection] = useState(null);

  const handleOpenModal = (collection = null) => {
    if (collection) {
      // حالت ویرایش
      setEditingCollection(collection.id);
      setNewCollectionName(collection.name);
      setSelectedScenes(collection.scenes);
    } else {
      // حالت افزودن
      setEditingCollection(null);
      setNewCollectionName("");
      setSelectedScenes([]);
    }
    onOpen();
  };

  const handleSaveCollection = () => {
    if (newCollectionName.length <= 0) {
      setIsInvalid(true);
      return;
    }
    setIsInvalid(false);
    if (editingCollection) {
      // ویرایش مجموعه
      setCollections((prev) =>
        prev.map((collection) =>
          collection.id === editingCollection
            ? { ...collection, name: newCollectionName, scenes: selectedScenes }
            : collection
        )
      );
    } else {
      // افزودن مجموعه جدید
      setCollections((prev) => [
        ...prev,
        { id: Date.now(), name: newCollectionName, scenes: selectedScenes },
      ]);
    }
    onClose();
  };

  const handleDeleteCollection = (id) => {
    Swal.fire({
      title: "آیا مطمئن هستید؟",
      icon: "warning",
      showCancelButton: true,
      cancelButtonText: "خیر",
      confirmButtonColor: "limegreen",
      cancelButtonColor: "#d33",
      confirmButtonText: "بله",
    }).then(async (result) => {
      console.log("result::: ", result);
      if (result.isConfirmed) {
        setCollections((prev) => prev.filter((collection) => collection.id !== id));
      }
    });
  };

  const handleSceneSelection = (sceneId, isSelected) => {
    setSelectedScenes((prev) =>
      isSelected ? [...prev, sceneId] : prev.filter((id) => id !== sceneId)
    );
  };

  return (
    <div
      dir="rtl"
      className=" p-3 border-r border-white h-full overflow-auto"
      style={{
        backgroundColor: darkMode ? "#1a1a1a" : "#eaeaea",
        color: darkMode ? "#ffffff" : "#000000",
      }}
    >
      <div className="flex justify-between px-2 items-center mb-3">
        <h2 className="text-md font-semibold">مجموعه‌ها</h2>

        <Button
          className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1 text-xl`}
          size="lg"
          variant="light"
          color="default"
          onPress={onOpen}
        >
          <MdAddBox />
        </Button>
      </div>

      <ul className="flex flex-col gap-2">
        {collections.map((collection) => (
          <li
            key={collection.id}
            className={`text-sm flex flex-wrap items-center justify-between  ${
              darkMode ? "bg-gray-700" : "bg-gray-300"
            } p-2 rounded-md shadow-sm`}
          >
            <span>{collection.name}</span>
            <div className="flex gap-1">
              <Button
                className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                size="sm"
                variant="light"
                color="default"
                onClick={() => handleOpenModal(collection)}
              >
                <MdEdit />
              </Button>
              <Button
                className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                size="sm"
                variant="light"
                color="default"
                onClick={() => handleDeleteCollection(collection.id)}
              >
                <FaTrashAlt />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Modal dir="rtl" isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="mt-5">
            <Input
              placeholder="نام مجموعه"
              value={newCollectionName}
              isInvalid={newCollectionName ? false : isInvalid}
              onChange={(e) => setNewCollectionName(e.target.value)}
            />
          </ModalHeader>
          <ModalBody>
            {scenes.map((scene) => (
              <Checkbox
                key={scene.id}
                isSelected={selectedScenes.includes(scene.id)}
                onChange={(isSelected) => handleSceneSelection(scene.id, isSelected)}
              >
                {scene.name}
              </Checkbox>
            ))}
          </ModalBody>
          <ModalFooter>
            <Button className="w-full" color="primary" onClick={handleSaveCollection}>
              ذخیره
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CollectionsSidebar;
