import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { Box } from "@mui/material";

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: { xs: 0, sm: sidebarOpen ? `${drawerWidth}px` : `${collapsedDrawerWidth}px` },
          transition: 'margin 0.3s ease',
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Content container */}
        <Box sx={{ flexGrow: 1 }}>{children}</Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            mt: 2,
            py: 2,
            textAlign: "center",
            borderTop: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          © 2025 ClinicaVoice
        </Box>
      </Box>
    </Box>
  );
}
 