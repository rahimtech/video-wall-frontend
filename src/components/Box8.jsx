import { Resizable } from "re-resizable";

export default function Box8() {
  return (
    <div className="h-full w-full">
      <Resizable
        id="Monitor-4-Section"
        defaultSize={{
          width: "100%",
          height: "100%",
        }}
        className=" flex flex-col gap-1 relative min-w-full min-h-full bg-slate-500 border-dashed border-4 bg-opacity-30 border-red-800 p-2 "
      >
        <div className="handles">
          <div className="handle top-left"></div>
          <div className="handle top-center"></div>
          <div className="handle top-right"></div>
          <div className="handle middle-left"></div>
          <div className="handle middle-right"></div>
          <div className="handle bottom-left"></div>
          <div className="handle bottom-center"></div>
          <div className="handle bottom-right"></div>
        </div>
        <div className="flex w-full h-full gap-1">
          <div className="w-full h-full bg-slate-800 text-gray-400 text-5xl !flex justify-center items-center">
            video 1
          </div>
          <div className="w-full h-full bg-slate-800 text-gray-400 text-5xl !flex justify-center items-center">
            video 2
          </div>
          <div className="w-full h-full bg-slate-800 text-gray-400 text-5xl !flex justify-center items-center">
            video 3
          </div>
          <div className="w-full h-full bg-slate-800 text-gray-400 text-5xl !flex justify-center items-center">
            vide0 4
          </div>
        </div>
        <div className="flex w-full h-full gap-1">
          <div className="w-full h-full bg-slate-800 text-gray-400 text-5xl !flex justify-center items-center">
            video 5
          </div>
          <div className="w-full h-full bg-slate-800 text-gray-400 text-5xl !flex justify-center items-center">
            video 6
          </div>
          <div className="w-full h-full bg-slate-800 text-gray-400 text-5xl !flex justify-center items-center">
            video 7
          </div>
          <div className="w-full h-full bg-slate-800 text-gray-400 text-5xl !flex justify-center items-center">
            vide0 8
          </div>
        </div>
      </Resizable>
    </div>
  );
}
