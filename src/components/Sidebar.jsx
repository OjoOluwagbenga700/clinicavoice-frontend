import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { Dashboard, Mic, Description, Settings, NoteAdd, Person } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useUserRole } from "../hooks/useUserRole";
import { ROLES } from "../config/roles";

const drawerWidth = 240;

export default function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const { t } = useTranslation();
  const { userRole, loading } = useUserRole();

  // Define all menu items with role restrictions
  const allMenuItems = useMemo(() => [
    { 
      to: "/dashboard", 
      label: t("sidebar_overview"), 
      icon: <Dashboard />,
      roles: [ROLES.CLINICIAN, ROLES.PATIENT]
    },
    { 
      to: "/dashboard/transcribe", 
      label: t("dashboard_transcribe"), 
      icon: <Mic />,
      roles: [ROLES.CLINICIAN]
    },
    { 
      to: "/dashboard/reports", 
      label: t("dashboard_reports"), 
      icon: <Description />,
      roles: [ROLES.CLINICIAN]
    },
    { 
      to: "/dashboard/reports", 
      label: t("sidebar_my_reports"), 
      icon: <Description />,
      roles: [ROLES.PATIENT]
    },
    { 
      to: "/dashboard/templates", 
      label: t("dashboard_templates"), 
      icon: <NoteAdd />,
      roles: [ROLES.CLINICIAN]
    },
    { 
      to: "/dashboard/profile", 
      label: t("sidebar_my_profile"), 
      icon: <Person />,
      roles: [ROLES.PATIENT]
    },
    { 
      to: "/dashboard/settings", 
      label: t("dashboard_settings"), 
      icon: <Settings />,
      roles: [ROLES.CLINICIAN, ROLES.PATIENT]
    },
  ], [t]);

  // Filter menu items based on user role
  const menuItems = useMemo(() => {
    if (!userRole) return [];
    return allMenuItems.filter(item => item.roles.includes(userRole));
  }, [allMenuItems, userRole]);

  const drawerContent = (
    <Box sx={{ color: "#fff", backgroundColor: "#2E3A59", height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 2, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
        <img
          src="/logo.jpeg"
          alt="ClinicaVoice logo"
          style={{ width: 36, height: 36, borderRadius: 8, marginRight: 10, objectFit: "cover" }}
        />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          ClinicaVoice
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flexGrow: 1 }}>
          <CircularProgress size={32} sx={{ color: "rgba(255,255,255,0.7)" }} />
        </Box>
      ) : (
        <List sx={{ flexGrow: 1 }}>
          {menuItems.map(({ to, label, icon }) => (
            <NavLink key={`${to}-${label}`} to={to} style={{ textDecoration: "none", color: "inherit" }}>
              {({ isActive }) => (
                <ListItemButton
                  sx={{
                    px: 3,
                    py: 1.5,
                    color: isActive ? "#fff" : "rgba(255,255,255,0.85)",
                    backgroundColor: isActive ? "#C62828" : "transparent",
                    borderRadius: "12px",
                    mx: 1,
                    mt: 0.5,
                    "&:hover": {
                      backgroundColor: isActive ? "#C62828" : "rgba(255,255,255,0.08)",
                      color: "#fff",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? "#fff" : "rgba(255,255,255,0.7)", minWidth: 36 }}>
                    {icon}
                  </ListItemIcon>
                  <ListItemText primary={label} primaryTypographyProps={{ fontSize: "0.95rem", fontWeight: 500 }} />
                </ListItemButton>
              )}
            </NavLink>
          ))}
        </List>
      )}

      <Divider sx={{ backgroundColor: "rgba(255,255,255,0.15)", my: 1 }} />

      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
          © 2025 ClinicaVoice<br />
          {t("sidebar_secure")}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Temporary Drawer for mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Permanent Drawer for desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
