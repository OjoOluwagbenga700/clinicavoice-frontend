# 🗑️ How to Delete a Patient

## Quick Answer

Currently, there's no delete button in the UI, but you have 3 options:

## Option 1: Using AWS Console (Easiest)

1. **Go to AWS DynamoDB Console:**
   - https://console.aws.amazon.com/dynamodb/

2. **Find the patients table:**
   - Look for: `clinicavoice-patients-prod`
   - Click on it

3. **Explore items:**
   - Click "Explore table items"
   - Find the patient you want to delete
   - You can search by email or name

4. **Delete the item:**
   - Click on the patient record
   - Click "Actions" → "Delete item"
   - Confirm deletion

## Option 2: Using AWS CLI

```bash
# First, get the patient ID and userId
# You can see these in the patient profile URL or in the browser console

# Delete the patient
aws dynamodb delete-item \
  --table-name clinicavoice-patients-prod \
  --key '{"id": {"S": "PATIENT_ID_HERE"}, "userId": {"S": "USER_ID_HERE"}}'
```

**Example:**
```bash
aws dynamodb delete-item \
  --table-name clinicavoice-patients-prod \
  --key '{"id": {"S": "99f30e51-771f-4c81-96cd-283edcaf6213"}, "userId": {"S": "64080478-90e1-70ac-4de8-3e88f61ddd68"}}'
```

## Option 3: Using the API (Backend Soft Delete)

The backend has a soft delete function that marks patients as "inactive" instead of deleting them.

```bash
# Get your auth token from browser (F12 → Application → Local Storage → idToken)
AUTH_TOKEN="your-id-token-here"

# Soft delete the patient
curl -X DELETE \
  https://oa5uhmedaj.execute-api.us-east-1.amazonaws.com/prod/patients/PATIENT_ID \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

This marks the patient as "inactive" but doesn't delete the record.

## Option 4: Add Delete Button to UI (Recommended)

I can add a delete button to the patient profile page. Would you like me to do that?

It would:
- Add a "Delete Patient" button on the patient profile
- Show a confirmation dialog
- Soft delete (mark as inactive) or hard delete
- Navigate back to patients list

## Understanding Soft Delete vs Hard Delete

**Soft Delete (Current Backend Implementation):**
- ✅ Marks patient as "inactive"
- ✅ Preserves data for records/compliance
- ✅ Can be reactivated later
- ✅ Safer option
- ❌ Patient still exists in database

**Hard Delete:**
- ✅ Completely removes patient record
- ❌ Cannot be undone
- ❌ May break referential integrity (appointments, reports)
- ❌ Not recommended for production

## Quick Script to Delete Patient

Create a file `delete-patient.sh`:

```bash
#!/bin/bash

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./delete-patient.sh PATIENT_ID USER_ID"
    echo "Example: ./delete-patient.sh 99f30e51-771f-4c81-96cd-283edcaf6213 64080478-90e1-70ac-4de8-3e88f61ddd68"
    exit 1
fi

PATIENT_ID=$1
USER_ID=$2

echo "Deleting patient: $PATIENT_ID"
echo "User ID: $USER_ID"
echo ""

aws dynamodb delete-item \
  --table-name clinicavoice-patients-prod \
  --key "{\"id\": {\"S\": \"$PATIENT_ID\"}, \"userId\": {\"S\": \"$USER_ID\"}}"

if [ $? -eq 0 ]; then
    echo "✅ Patient deleted successfully"
else
    echo "❌ Failed to delete patient"
fi
```

Make it executable:
```bash
chmod +x delete-patient.sh
```

Use it:
```bash
./delete-patient.sh PATIENT_ID USER_ID
```

## How to Find Patient ID and User ID

### Method 1: From Browser Console

1. Go to patient profile page
2. Open browser console (F12)
3. Type: `window.location.pathname`
4. You'll see: `/dashboard/patients/PATIENT_ID`

For User ID:
1. In console, type: `localStorage.getItem('userInfo')`
2. Look for the `sub` field - that's the userId

### Method 2: From DynamoDB Console

1. Go to DynamoDB Console
2. Open `clinicavoice-patients-prod` table
3. Click "Explore table items"
4. You'll see both `id` (patient ID) and `userId`

### Method 3: From API Response

1. Open browser console (F12)
2. Go to Network tab
3. Refresh patient profile page
4. Look for the `/patients/xxx` request
5. Check the response - it has both IDs

## Recommended Approach

**For testing/development:**
- Use AWS Console (Option 1) - easiest and safest

**For production:**
- Add delete button to UI (Option 4)
- Use soft delete (mark as inactive)
- Require confirmation dialog
- Log the deletion for audit trail

## Want Me to Add a Delete Button?

I can quickly add a delete button to the patient profile page with:
- ✅ Confirmation dialog ("Are you sure?")
- ✅ Soft delete (marks as inactive)
- ✅ Success notification
- ✅ Navigate back to patients list
- ✅ Only visible to clinicians

Just let me know!

## Summary

**Quickest way right now:**
1. Go to AWS DynamoDB Console
2. Find `clinicavoice-patients-prod` table
3. Find the patient record
4. Delete it

**Better long-term solution:**
- Add delete button to UI
- Use soft delete (mark as inactive)
- Can filter out inactive patients in the list
