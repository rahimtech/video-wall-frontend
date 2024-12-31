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
const CollectionsSidebar = ({
  scenes,
  darkMode,
  collections,
  setCollections,
  setSelectedCollection,
  selectedCollection,
  setSelectedScene,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [selectedScenes, setSelectedScenes] = useState([]);
  const [editingCollection, setEditingCollection] = useState(null);

  const handleCollectionClick = (key) => {
    setSelectedCollection(key);

    setSelectedScene(collections.find((item) => item.id == key).scenes[0]);
  };

  const handleOpenModal = (collection = null) => {
    if (collection) {
      setEditingCollection(collection.id);
      setNewCollectionName(collection.name);
      setSelectedScenes(collection.scenes);
    } else {
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
      setCollections((prev) =>
        prev.map((collection) => {
          if (collection.id === editingCollection) {
            let newCol = { ...collection, name: newCollectionName, scenes: selectedScenes };
            setSelectedCollection(selectedCollection); // Set the selected collection in App component
            if (collection.scenes.length > 0) {
              setSelectedScene(collection.scenes[0]); // Select the first scene in the collection
            }
            return newCol;
          } else {
            return collection;
          }
        })
      );
    } else {
      let newCol = { id: Date.now(), name: newCollectionName, scenes: selectedScenes };
      let uniqId = Date.now();
      setCollections((prev) => [...prev, newCol]);

      setSelectedCollection(uniqId);
      setSelectedScene(newCol.scenes[0]);

      // Set the selected collection in App component
    }
    onClose();
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
          setCollections((prev) => prev.filter((collection) => collection.id !== id));
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
        <h2 className="text-md font-semibold">مجموعه‌ها</h2>

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
        {collections.map((collection) => (
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
                  e.stopPropagation(); // Prevent triggering collection click
                  handleOpenModal(collection);
                }}
              >
                <MdEdit />
              </Button>
              <Button
                className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                size="sm"
                variant="light"
                color="default"
                onPress={(e) => {
                  e.stopPropagation(); // Prevent triggering collection click
                  handleDeleteCollection(collection.id);
                }}
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
                onValueChange={(isSelected) => handleSceneSelection(scene.id, isSelected)}
              >
                {scene.name}
              </Checkbox>
            ))}
          </ModalBody>
          <ModalFooter>
            <Button className="w-full" color="primary" onPress={handleSaveCollection}>
              ذخیره
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CollectionsSidebar;
