import React from "react";
import { Button } from "@mui/material";
import Select from "react-select";

const MonitorSelect = ({ videoName, monitors, fitToMonitors }) => {
  const monitorOptions = monitors.map((monitor, index) => ({
    value: index,
    label: `Monitor ${index + 1}`,
  }));

  return (
    <div>
      <Select
        isMulti
        name="monitors"
        options={monitorOptions}
        className="basic-multi-select"
        classNamePrefix="select"
        onChange={(selectedOptions) => {
          const selectedMonitors = selectedOptions.map((option) => option.value);
          fitToMonitors(videoName, selectedMonitors);
        }}
      />
      <Button variant="flat" color="primary" onClick={() => fitToMonitors(videoName, [])}>
        افزودن به صحنه
      </Button>
    </div>
  );
};

export default MonitorSelect;
