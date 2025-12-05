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
  IconButton,
  Tooltip,
} from "@mui/material";
import { 
  Dashboard, 
  Mic, 
  Description, 
  Settings, 
  NoteAdd, 
  Person,
  ChevronLeft,
  ChevronRight,
  People,
  CalendarMonth,
  BarChart,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useUserRole } from "../hooks/useUserRole";
import { ROLES } from "../config/roles";

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

export default function Sidebar({ mobileOpen, handleDrawerToggle, open = true, onToggle }) {
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
      to: "/dashboard/patients", 
      label: "Patients", 
      icon: <People />,
      roles: [ROLES.CLINICIAN]
    },
    { 
      to: "/dashboard/appointments", 
      label: "Appointments", 
      icon: <CalendarMonth />,
      roles: [ROLES.CLINICIAN]
    },
    { 
      to: "/dashboard/analytics", 
      label: "Analytics", 
      icon: <BarChart />,
      roles: [ROLES.CLINICIAN]
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
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: open ? "space-between" : "center", 
        py: 2, 
        px: open ? 2 : 1,
        borderBottom: "1px solid rgba(255,255,255,0.15)" 
      }}>
        {open && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <img
              src="/logo.jpeg"
              alt="ClinicaVoice logo"
              style={{ width: 36, height: 36, borderRadius: 8, marginRight: 10, objectFit: "cover" }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ClinicaVoice
            </Typography>
          </Box>
        )}
        {!open && (
          <img
            src="/logo.jpeg"
            alt="ClinicaVoice logo"
            style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }}
          />
        )}
        {open && onToggle && (
          <IconButton 
            onClick={onToggle} 
            size="small"
            sx={{ 
              color: "rgba(255,255,255,0.7)",
              '&:hover': { color: "#fff", backgroundColor: "rgba(255,255,255,0.1)" }
            }}
          >
            <ChevronLeft />
          </IconButton>
        )}
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
                <Tooltip title={!open ? label : ""} placement="right" arrow>
                  <ListItemButton
                    sx={{
                      px: open ? 3 : 1,
                      py: 1.5,
                      color: isActive ? "#fff" : "rgba(255,255,255,0.85)",
                      backgroundColor: isActive ? "#C62828" : "transparent",
                      borderRadius: "12px",
                      mx: 1,
                      mt: 0.5,
                      justifyContent: open ? "flex-start" : "center",
                      "&:hover": {
                        backgroundColor: isActive ? "#C62828" : "rgba(255,255,255,0.08)",
                        color: "#fff",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: isActive ? "#fff" : "rgba(255,255,255,0.7)", 
                      minWidth: open ? 36 : 'auto',
                      justifyContent: "center"
                    }}>
                      {icon}
                    </ListItemIcon>
                    {open && (
                      <ListItemText primary={label} primaryTypographyProps={{ fontSize: "0.95rem", fontWeight: 500 }} />
                    )}
                  </ListItemButton>
                </Tooltip>
              )}
            </NavLink>
          ))}
        </List>
      )}

      <Divider sx={{ backgroundColor: "rgba(255,255,255,0.15)", my: 1 }} />

      {!open && onToggle && (
        <Box sx={{ p: 1, textAlign: "center" }}>
          <IconButton 
            onClick={onToggle}
            sx={{ 
              color: "rgba(255,255,255,0.7)",
              '&:hover': { color: "#fff", backgroundColor: "rgba(255,255,255,0.1)" }
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      )}

      {open && (
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
            © 2025 ClinicaVoice<br />
            {t("sidebar_secure")}
          </Typography>
        </Box>
      )}
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
          "& .MuiDrawer-paper": { 
            boxSizing: "border-box", 
            width: open ? drawerWidth : collapsedDrawerWidth,
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
