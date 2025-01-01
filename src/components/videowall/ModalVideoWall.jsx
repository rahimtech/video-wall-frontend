import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Tooltip,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Badge,
} from "@nextui-org/react";
import { BsGrid3X3 } from "react-icons/bs";

export default function ModalVideoWall({ darkMode, videoWall }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Tooltip content="جزئیات ویدئووال">
        <Button
          className={`${darkMode ? "dark" : "light"} min-w-[35px] h-[33px] rounded-lg p-1`}
          size="lg"
          variant="solid"
          color="default"
          onPress={onOpen}
        >
          <BsGrid3X3 size={20} />
        </Button>
      </Tooltip>
      <Modal
        scrollBehavior="outside"
        className="z-[100]"
        dir="rtl"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-lg font-bold">
                جزئیات ویدیووال‌ها
              </ModalHeader>
              <ModalBody>
                <div dir="rtl" className="w-full h-full flex flex-col gap-4 overflow-auto">
                  {videoWall.map((item) => (
                    <Card
                      key={item.id}
                      className="dark:bg-gray-800 dark:text-gray-200 bg-gray-50 text-gray-800 shadow-md"
                      isHoverable
                      isPressable
                      variant="bordered"
                      dir="rtl"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Badge
                              color={item.internal ? "primary" : "secondary"}
                              variant="flat"
                              className="text-xs"
                            >
                              {item.internal ? "داخلی" : "خارجی"}
                            </Badge>
                            <h3 className="text-lg font-semibold">{item.name || "نام نامشخص"}</h3>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(item.created_at).toLocaleDateString("fa-IR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </CardHeader>
                      <Divider />
                      <CardBody>
                        <div dir="rtl" className="grid grid-cols-2 gap-2 text-sm rtl ">
                          <div>
                            <strong>عرض:</strong> {item.width}px
                          </div>
                          <div>
                            <strong>ارتفاع:</strong> {item.height}px
                          </div>
                          <div>
                            <strong>موقعیت X:</strong> {item.x}px
                          </div>
                          <div>
                            <strong>موقعیت Y:</strong> {item.y}px
                          </div>
                          <div>
                            <strong>نرخ تازه‌سازی:</strong> {item.refreshRate}Hz
                          </div>
                          <div>
                            <strong>چرخش:</strong> {item.rotation}°
                          </div>
                          <div>
                            <strong>مقیاس:</strong> {item.scaleFactor}
                          </div>
                          <div>
                            <strong>DPI:</strong> {item.dpi || "نامشخص"}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button fullWidth color="danger" variant="light" onPress={onClose}>
                  بستن
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
