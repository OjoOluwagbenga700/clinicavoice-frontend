import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { signIn } from "aws-amplify/auth";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");

  // Check if redirected due to session expiration
  useEffect(() => {
    if (location.state?.sessionExpired) {
      setSessionExpiredMessage("Your session has expired. Please log in again.");
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSessionExpiredMessage("");
    setLoading(true);

    try {
      await signIn({ username: email, password });
      sessionStorage.setItem("clinica_token", "authenticated");
      
      // Redirect to the page they were trying to access, or dashboard
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      // Generic error message - don't expose whether email or password was incorrect (Requirement 15.5, 2.2)
      setError("Authentication failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "90vh",
        backgroundColor: "#F9FAFB",
      }}
    >
      <Paper sx={{ p: 4, width: 400, boxShadow: 4, borderRadius: 2 }}>
        <Typography variant="h4" fontWeight={600} textAlign="center" mb={2}>
          {t("signin_title")}
        </Typography>

        {sessionExpiredMessage && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {sessionExpiredMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t("signin_email")}
            variant="outlined"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            fullWidth
            label={t("signin_password")}
            variant="outlined"
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            fullWidth
            variant="contained"
            color="error"
            sx={{ mt: 3, py: 1.5, textTransform: "none" }}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t("signin_button")
            )}
          </Button>
        </form>

        <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
          {t("signin_noaccount")}{" "}
          <Button
            onClick={() => navigate("/register")}
            variant="text"
            color="primary"
            sx={{ textTransform: "none" }}
          >
            {t("signin_signup")}
          </Button>
        </Typography>
      </Paper>
    </Box>
  );
}
