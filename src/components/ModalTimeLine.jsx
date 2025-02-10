import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  Tooltip,
  useDisclosure,
  Input,
  SelectItem,
} from "@nextui-org/react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { PiTimerBold } from "react-icons/pi";
import { FaPlus, FaTrashAlt, FaArrowUp, FaArrowDown } from "react-icons/fa";

const ModalTimeLine = ({
  darkMode,
  collectionScenes,
  setCollections,
  selectedCollection,
  collections,
  setSelectedCollection,
  collectionSelected,
}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [timeLine, setTimeLine] = useState([]);
  const [selectedScene, setSelectedScene] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [generalTime, setGeneralTime] = useState(null);

  // Load existing timeline for the selected collection
  // useEffect(() => {
  //   const currentCollection = collections.find((col) => col.id === selectedCollection);
  //   setTimeLine(currentCollection?.timeLine || []);
  // }, [selectedCollection, collections]);

  // افزودن صحنه به تایم‌لاین
  const addSceneToTimeLine = () => {
    // if (!selectedScene || !startDate || !endDate || !startTime || !endTime || !generalTime) {
    if (!selectedScene || !generalTime) {
      alert("لطفاً تمام فیلدها را پر کنید.");
      return;
    }

    const newEntry = {
      sceneId: selectedScene.currentKey,
      // startDate: startDate.format("YYYY-MM-DD"),
      // endDate: endDate.format("YYYY-MM-DD"),
      // startTime,
      // endTime,
      generalTime,
    };

    setTimeLine((prev) => [...prev, newEntry]);
    resetFields();
  };

  // حذف صحنه از تایم‌لاین
  const removeSceneFromTimeLine = (index) => {
    setTimeLine((prev) => prev.filter((_, i) => i !== index));
  };

  // جابجا کردن صحنه به بالا
  const moveSceneUp = (index) => {
    if (index === 0) return;
    setTimeLine((prev) => {
      const newTimeline = [...prev];
      [newTimeline[index], newTimeline[index - 1]] = [newTimeline[index - 1], newTimeline[index]];
      return newTimeline;
    });
  };

  // جابجا کردن صحنه به پایین
  const moveSceneDown = (index) => {
    if (index === timeLine.length - 1) return;
    setTimeLine((prev) => {
      const newTimeline = [...prev];
      [newTimeline[index], newTimeline[index + 1]] = [newTimeline[index + 1], newTimeline[index]];
      return newTimeline;
    });
  };

  // ذخیره تایم‌لاین در کالکشن
  const saveTimeLineToCollection = () => {
    setCollections((prev) =>
      prev.map((collection) =>
        collection.id === selectedCollection ? { ...collection, timeLine } : collection
      )
    );
    onOpenChange(false);
  };

  // ریست کردن فیلدهای ورودی
  const resetFields = () => {
    setSelectedScene("");
    // setStartDate(null);
    // setEndDate(null);
    // setStartTime("");
    // setEndTime("");
    setGeneralTime(null);
  };

  const handleOpenModal = (collection = null) => {
    if (collection) {
      setSelectedCollection(collection.id);
    } else {
      setSelectedCollection([]);
    }
    onOpen();
  };

  return (
    <>
      <Tooltip content="تایم لاین صحنه‌ها" placement="top">
        <Button
          className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
          size="sm"
          variant="light"
          color="default"
          onPress={(e) => {
            handleOpenModal(collectionSelected);
          }}
        >
          <PiTimerBold size={15} />
        </Button>
      </Tooltip>

      <Modal
        scrollBehavior="outside"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className={`rounded-lg bg-white text-black`}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-lg font-bold border-b pb-2">
                تایم لاین صحنه‌ها
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  {/* 
                  <div className="flex gap-4">
                    <DatePicker
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="تاریخ شروع"
                      format="YYYY-MM-DD"
                      calendar={persian}
                      locale={persian_fa}
                      className="w-full"
                    />
                    <DatePicker
                      value={endDate}
                      onChange={setEndDate}
                      placeholder="تاریخ پایان"
                      format="YYYY-MM-DD"
                      calendar={persian}
                      locale={persian_fa}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Input
                      className="w-full"
                      label="ساعت شروع"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                    <Input
                      className="w-full"
                      label="ساعت پایان"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div> */}

                  <Select
                    className="w-full"
                    placeholder="انتخاب صحنه"
                    value={selectedScene}
                    onSelectionChange={setSelectedScene}
                    aria-label="انتخاب صحنه"
                  >
                    {collectionScenes.map((scene) => (
                      <SelectItem key={scene.id} value={scene.id}>
                        {scene.name}
                      </SelectItem>
                    ))}
                  </Select>

                  <div className="flex gap-4">
                    <Input
                      className="w-full"
                      label="ساعت شروع"
                      type="number"
                      value={generalTime}
                      onChange={(e) => setGeneralTime(e.target.value)}
                    />
                  </div>

                  <Button
                    color="primary"
                    className="flex items-center gap-2 justify-center w-full"
                    onPress={addSceneToTimeLine}
                  >
                    <FaPlus /> افزودن به تایم لاین
                  </Button>
                </div>

                <div dir="rtl" className="mt-4">
                  {timeLine.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {timeLine.map((entry, index) => (
                        <li
                          key={index}
                          className={`flex items-center justify-between p-3 shadow-md bg-gray-100 text-black rounded-md`}
                        >
                          <div className="text-sm">
                            <strong>صحنه {entry.sceneId}:</strong>{" "}
                            {collectionScenes.find((s) => s.id === entry.sceneId)?.name}
                            {/* <br />
                            <strong>تاریخ:</strong> {entry.startDate} تا {entry.endDate}
                            <br />
                            <strong>ساعت:</strong> {entry.startTime} تا {entry.endTime} */}
                            <br />
                            <strong>مدت زمان:</strong> {entry.generalTime}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              onPress={() => moveSceneUp(index)}
                              aria-label="جابجا کردن به بالا"
                            >
                              <FaArrowUp />
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              onPress={() => moveSceneDown(index)}
                              aria-label="جابجا کردن به پایین"
                            >
                              <FaArrowDown />
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="danger"
                              onPress={() => removeSceneFromTimeLine(index)}
                              aria-label="حذف صحنه"
                            >
                              <FaTrashAlt />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-gray-500">تایم لاینی تعریف نشده است.</p>
                  )}
                </div>
              </ModalBody>
              <ModalFooter className="flex justify-between">
                <Button color="danger" variant="light" onPress={onClose} className="w-1/3">
                  لغو
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    saveTimeLineToCollection();
                    onClose();
                  }}
                  className="w-2/3"
                >
                  ذخیره
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default ModalTimeLine;
