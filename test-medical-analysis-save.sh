#!/bin/bash

echo "🧪 Testing Medical Analysis Save Flow"
echo "======================================"
echo ""

echo "📋 Test Steps:"
echo "1. Upload a new audio file with medical content"
echo "2. Wait for transcription to complete"
echo "3. Verify medical analysis appears automatically"
echo "4. Edit the transcript if needed"
echo "5. Click 'Save Transcript'"
echo "6. Navigate to Reports page"
echo "7. Open the saved report"
echo "8. Verify medical analysis is still present"
echo ""

echo "✅ Expected Behavior:"
echo "- Medical analysis should display after transcription"
echo "- Saving should UPDATE the existing record (not create new)"
echo "- Medical analysis should persist when viewing the report"
echo ""

echo "🔍 To verify backend:"
echo "aws dynamodb scan --table-name clinicavoice-reports-prod --max-items 5"
echo ""

echo "📝 Sample medical text to test:"
echo "\"Patient presents with chest pain and shortness of breath. Blood pressure is 140/90. Heart rate is 85 beats per minute. Patient reports taking lisinopril 10 mg daily for hypertension. Recommending chest X-ray and EKG. Patient has history of diabetes mellitus type 2. Prescribing metformin 500 mg twice daily. Follow up in 2 weeks.\""
