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
import Patients from "../pages/dashboard/Patients";
import PatientProfile from "../pages/dashboard/PatientProfile";
import Appointments from "../pages/dashboard/Appointments";
import Analytics from "../pages/dashboard/Analytics";
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
          path="patients" 
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLINICIAN]}>
              <Patients />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="patients/:id" 
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLINICIAN, ROLES.PATIENT]}>
              <PatientProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="appointments" 
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLINICIAN]}>
              <Appointments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="analytics" 
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLINICIAN]}>
              <Analytics />
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
              <PatientProfile />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </DashboardLayout>
  );
}
