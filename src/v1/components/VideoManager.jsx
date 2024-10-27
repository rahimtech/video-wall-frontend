import React from "react";
// import { Box, Typography, Button, IconButton, Switch } from "@mui/material";
// import { Refresh as RefreshIcon, Delete as DeleteIcon } from "@mui/icons-material";
import MonitorSelect from "./MonitorSelect";

const VideoManager = ({
  videos,
  onPlay,
  onPause,
  onReset,
  onDelete,
  onToggleLoop,
  allDataMonitors,
  fitToMonitors,
}) => {
  if (!videos || videos.length === 0) {
    return <Typography variant="h6">No videos available</Typography>;
  }

  return (
    <div>
      {videos.map((video) => (
        <Box key={video.name} mb={2} p={2} bgcolor="background.paper" borderRadius={2}>
          <Typography variant="h6">{video.name}</Typography>
          <Button variant="contained" color="primary" onClick={() => onPlay(video.name)}>
            Play
          </Button>
          <Button variant="contained" color="secondary" onClick={() => onPause(video.name)}>
            Pause
          </Button>
          <IconButton color="default" onClick={() => onReset(video.name)}>
            <RefreshIcon />
          </IconButton>
          <IconButton color="error" onClick={() => onDelete(video.name)}>
            <DeleteIcon />
          </IconButton>
          <Switch
            checked={video.loop}
            onChange={() => onToggleLoop(video.name)}
            name="loopSwitch"
            color="primary"
          />
          <MonitorSelect
            videoName={video.name}
            monitors={allDataMonitors}
            fitToMonitors={fitToMonitors}
          />
        </Box>
      ))}
    </div>
  );
};

export default VideoManager;
