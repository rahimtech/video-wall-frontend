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
                      key={item["Device ID"]}
                      className="dark:bg-gray-800 dark:text-gray-200 bg-gray-50 text-gray-800 shadow-md"
                      isHoverable
                      isPressable
                      variant="bordered"
                      dir="rtl"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            {item.Disconnected === "No" ? (
                              <div className="blob"></div>
                            ) : (
                              <div className="blobred"></div>
                            )}

                            <h3 className="text-lg font-semibold">
                              {item["Name"] || "نام نامشخص"}
                            </h3>
                          </div>
                          {/* <span className="text-sm text-gray-500 dark:text-gray-400">
                            {item["Device ID"]}
                          </span> */}
                        </div>
                      </CardHeader>
                      <Divider />
                      <CardBody>
                        <div dir="rtl" className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <strong>رزولوشن:</strong> {item.Resolution}
                          </div>
                          <div>
                            <strong>فرکانس:</strong> {item.Frequency}Hz
                          </div>
                          <div>
                            <strong>آداپتور:</strong> {item.Adapter}
                          </div>
                          <div>
                            <strong>کالر بیت:</strong> {item.Colors}-بیت
                          </div>
                          <div>
                            <strong>موقعیت:</strong>
                            {`X: ${item["Left-Top"].split(",")[0]}, Y: ${
                              item["Left-Top"].split(",")[1]
                            }`}
                          </div>
                          <div>
                            <strong>نام دستگاه:</strong> {item.Name}
                          </div>
                          <div>
                            <strong>رزولوشن حداکثری:</strong> {item["Maximum Resolution"]}
                          </div>
                          <div>
                            <strong>وضعیت:</strong> {item.Primary === "Yes" ? "اصلی" : "ثانویه"}
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
