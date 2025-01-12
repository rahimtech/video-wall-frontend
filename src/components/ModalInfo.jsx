import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Tooltip,
} from "@nextui-org/react";
import { MdInfo } from "react-icons/md";

const ModalInfo = ({ darkMode }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Tooltip content={"درباره نرم‌افزار"}>
        <Button
          className={`${darkMode ? "dark" : "light"} min-w-[35px] h-[33px] rounded-lg  p-1`}
          size="lg"
          variant="solid"
          color={"default"}
          onPress={onOpen}
        >
          <MdInfo size={17} />
        </Button>
      </Tooltip>

      <Modal dir="rtl" scrollBehavior="outside" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>درباره شرکت و نرم‌افزار</ModalHeader>
              <ModalBody>
                <div className="text-justify leading-6">
                  <p className="text-lg font-bold">شرکت مبنا رایانه کیان (MRK)</p>
                  <p className="mt-2">
                    شرکت مبنا رایانه کیان یکی از شرکت‌های پیشرو در زمینه فناوری اطلاعات و ارتباطات
                    در ایران است. این شرکت با بهره‌گیری از تکنولوژی‌های روز دنیا، محصولات و خدمات
                    متنوعی در حوزه سخت‌افزار و نرم‌افزار ارائه می‌دهد.
                  </p>
                  <p className="mt-4 text-lg font-bold">نرم‌افزار ویدیو وال کنترلر</p>
                  <p className="mt-2">
                    نرم‌افزار ویدیو وال کنترلر (Video Wall Controller) یکی از محصولات پیشرفته این
                    شرکت است که به کاربران امکان مدیریت، کنترل و تنظیم نمایشگرهای ویدیو وال را به
                    ساده‌ترین شکل ممکن می‌دهد. این نرم‌افزار قابلیت‌هایی از جمله:
                  </p>
                  <ul className="list-disc pl-6 mt-2">
                    <li>مدیریت نمایشگرها در ابعاد مختلف</li>
                    {/* <li>تنظیم رزولوشن و موقعیت نمایشگرها</li> */}
                    <li>پشتیبانی از مانیتورهای چندگانه</li>
                    <li>نمایش محتوای متنوع به صورت پویا</li>
                  </ul>
                  <p className="mt-4">
                    برای کسب اطلاعات بیشتر، می‌توانید به وب‌سایت رسمی شرکت مراجعه کنید:
                  </p>
                  <a
                    href="https://mrk.co.ir/videowall/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    www.mrk.co.ir
                  </a>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" fullWidth variant="light" onPress={onClose}>
                  بستن
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default ModalInfo;
