import React, { useState, useEffect, useRef } from "react";

const NvidiaMosaicSetup = () => {
  // Mock data for demonstration
  const mockVideoWalls = [
    {
      id: 1,
      name: "Dell Alienware2310",
      width: 1920,
      height: 1080,
      output: "0,0",
      refreshRate: 60.0,
      gpu: "Quadro K6000",
      gpuId: 1,
    },
    {
      id: 2,
      name: "Dell Alienware2310",
      width: 1920,
      height: 1080,
      output: "0,1",
      refreshRate: 60.0,
      gpu: "Quadro K6000",
      gpuId: 1,
    },
    {
      id: 3,
      name: "Dell Alienware2310",
      width: 1920,
      height: 1080,
      output: "0,2",
      refreshRate: 60.0,
      gpu: "Quadro K6000",
      gpuId: 2,
    },
    {
      id: 4,
      name: "Dell Alienware2310",
      width: 1920,
      height: 1080,
      output: "0,3",
      refreshRate: 60.0,
      gpu: "Quadro K6000",
      gpuId: 2,
    },
    {
      id: 5,
      name: "Dell Alienware2310",
      width: 1920,
      height: 1080,
      output: "1,0",
      refreshRate: 59.94,
      gpu: "RTX 3080",
      gpuId: 1,
    },
    {
      id: 6,
      name: "Dell Alienware2310",
      width: 1920,
      height: 1080,
      output: "1,1",
      refreshRate: 59.94,
      gpu: "RTX 3080",
      gpuId: 1,
    },
    {
      id: 7,
      name: "Dell Alienware2310",
      width: 1920,
      height: 1080,
      output: "1,2",
      refreshRate: 59.94,
      gpu: "RTX 3080",
      gpuId: 2,
    },
  ];

  // State variables
  const [isOpen, setIsOpen] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [configName, setConfigName] = useState("تنظیم Mosaic");
  const [selectedLayout, setSelectedLayout] = useState("1x4");
  const [orientation, setOrientation] = useState("landscape");
  const [numDisplays, setNumDisplays] = useState(4);
  const [selectedDisplays, setSelectedDisplays] = useState([1, 2, 3, 4]);
  const [arrangedDisplays, setArrangedDisplays] = useState([]);
  const [bezelCorrection, setBezelCorrection] = useState(0);
  const [overlapCol, setOverlapCol] = useState(0);
  const [overlapRow, setOverlapRow] = useState(0);
  const [correctionType, setCorrectionType] = useState("Bezel Correction");
  const [isDragging, setIsDragging] = useState(false);
  const [dragDisplay, setDragDisplay] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [displayPositions, setDisplayPositions] = useState({});
  const [grids, setGrids] = useState([]);
  const [multipleGrids, setMultipleGrids] = useState(false);
  const [currentGrid, setCurrentGrid] = useState(0);
  const [generatedCommand, setGeneratedCommand] = useState("");
  const [selectedResolution, setSelectedResolution] = useState("1920x1080");
  const [selectedRefreshRate, setSelectedRefreshRate] = useState(60);

  const [refreshRate, setRefreshRate] = useState(60);
  const displayAreaRef = useRef(null);

  // Generate layout options based on total monitors
  const layoutOptions = (() => {
    const options = [];
    for (let rows = 1; rows <= 4; rows++) {
      for (let cols = 1; cols <= 4; cols++) {
        if (rows * cols <= numDisplays && rows * cols > 0) {
          options.push(`${rows}x${cols}`);
        }
      }
    }
    return options;
  })();

  const getRotateValue = (orientationValue) => {
    switch (orientationValue) {
      case "portrait":
        return 90;
      case "landscape":
      default:
        return 0;
    }
  };

  const resetDisplayGridPositions = () => {
    const [rows, cols] = selectedLayout.split("x").map(Number);

    // Initialize empty grid
    const emptyGrid = Array(rows)
      .fill()
      .map(() => Array(cols).fill(null));
    setArrangedDisplays(emptyGrid);
  };

  // And make sure this is called in the useEffect when layout changes
  useEffect(() => {
    if (selectedLayout) {
      resetDisplayGridPositions();

      const initialGrid = {
        rows: parseInt(selectedLayout.split("x")[0]),
        cols: parseInt(selectedLayout.split("x")[1]),
        position: { x: 0, y: 0 },
        monitors: [],
        resolution: "1920x1080",
        refreshRate: 60,
        rotate: 0,
        overlapCol: 0,
        overlapRow: 0,
      };

      setGrids([initialGrid]);
    }
  }, [selectedLayout]);

  // Add this to useEffect
  useEffect(() => {
    if (selectedLayout) {
      resetDisplayGridPositions();

      const initialGrid = {
        rows: parseInt(selectedLayout.split("x")[0]),
        cols: parseInt(selectedLayout.split("x")[1]),
        position: { x: 0, y: 0 },
        monitors: [],
        resolution: "1920x1080",
        refreshRate: 60,
        rotate: 0,
        overlapCol: 0,
        overlapRow: 0,
      };

      setGrids([initialGrid]);
    }
  }, [selectedLayout]);

  useEffect(() => {
    if (activeStep === 4 && grids.length > 0) {
      generateNvidiaCommand();
    }
  }, [activeStep, grids, overlapCol, overlapRow, arrangedDisplays]);

  const generateNvidiaCommand = () => {
    let command = "";

    grids.forEach((grid, index) => {
      if (index > 0) {
        command += " nextgrid ";
      }

      const [width, height] = selectedResolution.split("x").map(Number);

      const rotateValue = getRotateValue(orientation);

      // Add grid parameters with the selected resolution, refresh rate, and orientation
      command += `rows=${grid.rows} cols=${grid.cols} res=${width},${height},${selectedRefreshRate} gridPos=${grid.position.x},${grid.position.y} `;

      // Add display outputs
      const gridDisplays = grid.monitors
        .map((id) => mockVideoWalls.find((d) => d.id === id))
        .filter(Boolean);

      gridDisplays.forEach((display) => {
        if (display) {
          command += `out=${display.output} `;
        }
      });

      command += `rotate=${rotateValue} overlapcol=${overlapCol} overlaprow=${overlapRow}`;
    });

    setGeneratedCommand(command);
  };

  const arrangeDisplaysInGrid = (rows, cols) => {
    let arranged = [];

    // Create the display grid
    for (let r = 0; r < rows; r++) {
      let rowDisplays = [];
      for (let c = 0; c < cols; c++) {
        const index = r * cols + c;
        if (index < selectedDisplays.length) {
          const displayId = selectedDisplays[index];
          const display = mockVideoWalls.find((d) => d.id === displayId);

          if (display) {
            rowDisplays.push({
              ...display,
              gridPosition: { row: r, col: c },
            });
          }
        }
      }
      arranged.push(rowDisplays);
    }

    setArrangedDisplays(arranged);
  };

  const handleLayoutSelect = (e) => {
    setSelectedLayout(e.target.value);
  };

  const toggleDisplaySelection = (id) => {
    setSelectedDisplays((prev) =>
      prev.includes(id) ? prev.filter((displayId) => displayId !== id) : [...prev, id]
    );
  };

  const handleDisplayDragStart = (display, e) => {
    e.preventDefault(); // Prevent text selection during drag

    setIsDragging(true);
    setDragDisplay(display);
    const rect = e.target.getBoundingClientRect();
    setDragPos({
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      startX: e.clientX,
      startY: e.clientY,
    });

    // Find and remove the display from the arrangedDisplays grid if it's there
    const newArranged = arrangedDisplays.map((row) =>
      row.map((cell) => (cell?.id === display.id ? null : cell))
    );

    setArrangedDisplays(newArranged);
  };

  const handleDisplayDragMove = (e) => {
    if (!isDragging || !dragDisplay) return;

    const dx = e.clientX - dragPos.startX;
    const dy = e.clientY - dragPos.startY;

    setDisplayPositions((prev) => ({
      ...prev,
      [dragDisplay.id]: {
        x: (prev[dragDisplay.id]?.x || 0) + dx,
        y: (prev[dragDisplay.id]?.y || 0) + dy,
      },
    }));

    setDragPos({
      ...dragPos,
      startX: e.clientX,
      startY: e.clientY,
    });
  };

  const handleDisplayDragEnd = () => {
    setIsDragging(false);
    setDragDisplay(null);
  };

  const handleNextStep = () => {
    if (activeStep < 4) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const addNewGrid = () => {
    if (grids.length < 2) {
      const newGridIndex = grids.length;
      const remainingDisplays = mockVideoWalls
        .filter((d) => !selectedDisplays.slice(0, grids[0].rows * grids[0].cols).includes(d.id))
        .slice(0, 3);

      if (remainingDisplays.length > 0) {
        setMultipleGrids(true);

        const newDisplayIds = remainingDisplays.map((d) => d.id);
        setSelectedDisplays((prev) => [...prev, ...newDisplayIds]);

        const newGrid = {
          rows: 1,
          cols: remainingDisplays.length,
          position: { x: 1775, y: 2160 },
          monitors: newDisplayIds,
          resolution: "1920x1080",
          refreshRate: 59.94,
          rotate: 0,
          overlapCol: 0,
          overlapRow: 0,
        };

        setGrids((prev) => [...prev, newGrid]);
        setCurrentGrid(newGridIndex);
      }
    }
  };

  // Render step 1: Select topology
  const renderStep1 = () => {
    // Parse selected layout dimensions
    const [rows, cols] = selectedLayout.split("x").map(Number);

    return (
      <div className="p-4" dir="rtl">
        <h3 className="text-lg font-bold mb-4">۱. انتخاب توپولوژی</h3>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium">تعداد نمایشگرها:</label>
              <select
                className="w-32 border border-gray-300 rounded p-2"
                value={numDisplays}
                onChange={(e) => setNumDisplays(parseInt(e.target.value))}
              >
                <option value="4">4</option>
                <option value="6">6</option>
                <option value="7">7</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">توپولوژی (ردیف × ستون):</label>
              <select
                className="w-32 border border-gray-300 rounded p-2"
                value={selectedLayout}
                onChange={handleLayoutSelect}
              >
                {layoutOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">جهت نمایشگرها:</label>
              <select
                className="w-32 border border-gray-300 rounded p-2"
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
              >
                <option value="landscape">افقی</option>
                <option value="portrait">عمودی</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">نام پیکربندی:</label>
              <input
                type="text"
                className="w-64 border border-gray-300 rounded p-2"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
              />
            </div>

            <div className="flex items-center mt-4">
              <input type="checkbox" className="ml-2" id="recommended" />
              <label htmlFor="recommended">
                من از <span className="text-blue-600 underline">اتصالات توصیه شده</span> برای
                توپولوژی انتخابی استفاده می‌کنم.
              </label>
            </div>
          </div>

          <div>
            <div className="mb-2 font-medium">توپولوژی انتخاب شده:</div>
            <div className="bg-gray-600 p-4 h-64 flex items-center justify-center">
              {/* نمایش توپولوژی به صورت دقیق */}
              <div
                className="grid gap-1 bg-white"
                style={{
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gridTemplateRows: `repeat(${rows}, 1fr)`,
                  width: `${cols * 80}px`,
                  height: `${rows * 60}px`,
                }}
              >
                {Array.from({ length: rows * cols }).map((_, i) => (
                  <div key={i} className="border border-gray-900 bg-white"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render step 2: Select displays

  const renderStep2 = () => {
    // Group displays by GPU
    const displaysByGpu = {};
    mockVideoWalls.forEach((display) => {
      const gpuKey = `${display.gpu} (${display.gpuId})`;
      if (!displaysByGpu[gpuKey]) {
        displaysByGpu[gpuKey] = [];
      }
      displaysByGpu[gpuKey].push(display);
    });

    return (
      <div className="p-4" dir="rtl">
        <h3 className="text-lg font-bold mb-4">۲. انتخاب نمایشگرها</h3>

        <div className="grid grid-cols-2 gap-6">
          <div className="border border-gray-300 p-3 bg-white">
            <div className="mb-2 font-medium">
              نمایشگرها برای Mosaic: ({selectedDisplays.length} انتخاب شده)
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-1 text-right"></th>
                  <th className="py-1 text-right">نمایشگرها</th>
                  <th className="py-1 text-right">قابلیت همگام‌سازی</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(displaysByGpu).map(([gpuKey, displays]) => (
                  <React.Fragment key={gpuKey}>
                    <tr className="bg-gray-100">
                      <td colSpan="3" className="py-2 px-1 font-medium text-blue-600">
                        {gpuKey}
                      </td>
                    </tr>
                    {displays.map((display) => (
                      <tr key={display.id} className="border-b">
                        <td className="py-1">
                          <input
                            type="checkbox"
                            checked={selectedDisplays.includes(display.id)}
                            onChange={() => toggleDisplaySelection(display.id)}
                          />
                        </td>
                        <td className="py-1">
                          {display.id}. {display.name}
                        </td>
                        <td className="py-1">
                          <span className="bg-green-600 text-white px-1 rounded">✓</span>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-1">نرخ بازخوانی:</label>
              <select
                className="border border-gray-300 rounded p-1 w-32"
                value={selectedRefreshRate}
                onChange={(e) => setSelectedRefreshRate(parseFloat(e.target.value))}
              >
                <option value="60">60 هرتز</option>
                <option value="59.94">59.94 هرتز</option>
              </select>
            </div>

            <div>
              <label className="block mb-1">وضوح هر نمایشگر:</label>
              <select
                className="border border-gray-300 rounded p-1 w-40"
                value={selectedResolution}
                onChange={(e) => setSelectedResolution(e.target.value)}
              >
                <option value="1920x1080">1920 × 1080</option>
                <option value="2560x1440">2560 × 1440</option>
              </select>
            </div>

            <div>
              <label className="block mb-1">وضوح کلی:</label>
              <div className="text-sm p-1 border border-gray-200 bg-gray-50 w-40">
                {selectedLayout === "2x2" ? "3840 × 2160 پیکسل" : "7680 × 1080 پیکسل"}
              </div>
            </div>

            <div className="mt-4 p-3 border border-gray-200 bg-gray-50 rounded">
              <div className="flex items-center">
                <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center ml-2">
                  ✓
                </div>
                <div>
                  <div>
                    {selectedDisplays.length} نمایشگر با همگام‌سازی برای Mosaic انتخاب شده‌اند.
                  </div>
                  <div className="text-sm text-gray-600">
                    به مرحله بعدی بروید تا اطلاعات مربوط به چیدمان نمایشگر خود را وارد کنید.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 font-medium">منابع نمایشگر انتخاب شده:</div>
          <div className="bg-gray-600 p-4 h-48 flex items-center justify-center">
            <div className="flex flex-row gap-4">
              {selectedDisplays.map((id) => {
                const display = mockVideoWalls.find((d) => d.id === id);
                return (
                  <div
                    key={id}
                    className="bg-gradient-to-br from-teal-400 to-green-400 w-24 h-16 border border-gray-700 flex items-center justify-center"
                  >
                    <div className="text-center text-white">
                      <div className="text-2xl font-bold">{id}</div>
                      <div className="text-xs">{display?.output}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render step 3: Arrange displays
  const renderStep3 = () => {
    // Calculate grid layout dimensions
    const [rows, cols] = selectedLayout.split("x").map(Number);

    // Get list of already selected display IDs
    const arrangedDisplayIds = arrangedDisplays
      .flat()
      .filter(Boolean)
      .map((display) => display.id);

    // Reset all selections
    const handleResetSelections = () => {
      const emptyGrid = Array(rows)
        .fill()
        .map(() => Array(cols).fill(null));
      setArrangedDisplays(emptyGrid);

      // Update the grid command
      const updatedGrid = {
        ...grids[0],
        monitors: [],
      };
      setGrids([updatedGrid]);

      // Generate new command
      setTimeout(() => {
        generateNvidiaCommand();
      }, 0);
    };

    // Handle display selection in a cell
    const handleDisplaySelect = (rowIndex, colIndex, displayId) => {
      const newArranged = [...arrangedDisplays];

      // If a display was previously in this cell, remove it
      if (newArranged[rowIndex][colIndex]) {
        newArranged[rowIndex][colIndex] = null;
      }

      // If a new display is selected (not "none")
      if (displayId) {
        // Find the display object
        const display = mockVideoWalls.find((d) => d.id === parseInt(displayId));

        // Remove this display from any other position it might be in
        for (let r = 0; r < newArranged.length; r++) {
          for (let c = 0; c < newArranged[r].length; c++) {
            if (newArranged[r][c]?.id === parseInt(displayId)) {
              newArranged[r][c] = null;
            }
          }
        }

        // Place display in the new position
        if (display) {
          newArranged[rowIndex][colIndex] = display;
        }
      }

      setArrangedDisplays(newArranged);

      // Update the grid command with selected monitors
      const selectedMonitors = newArranged
        .flat()
        .filter(Boolean)
        .map((d) => d.id);
      const updatedGrid = {
        ...grids[0],
        monitors: selectedMonitors,
      };
      setGrids([updatedGrid]);

      // Generate new command
      setTimeout(() => {
        generateNvidiaCommand();
      }, 0);
    };

    return (
      <div className="p-4" dir="rtl">
        <h3 className="text-lg font-bold mb-4">۳. چیدمان نمایشگرها</h3>

        <div className="flex justify-between items-center mb-4">
          <div className="font-medium">توپولوژی: {selectedLayout}</div>
          <button
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={handleResetSelections}
          >
            پاک کردن همه انتخاب‌ها
          </button>
        </div>

        <div className="bg-gray-600 p-4">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
          >
            {[...Array(rows)].map((_, rowIndex) =>
              [...Array(cols)].map((_, colIndex) => {
                const currentDisplay =
                  arrangedDisplays[rowIndex] && arrangedDisplays[rowIndex][colIndex];

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="bg-gray-700 border border-gray-500 p-2 h-full flex flex-col"
                  >
                    <div className="text-white text-xs mb-2 text-right">
                      موقعیت: {rowIndex},{colIndex}
                    </div>

                    <select
                      className="bg-gray-800 text-white border border-gray-600 p-2 mb-2 w-full text-right"
                      value={currentDisplay ? currentDisplay.id : ""}
                      onChange={(e) => handleDisplaySelect(rowIndex, colIndex, e.target.value)}
                    >
                      <option value="">-- انتخاب نمایشگر --</option>
                      {mockVideoWalls
                        .filter((display) => selectedDisplays.includes(display.id))
                        .map((display) => (
                          <option
                            key={display.id}
                            value={display.id}
                            disabled={
                              arrangedDisplayIds.includes(display.id) &&
                              (!currentDisplay || currentDisplay.id !== display.id)
                            }
                          >
                            {display.name} ({display.output})
                          </option>
                        ))}
                    </select>

                    {currentDisplay && (
                      <div className="flex-grow bg-gradient-to-br from-teal-400 to-green-400 rounded p-2 flex flex-col items-center justify-center overflow-hidden">
                        <div className="text-center text-white">
                          <div className="text-xl font-bold">{currentDisplay.id}</div>
                          <div className="text-sm">{currentDisplay.name}</div>
                          <div className="text-xs mt-1">{currentDisplay.output}</div>
                          <div className="text-xs mt-1">
                            {currentDisplay.width} × {currentDisplay.height}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="font-medium mt-4">
          وضوح کلی: {selectedLayout === "2x2" ? "3840 × 2160" : "7680 × 1080"} پیکسل
        </div>

        <div className="mt-4">
          <div className="font-medium mb-2">نمایشگرهای انتخاب شده:</div>
          <div className="flex flex-wrap gap-2">
            {arrangedDisplays
              .flat()
              .filter(Boolean)
              .map((display) => {
                const rowIndex = arrangedDisplays.findIndex((row) => row.includes(display));
                const colIndex = arrangedDisplays[rowIndex].indexOf(display);

                return (
                  <div
                    key={display.id}
                    className="bg-blue-100 border border-blue-300 rounded px-3 py-1 text-sm"
                  >
                    {display.name} - موقعیت: {rowIndex},{colIndex}
                  </div>
                );
              })}
            {arrangedDisplays.flat().filter(Boolean).length === 0 && (
              <div className="text-gray-500 italic">هیچ نمایشگری انتخاب نشده است</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render step 4: Adjust overlap and bezel correction
  const renderStep4 = () => (
    <div className="p-4" dir="rtl">
      <h3 className="text-lg font-bold mb-4">۴. تنظیم همپوشانی و تصحیح قاب</h3>

      <div>
        <label className="block mb-2">نحوه اعمال همپوشانی/تصحیح قاب را انتخاب کنید:</label>
        <select className="border border-gray-300 rounded p-1 w-full mb-4">
          <option>از همان تنظیم برای تمام لبه‌های عمودی یا افقی استفاده کنید</option>
          <option>هر لبه را به صورت جداگانه سفارشی کنید</option>
        </select>

        <div className="mb-4 font-medium">لبه‌ها را برای همپوشانی/تصحیح قاب انتخاب کنید:</div>
        <div className="bg-gray-600 p-4 h-48 flex items-center justify-center">
          <div className={`relative ${selectedLayout === "2x2" ? "w-48 h-32" : "w-96 h-16"}`}>
            {/* Grid outline */}
            <div className="absolute inset-0 border-2 border-gray-300"></div>

            {/* Display grid */}
            <div
              className={`grid w-full h-full ${
                selectedLayout.split("x")[1] === "4"
                  ? "grid-cols-4 grid-rows-1"
                  : selectedLayout === "2x2"
                  ? "grid-cols-2 grid-rows-2"
                  : "grid-cols-3 grid-rows-1"
              }`}
            >
              {Array.from({ length: numDisplays }).map((_, i) => {
                const row = Math.floor(i / parseInt(selectedLayout.split("x")[1]));
                const col = i % parseInt(selectedLayout.split("x")[1]);

                return (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-teal-400 to-green-400 border border-gray-700 flex items-center justify-center"
                  >
                    <div className="text-center text-white">
                      <div className="text-lg font-bold">{i + 1}</div>
                      <div className="text-xs">
                        {row},{col}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vertical overlap indicator */}
            {selectedLayout === "2x2" && (
              <div className="absolute top-0 bottom-0 w-1 bg-yellow-300 left-1/2 -ml-0.5"></div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="font-medium mb-2">
            وضوح کلی: {selectedLayout === "2x2" ? "3840 × 2160" : "7680 × 1080"} پیکسل
          </div>
          <div className="font-medium mb-2">
            مقادیر همپوشانی/تصحیح قاب را برای لبه‌های انتخاب شده وارد کنید:
          </div>

          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 p-2 text-right">لبه‌ها</th>
                <th className="border border-gray-300 p-2 text-right">نوع تصحیح</th>
                <th className="border border-gray-300 p-2 text-right">مقدار تصحیح (پیکسل)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">تمام موارد عمودی</td>
                <td className="border border-gray-300 p-2">
                  <select
                    className="w-full border border-gray-300 rounded p-1"
                    value={correctionType}
                    onChange={(e) => setCorrectionType(e.target.value)}
                  >
                    <option>تصحیح قاب</option>
                    <option>همپوشانی</option>
                  </select>
                </td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center">
                    <input
                      type="number"
                      className="w-16 border border-gray-300 rounded p-1 ml-2"
                      value={overlapCol}
                      onChange={(e) => setOverlapCol(parseInt(e.target.value) || 0)}
                      min="0"
                    />
                    {/* <button className="px-2 border border-gray-300 rounded">+</button> */}
                    {/* <button className="px-2 border border-gray-300 rounded mr-1">-</button> */}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">تمام موارد افقی</td>
                <td className="border border-gray-300 p-2">
                  <select className="w-full border border-gray-300 rounded p-1">
                    <option>تصحیح قاب</option>
                    <option>همپوشانی</option>
                  </select>
                </td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center">
                    <input
                      type="number"
                      className="w-16 border border-gray-300 rounded p-1 ml-2"
                      value={overlapRow}
                      onChange={(e) => setOverlapRow(parseInt(e.target.value) || 0)}
                      min="0"
                    />
                    {/* <button className="px-2 border border-gray-300 rounded">+</button> */}
                    {/* <button className="px-2 border border-gray-300 rounded mr-1">-</button> */}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-gray-800 text-green-300 font-mono text-xs rounded-md overflow-x-auto">
          <div className="mb-2 text-white">دستور NVIDIA Mosaic تولید شده:</div>
          <code>
            {generatedCommand ||
              "rows=2 cols=2 res=1920,1080,60.000 gridPos=0,0 out=0,0 out=0,1 out=0,2 out=0,3 rotate=0 overlapcol=0 overlaprow=0"}
          </code>
        </div>
      </div>
    </div>
  );

  // Render the step content based on active step
  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  const onClose = () => setIsOpen(false);

  if (!isOpen) {
    return (
      <button
        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        onClick={() => setIsOpen(true)}
        dir="rtl"
      >
        تنظیم چیدمان
      </button>
    );
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-md shadow-xl w-11/12 max-w-6xl max-h-screen overflow-auto"
      >
        <div
          className="border-b border-gray-300 p-2 flex justify-between items-center bg-gradient-to-r from-gray-100 to-gray-200"
          dir="rtl"
        >
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-300 ml-2 flex items-center justify-center rounded">
              <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-teal-500"></div>
            </div>
            <span className="font-bold">چیدمان مانتورها</span>
          </div>
          <div className="flex">
            <button
              className="w-6 h-6 border border-gray-400 flex items-center justify-center text-xs bg-gray-100 mr-1"
              onClick={onClose}
            >
              X
            </button>
          </div>
        </div>

        <div className="border-b border-gray-300 p-2 bg-gray-100" dir="rtl">
          <div className="flex justify-between">
            <div></div>
            <div>Topology: {selectedLayout}</div>
          </div>
        </div>

        <div className="p-2 bg-gray-200" dir="rtl">
          <div className="flex border border-gray-300">
            <button
              className={`py-1 px-3 ${
                activeStep === 1 ? "bg-green-500 text-white" : "bg-gray-100"
              }`}
              onClick={() => setActiveStep(1)}
            >
              ۱. انتخاب توپولوژی
            </button>
            <button
              className={`py-1 px-3 ${
                activeStep === 2 ? "bg-green-500 text-white" : "bg-gray-100"
              }`}
              onClick={() => setActiveStep(2)}
            >
              ۲. انتخاب نمایشگرها
            </button>
            <button
              className={`py-1 px-3 ${
                activeStep === 3 ? "bg-green-500 text-white" : "bg-gray-100"
              }`}
              onClick={() => setActiveStep(3)}
            >
              ۳. چیدمان نمایشگرها
            </button>
            <button
              className={`py-1 px-3 ${
                activeStep === 4 ? "bg-green-500 text-white" : "bg-gray-100"
              }`}
              onClick={() => setActiveStep(4)}
            >
              ۴. تنظیم همپوشانی و تصحیح قاب
            </button>
          </div>
        </div>

        {renderStepContent()}

        <div
          className="p-2 border-t border-gray-300 flex justify-end space-x-2 bg-gray-100"
          dir="rtl"
        >
          {activeStep > 1 && (
            <button
              className="px-4 py-1 border border-gray-300 bg-gray-200 hover:bg-gray-300 rounded ml-2"
              onClick={handlePreviousStep}
            >
              قبلی
            </button>
          )}

          {activeStep < 4 ? (
            <button
              className="px-4 py-1 border border-gray-300 bg-blue-500 text-white hover:bg-blue-600 rounded"
              onClick={handleNextStep}
            >
              بعدی
            </button>
          ) : (
            <button className="px-4 py-1 border border-gray-300 bg-green-500 text-white hover:bg-green-600 rounded">
              اعمال
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NvidiaMosaicSetup;
