import React from "react";
// import { AppBar, Toolbar, Typography, IconButton, Button, Switch } from "@mui/material";
// import { Menu as MenuIcon } from "@mui/icons-material";

const Navbar = ({ darkMode, setDarkMode, onAddContent }) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton edge="start" color="inherit" aria-label="menu">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Video Wall Manager
        </Typography>
        <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
        <Button color="inherit" onPress={onAddContent}>
          Add Content
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
