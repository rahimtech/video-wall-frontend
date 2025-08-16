import React from "react";
import { Button, Card, CardBody, Tabs, Tab } from "@nextui-org/react";

export default function LandingDoc() {
  return (
    <main className="bg-[#f8fafc] dark:bg-[#1E232A] min-h-screen text-gray-900 dark:text-gray-100">
      {/* ===== Hero Section ===== */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">نرم‌افزار مدیریت ویدیووال</h1>
        <p className="text-lg md:text-xl max-w-2xl mb-6">
          ابزاری قدرتمند برای مدیریت منابع، صحنه‌ها، برنامه‌ها و نمایشگرها با استفاده از React +
          Konva + NextUI
        </p>
        <div className="flex gap-4">
          <Button color="primary" size="lg">
            شروع کنید
          </Button>
          <Button color="secondary" size="lg" variant="bordered">
            مشاهده مستندات
          </Button>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="py-16 px-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {[
          {
            title: "مدیریت منابع (Resources)",
            desc: "آپلود و مدیریت فایل‌های تصویری، ویدیو و وب.",
          },
          { title: "صحنه‌ها (Scenes)", desc: "ایجاد و ویرایش صحنه‌ها با قابلیت Drag & Drop." },
          { title: "برنامه‌ها (Collections)", desc: "مدیریت مجموعه‌ای از صحنه‌ها به صورت برنامه." },
          { title: "مانیتورها", desc: "اتصال، وضعیت آنلاین/آفلاین و مدیریت ویدیووال." },
          { title: "Zoom & Pan", desc: "بزرگ‌نمایی و جابه‌جایی صحنه‌ها با Konva و wheel موس." },
          { title: "Real-time", desc: "اتصال زنده با Socket.IO برای مدیریت نمایشگرها." },
        ].map((f, i) => (
          <Card key={i} shadow="sm" className="p-4">
            <CardBody>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p>{f.desc}</p>
            </CardBody>
          </Card>
        ))}
      </section>

      {/* ===== Documentation (Tabs) ===== */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">مستندات نرم‌افزار</h2>
        <Tabs aria-label="Docs" variant="bordered" fullWidth>
          <Tab key="context" title="Context & State">
            <p>
              نرم‌افزار از Context API برای مدیریت state استفاده می‌کند. توابعی مثل{" "}
              <code>setScenes</code>، <code>setVideoWalls</code>، و{" "}
              <code>setMonitorConnection</code> در دسترس هستند.
            </p>
          </Tab>
          <Tab key="scenes" title="Scenes & Layers">
            <p>
              ساختار اصلی صحنه‌ها با Konva Stage/Layer مدیریت می‌شود. هر مانیتور به صورت یک Group
              رسم می‌شود و قابلیت Drag/Drop و Zoom دارد.
            </p>
          </Tab>
          <Tab key="resources" title="Resources Sidebar">
            <p>
              منابع شامل فایل‌ها، ویدیوها و Iframeها هستند. این بخش امکان آپلود و استفاده مستقیم در
              صحنه‌ها را می‌دهد.
            </p>
          </Tab>
          <Tab key="update" title="Update Source">
            <p>
              تابع <code>updateSource</code> منابع را آپدیت می‌کند و بسته به نوع (Image یا Rect)
              width/height را تغییر می‌دهد.
            </p>
          </Tab>
        </Tabs>
      </section>

      {/* ===== Footer ===== */}
      <footer className="py-8 text-center border-t border-gray-300 dark:border-gray-700">
        <p>© {new Date().getFullYear()} VideoWall Manager — ساخته شده با ❤️</p>
      </footer>
    </main>
  );
}
