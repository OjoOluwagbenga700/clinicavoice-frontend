// Dashboard.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import Overview from "../pages/dashboard/Overview";
import Transcribe from "../pages/dashboard/Transcribe";
import Reports from "../pages/dashboard/Reports";
import Settings from "../pages/dashboard/Settings";
import TemplateBuilder from "../pages/dashboard/TemplateBuilder";
import Profile from "../pages/dashboard/Profile";
import ProtectedRoute from "../components/ProtectedRoute";
import { ROLES } from "../config/roles";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Overview />} />
        <Route 
          path="transcribe/:id?" 
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLINICIAN]}>
              <Transcribe />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="reports" 
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLINICIAN, ROLES.PATIENT]}>
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="templates" 
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLINICIAN]}>
              <TemplateBuilder />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="settings" 
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLINICIAN, ROLES.PATIENT]}>
              <Settings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="profile" 
          element={
            <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
              <Profile />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </DashboardLayout>
  );
}
