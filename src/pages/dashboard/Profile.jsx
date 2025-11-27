import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
} from "@mui/material";
import { useUserRole } from "../../hooks/useUserRole";

// Mock patient data
const mockPatientData = {
  name: "John Smith",
  email: "john.smith@example.com",
  dateOfBirth: "1985-06-15",
  phone: "(555) 123-4567",
  address: "123 Main Street, Toronto, ON M5H 2N2",
  healthCardNumber: "1234-567-890",
  bloodType: "O+",
  allergies: "Penicillin, Peanuts",
  emergencyContact: "Jane Smith - (555) 987-6543",
};

export default function Profile() {
  const { userInfo, isPatient } = useUserRole();
  const [profileData, setProfileData] = useState(mockPatientData);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    // In a real app, fetch patient data from API
    // For now, using mock data
    if (userInfo) {
      setProfileData({
        ...mockPatientData,
        name: userInfo.name || mockPatientData.name,
        email: userInfo.email || mockPatientData.email,
      });
    }
  }, [userInfo]);

  const handleSave = () => {
    // In a real app, save to backend
    setSaveMessage("Profile information is managed by your healthcare provider.");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Profile
      </Typography>

      {saveMessage && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {saveMessage}
        </Alert>
      )}

      <Card sx={{ p: 4 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
          Personal Information
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Full Name"
              value={profileData.name}
              InputProps={{ readOnly: true }}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email Address"
              value={profileData.email}
              InputProps={{ readOnly: true }}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              value={profileData.dateOfBirth}
              InputProps={{ readOnly: true }}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={profileData.phone}
              InputProps={{ readOnly: true }}
              disabled
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              value={profileData.address}
              InputProps={{ readOnly: true }}
              disabled
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
          Medical Information
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Health Card Number"
              value={profileData.healthCardNumber}
              InputProps={{ readOnly: true }}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Blood Type"
              value={profileData.bloodType}
              InputProps={{ readOnly: true }}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Allergies"
              value={profileData.allergies}
              InputProps={{ readOnly: true }}
              disabled
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Emergency Contact"
              value={profileData.emergencyContact}
              InputProps={{ readOnly: true }}
              disabled
              multiline
              rows={2}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Alert severity="info">
            Your profile information is managed by your healthcare provider. 
            If you need to update any information, please contact your clinic.
          </Alert>
        </Box>

        {isPatient() && (
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={handleSave}>
              Request Profile Update
            </Button>
          </Box>
        )}
      </Card>
    </Box>
  );
}
