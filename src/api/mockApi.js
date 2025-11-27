export async function getStats() {
  await new Promise((r) => setTimeout(r, 300));
  return { activePatients: 128, recentTranscriptions: 24, pendingReviews: 7 };
}

export async function getActivityChart() {
  await new Promise((r) => setTimeout(r, 300));
  return [
    { date: "2025-09-01", transcriptions: 5 },
    { date: "2025-09-05", transcriptions: 12 },
    { date: "2025-09-10", transcriptions: 7 },
    { date: "2025-09-15", transcriptions: 20 },
    { date: "2025-09-20", transcriptions: 15 },
    { date: "2025-09-25", transcriptions: 22 },
    { date: "2025-09-30", transcriptions: 18 },
  ];
}

export async function getRecentNotes() {
  await new Promise((r) => setTimeout(r, 300));
  return [
    { id: "n1", patient: "Dr. Jane Doe", status: "transcribed", date: "2025-10-01" },
    { id: "n2", patient: "Dr. Samuel K", status: "pendingReview", date: "2025-10-02" },
    { id: "n3", patient: "Dr. Peter Lin", status: "reviewed", date: "2025-10-03" },
  ];
}

export async function getPatientStats() {
  await new Promise((r) => setTimeout(r, 300));
  return {
    totalReports: 8,
    upcomingAppointments: 2,
    lastVisit: "2025-10-28",
  };
}

export async function getPatientRecentReports() {
  await new Promise((r) => setTimeout(r, 300));
  return [
    { id: "pr1", title: "General Checkup", status: "Reviewed", date: "2025-10-28" },
    { id: "pr2", title: "Follow-up Visit", status: "Reviewed", date: "2025-10-15" },
    { id: "pr3", title: "Lab Results", status: "Available", date: "2025-10-10" },
  ];
}

export async function getReports() {
  await new Promise((r) => setTimeout(r, 300));
  return [
    { id: "r1", patient: "John Doe", patientId: "patient1", date: "2025-10-31", summary: "General checkup notes", clinicianId: "clinician1" },
    { id: "r2", patient: "Jane Smith", patientId: "patient2", date: "2025-10-30", summary: "Cardiology notes", clinicianId: "clinician1" },
    { id: "r3", patient: "Alice Johnson", patientId: "patient3", date: "2025-10-29", summary: "Neurology notes", clinicianId: "clinician1" },
    { id: "r4", patient: "Bob Martin", patientId: "patient4", date: "2025-10-28", summary: "Pediatrics notes", clinicianId: "clinician1" },
    { id: "r5", patient: "Current Patient", patientId: "currentPatient", date: "2025-10-28", summary: "General checkup", clinicianId: "clinician1" },
    { id: "r6", patient: "Current Patient", patientId: "currentPatient", date: "2025-10-15", summary: "Follow-up visit", clinicianId: "clinician1" },
    { id: "r7", patient: "Current Patient", patientId: "currentPatient", date: "2025-10-10", summary: "Lab results review", clinicianId: "clinician1" },
  ];
}

export async function getReportById(reportId) {
  await new Promise((r) => setTimeout(r, 300));
  const reports = await getReports();
  return reports.find(r => r.id === reportId) || null;
}
