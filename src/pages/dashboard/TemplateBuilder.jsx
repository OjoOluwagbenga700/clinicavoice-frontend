import React, { useState, useEffect } from "react";
import {
  Box, Container, Typography, Button, TextField,
  Select, MenuItem, Card, CardContent, Grid, Alert, CircularProgress
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "../../hooks/useUserRole";
import { apiGet, apiPost, apiPut, apiDelete } from "../../services/api";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';

const samplePatient = {
  PatientName: "John Doe",
  Date: new Date().toLocaleDateString(),
  Diagnosis: "Hypertension",
  Medications: "Lisinopril 10mg daily",
};

export default function TemplateBuilder() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isClinician, loading: roleLoading } = useUserRole();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editorContent, setEditorContent] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load templates from backend on component mount (Requirement 7.1)
  useEffect(() => {
    const loadTemplates = async () => {
      if (!isClinician()) return;
      
      try {
        setLoading(true);
        const data = await apiGet('/templates');
        
        if (data?.templates?.length > 0) {
          setTemplates(data.templates);
          const first = data.templates[0];
          setSelectedTemplate(first.id);
          setEditorContent(first.content || "");
          setTemplateName(first.name || "");
        } else {
          // If no templates exist, create a default one
          const defaultTemplate = {
            name: "SOAP Note",
            content: "Subjective:\nObjective:\nAssessment:\nPlan:\nPatient: {{PatientName}}\nDate: {{Date}}"
          };
          const created = await apiPost('/templates', defaultTemplate);
          setTemplates([created]);
          setSelectedTemplate(created.id);
          setEditorContent(created.content);
          setTemplateName(created.name);
        }
      } catch (err) {
        console.error("Failed to load templates:", err);
        setError("Failed to load templates. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    if (!roleLoading) {
      loadTemplates();
    }
  }, [roleLoading, isClinician]);

  const handleTemplateChange = (id) => {
    const temp = templates.find(t => t.id === id);
    if (temp) {
      setSelectedTemplate(id);
      setEditorContent(temp.content || "");
      setTemplateName(temp.name || "");
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccessMessage("");

    // Validate template before saving
    if (!templateName || templateName.trim() === "") {
      setError("Template name cannot be empty. Please provide a name.");
      return;
    }

    if (templateName.trim().length < 3) {
      setError("Template name must be at least 3 characters long.");
      return;
    }

    // Check for duplicate template names
    const duplicateName = templates.find(
      t => t.id !== selectedTemplate && t.name.toLowerCase() === templateName.trim().toLowerCase()
    );
    if (duplicateName) {
      setError("A template with this name already exists. Please use a different name.");
      return;
    }

    try {
      setSaving(true);
      
      // Update template via backend API (Requirements 7.2, 7.4)
      const updatedTemplate = await apiPut(`/templates/${selectedTemplate}`, {
        name: templateName.trim(),
        content: editorContent
      });
      
      // Update local state
      setTemplates(prev =>
        prev.map(t => t.id === selectedTemplate ? updatedTemplate : t)
      );
      
      setSuccessMessage("Template saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Template save error:", err);
      setError("Failed to save template. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleNew = async () => {
    setError("");
    setSuccessMessage("");

    try {
      setSaving(true);
      
      // Create new template via backend API (Requirement 7.1)
      const newTemplate = await apiPost('/templates', {
        name: "New Template",
        content: ""
      });
      
      setTemplates([...templates, newTemplate]);
      setSelectedTemplate(newTemplate.id);
      setEditorContent("");
      setTemplateName("New Template");
      setSuccessMessage("New template created. Don't forget to save your changes!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Template creation error:", err);
      setError("Failed to create new template. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setError("");
    setSuccessMessage("");

    // Prevent deleting the last template
    if (templates.length <= 1) {
      setError("Cannot delete the last template. At least one template must exist.");
      return;
    }

    // Confirm deletion
    if (!globalThis.confirm(`Are you sure you want to delete "${templateName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      
      // Delete template via backend API (Requirement 7.5)
      await apiDelete(`/templates/${selectedTemplate}`);
      
      const remainingTemplates = templates.filter(t => t.id !== selectedTemplate);
      setTemplates(remainingTemplates);
      
      // Switch to the first remaining template
      const first = remainingTemplates[0];
      setSelectedTemplate(first.id);
      setEditorContent(first.content || "");
      setTemplateName(first.name || "");
      
      setSuccessMessage("Template deleted successfully.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Template deletion error:", err);
      setError("Failed to delete template. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const insertPlaceholder = (ph) => {
    setEditorContent(editorContent + `{{${ph}}}`);
  };

  const getPreviewContent = () => {
    let content = editorContent;
    Object.keys(samplePatient).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, "g");
      content = content.replace(regex, samplePatient[key]);
    });
    return content.replaceAll(/\n/g, "<br/>");
  };

  // Show loading while checking role or loading templates
  if (roleLoading || loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>{t("loading")}...</Typography>
      </Box>
    );
  }

  // Verify clinician access (additional check beyond routing)
  if (!isClinician()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. This feature is only available to clinicians.
        </Alert>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/dashboard")}>
          Return to Dashboard
        </Button>
      </Box>
    );
  }

  // Show message if no templates loaded
  if (templates.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No templates available. Click "New Template" to create one.
        </Alert>
        <Button sx={{ mt: 2 }} variant="contained" onClick={handleNew} disabled={saving}>
          {saving ? <CircularProgress size={24} /> : t("template_new")}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, backgroundColor: "#F9FAFB", minHeight: "90vh" }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>{t("template_title")}</Typography>

        {/* Error and Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage("")}>
            {successMessage}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Select 
              fullWidth 
              value={selectedTemplate || ""} 
              onChange={(e) => handleTemplateChange(e.target.value)}
              disabled={saving || deleting}
            >
              {templates.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </Select>
          </Grid>
          <Grid item xs={12} sm={8} display="flex" gap={1}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleNew}
              disabled={saving || deleting}
            >
              {saving ? <CircularProgress size={24} /> : t("template_new")}
            </Button>
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleSave}
              disabled={saving || deleting}
            >
              {saving ? <CircularProgress size={24} /> : t("template_save")}
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleDelete}
              disabled={saving || deleting}
            >
              {deleting ? <CircularProgress size={24} /> : t("template_delete")}
            </Button>
          </Grid>
        </Grid>

        <TextField
          label={t("template_name")}
          fullWidth
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={1} sx={{ mb: 1 }}>
              {["PatientName", "Date", "Diagnosis", "Medications"].map(ph => (
                <Grid item key={ph}>
                  <Button size="small" variant="outlined" onClick={() => insertPlaceholder(ph)}>
                    {t(`ph_${ph.toLowerCase()}`)}
                  </Button>
                </Grid>
              ))}
            </Grid>
            <ReactQuill theme="snow" value={editorContent} onChange={setEditorContent} />
          </CardContent>
        </Card>

        <Box mt={2}>
          <Typography variant="h6">{t("template_preview")}</Typography>
          <Card sx={{ p: 2, mt: 1, minHeight: 150 }}>
            <div dangerouslySetInnerHTML={{ __html: getPreviewContent() }} />
          </Card>
        </Box>

        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">{t("template_placeholder_tip")}</Typography>
        </Box>
      </Container>
    </Box>
  );
}
