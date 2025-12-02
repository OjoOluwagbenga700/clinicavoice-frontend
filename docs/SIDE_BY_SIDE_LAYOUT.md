# Side-by-Side Layout: Transcript & Medical Analysis

## Overview
Updated the Transcribe page to display the transcript and medical analysis side by side for better user experience and workflow efficiency.

## Layout Design

### Desktop View (≥768px width)
```
┌─────────────────────────────────────────────────────────────┐
│                    Transcribe Page Header                    │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│   📝 TRANSCRIPT (50%)        │   🏥 MEDICAL ANALYSIS (50%)  │
│                              │                              │
│   Patient Name: [_______]    │   Analysis Summary           │
│                              │   - 12 medical entities      │
│   ┌────────────────────┐    │   - 3 PHI items              │
│   │                    │    │   - Analyzed: 12/01/24       │
│   │  Transcript text   │    │                              │
│   │  editable area     │    │   Medical Entities           │
│   │  (20 rows)         │    │   ┌──────────────────────┐  │
│   │                    │    │   │ lisinopril           │  │
│   │                    │    │   │ MEDICATION - GENERIC │  │
│   │                    │    │   │ Confidence: 98%      │  │
│   │                    │    │   └──────────────────────┘  │
│   │                    │    │   ┌──────────────────────┐  │
│   │                    │    │   │ chest pain           │  │
│   │                    │    │   │ SYMPTOM              │  │
│   └────────────────────┘    │   │ Confidence: 95%      │  │
│                              │   └──────────────────────┘  │
│   [Save Transcript]          │   ... and 10 more entities  │
│                              │                              │
│                              │   ⚠️ PHI Detected            │
│                              │   Categories: MEDICATION,    │
│                              │   MEDICAL_CONDITION, etc.    │
└──────────────────────────────┴──────────────────────────────┘
```

### Mobile View (<768px width)
```
┌─────────────────────────────┐
│   Transcribe Page Header    │
├─────────────────────────────┤
│                             │
│   📝 TRANSCRIPT (100%)      │
│                             │
│   Patient Name: [_______]   │
│                             │
│   ┌───────────────────────┐ │
│   │ Transcript text       │ │
│   │ editable area         │ │
│   └───────────────────────┘ │
│                             │
│   [Save Transcript]         │
│                             │
├─────────────────────────────┤
│                             │
│   🏥 MEDICAL ANALYSIS       │
│       (100%)                │
│                             │
│   Analysis Summary          │
│   Medical Entities          │
│   PHI Warning               │
│   Categories                │
│                             │
└─────────────────────────────┘
```

## Key Features

### Responsive Design
- **Desktop (md+)**: 50/50 split between transcript and medical analysis
- **Mobile (xs-sm)**: Stacked layout, transcript on top, analysis below
- **Dynamic**: If no medical analysis, transcript takes full width

### Enhanced UX
1. **Parallel Viewing**: Clinicians can review transcript while viewing medical insights
2. **Scrollable Analysis**: Medical entities section has max-height with scroll
3. **Increased Transcript Height**: 20 rows when analysis is present (vs 8 rows alone)
4. **Compact Summary**: Analysis summary uses vertical stack on smaller screens

### Visual Improvements
- Medical entities limited to 15 items (vs 10) with scroll
- Compact summary layout with icons
- Better use of screen real estate
- Reduced need for scrolling

## Benefits

✅ **Improved Workflow**: Review both transcript and analysis simultaneously
✅ **Better Context**: See medical entities while editing transcript
✅ **Space Efficient**: Maximizes screen usage on larger displays
✅ **Mobile Friendly**: Gracefully stacks on smaller screens
✅ **Professional Look**: Clean, organized medical documentation interface

## Technical Implementation

### Material-UI Grid System
```jsx
<Grid container spacing={3}>
  <Grid item xs={12} md={medicalAnalysis ? 6 : 12}>
    {/* Transcript Card */}
  </Grid>
  
  {medicalAnalysis && (
    <Grid item xs={12} md={6}>
      {/* Medical Analysis Card */}
    </Grid>
  )}
</Grid>
```

### Responsive Breakpoints
- `xs={12}`: Full width on mobile
- `md={6}`: Half width on desktop (when analysis exists)
- `md={12}`: Full width when no analysis

### Dynamic Height
- Transcript: `minRows={medicalAnalysis ? 20 : 8}`
- Analysis: `maxHeight: '400px', overflowY: 'auto'`

## User Experience Flow

1. Upload audio → Transcription completes
2. Transcript appears on left (full width initially)
3. Medical analysis loads → Layout shifts to 50/50
4. Clinician can:
   - Edit transcript on left
   - Review medical entities on right
   - See PHI warnings
   - Enter patient name
   - Save everything together

Perfect for clinical documentation workflow! 🏥
