# Confidence Scores Explained

## What is the Percentage?

The percentage (e.g., **98%**, **85%**, **72%**) represents the **AI confidence score** - how certain AWS Comprehend Medical is that it correctly identified that specific medical term.

## How to Interpret Confidence Scores

### 🟢 High Confidence (>90%)
**Example: lisinopril 10 mg [98%]**

- **Meaning**: The AI is very confident this term is correct
- **Action**: Generally reliable, minimal review needed
- **Color**: Green chip/border
- **Label**: "High confidence"

### 🟡 Good Confidence (70-90%)
**Example: blood pressure [85%]**

- **Meaning**: The AI is reasonably confident but not certain
- **Action**: Quick verification recommended
- **Color**: Orange chip/border
- **Label**: "Good confidence"

### ⚪ Low Confidence (<70%)
**Example: unclear term [65%]**

- **Meaning**: The AI is uncertain about this identification
- **Action**: Manual review required
- **Color**: Gray chip/border
- **Label**: "Review needed"

## Why Confidence Scores Matter

### 1. **Quality Assurance**
- Helps clinicians know which terms to double-check
- Reduces time spent reviewing highly accurate identifications
- Focuses attention on uncertain terms

### 2. **Documentation Accuracy**
- High confidence terms are likely transcribed correctly
- Low confidence terms may need correction
- Prevents errors in medical records

### 3. **Clinical Decision Support**
- Medications with high confidence are reliably identified
- Conditions with low confidence may need clarification
- Helps ensure complete and accurate documentation

## Real-World Examples

### Example 1: High Confidence Medication
```
💊 Medications
┌─────────────────────────────────┐
│ lisinopril 10 mg      [98%] ✓  │
│ GENERIC_NAME                    │
│ High confidence                 │
└─────────────────────────────────┘
```
**Interpretation**: The AI is 98% certain this is "lisinopril 10 mg". Very reliable - likely correct.

### Example 2: Good Confidence Symptom
```
🩺 Medical Conditions
┌─────────────────────────────────┐
│ chest discomfort      [82%] ⚠  │
│ SYMPTOM                         │
│ Good confidence                 │
└─────────────────────────────────┘
```
**Interpretation**: The AI is 82% certain. Probably correct, but worth a quick glance at the transcript to verify.

### Example 3: Low Confidence Term
```
🔬 Tests & Procedures
┌─────────────────────────────────┐
│ unclear test          [68%] ⚠  │
│ TEST_NAME                       │
│ Review needed                   │
└─────────────────────────────────┘
```
**Interpretation**: The AI is only 68% certain. Check the transcript - this might be misidentified or unclear audio.

## How AWS Comprehend Medical Calculates Confidence

The confidence score is based on:
1. **Context**: How the term is used in the sentence
2. **Medical Knowledge**: Match against medical terminology databases
3. **Language Patterns**: Common medical phrasing and structure
4. **Ambiguity**: How clear or unclear the term is

## Best Practices for Clinicians

### ✅ DO:
- Trust high confidence scores (>90%) for routine review
- Verify good confidence scores (70-90%) when critical
- Always review low confidence scores (<70%)
- Use confidence scores to prioritize your review time

### ❌ DON'T:
- Blindly trust any AI output without review
- Ignore low confidence scores
- Assume 100% accuracy even with high confidence
- Skip verification for critical medications or diagnoses

## UI Indicators

### Visual Cues
1. **Color-coded borders**:
   - Green = High confidence
   - Orange = Good confidence
   - Gray = Low confidence

2. **Chip colors**:
   - Green chip = >90%
   - Orange chip = 70-90%
   - Gray chip = <70%

3. **Text labels**:
   - "High confidence"
   - "Good confidence"
   - "Review needed"

### Summary Box
The overview box includes a legend:
> 💡 Confidence scores show AI accuracy: Green (>90%) = High, Orange (70-90%) = Good, Gray (<70%) = Review needed

## Frequently Asked Questions

### Q: Can I trust 100% confidence scores?
**A:** Even 100% confidence should be reviewed. AI is very accurate but not infallible. Always verify critical information.

### Q: What if everything has low confidence?
**A:** This might indicate:
- Poor audio quality
- Unclear speech
- Non-standard medical terminology
- Technical issues with transcription
Review the transcript carefully and consider re-recording if needed.

### Q: Do confidence scores affect billing or legal documentation?
**A:** No. Confidence scores are for your review only. The final documented transcript is what matters legally and for billing.

### Q: Should I document the confidence scores?
**A:** No need. They're a quality assurance tool during review. The final saved transcript doesn't include confidence scores.

## Summary

**Confidence Score = AI's certainty that it correctly identified a medical term**

- **>90%** = Very reliable, minimal review
- **70-90%** = Probably correct, quick check recommended
- **<70%** = Uncertain, manual review required

Use these scores to work smarter, not harder! Focus your attention where it's needed most. 🎯
