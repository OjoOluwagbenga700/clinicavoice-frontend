# Patient Management User Guide

## Overview

The Patient Management system in ClinicaVoice allows clinicians to create, manage, and organize patient records. This guide covers all aspects of patient management including creating patients, searching, viewing profiles, and managing patient portal access.

## Table of Contents

1. [Creating a New Patient](#creating-a-new-patient)
2. [Searching for Patients](#searching-for-patients)
3. [Viewing Patient Profiles](#viewing-patient-profiles)
4. [Editing Patient Information](#editing-patient-information)
5. [Managing Patient Status](#managing-patient-status)
6. [Patient Portal Invitations](#patient-portal-invitations)
7. [Exporting Patient Data](#exporting-patient-data)

---

## Creating a New Patient

### Step-by-Step Instructions

1. **Navigate to Patients Page**
   - Click "Patients" in the sidebar menu
   - Click the "Add New Patient" button

2. **Enter Patient Demographics**
   - **First Name** (required)
   - **Last Name** (required)
   - **Date of Birth** (required) - Use the date picker
   - **Gender** (required) - Select from dropdown

3. **Enter Contact Information**
   - **Phone Number** (required)
   - **Email Address** (required)
   - **Address** (optional but recommended)
     - Street
     - City
     - Province
     - Postal Code
     - Country
   - **Preferred Contact Method** - Choose phone, email, or SMS

4. **Save the Patient**
   - Click "Save Patient"
   - The system will automatically generate a unique Medical Record Number (MRN)
   - A success notification will appear

### What Happens Next

- The patient record is created with a unique MRN
- An invitation email is automatically sent to the patient's email address
- The patient's account status is set to "Pending" until they activate their account
- You can now link transcriptions and appointments to this patient

### Important Notes

- **MRN Generation**: The system automatically generates a unique Medical Record Number for each patient
- **Required Fields**: All fields marked with an asterisk (*) must be completed
- **Email Verification**: The patient's email will be verified when they activate their account

---

## Searching for Patients

### Quick Search

1. **Use the Search Bar**
   - Located at the top of the Patients page
   - Type any of the following:
     - Patient name (first or last)
     - Medical Record Number (MRN)
     - Phone number
     - Email address

2. **View Results**
   - Results appear in real-time as you type
   - Matching patients are displayed with:
     - Name
     - MRN
     - Age
     - Last visit date
     - Account status

### Filtering Patients

**Active/Inactive Toggle**
- By default, only active patients are shown
- Toggle "Show Inactive" to view inactive patients
- Use this to manage your current patient panel

**Sort Options**
- Sort by name (A-Z or Z-A)
- Sort by last visit date (most recent first)
- Sort by MRN

### No Results?

If your search returns no results:
- Check spelling
- Try searching by MRN instead of name
- Verify the patient exists in the system
- Check if the patient is marked as inactive

---

## Viewing Patient Profiles

### Accessing a Patient Profile

1. Click on any patient card from the patient list
2. Or search for the patient and click their name

### Profile Sections

**Demographics**
- Name, age, gender
- Date of birth
- Medical Record Number (MRN)
- Contact information
- Address

**Account Status**
- **Pending**: Invitation sent, awaiting activation
- **Active**: Patient has activated their portal account
- **Inactive**: Patient record is inactive

**Appointment History**
- All past appointments in chronological order
- Appointment date, time, and type
- Status (completed, cancelled, no-show)
- Links to associated transcriptions

**Transcription History**
- All transcriptions linked to this patient
- Date of transcription
- Quick access to view transcription details

**Medical History Summary**
- Recent diagnoses (from medical analysis)
- Current medications
- Key medical information

### Quick Actions from Profile

- **Edit Patient**: Update demographics or contact info
- **Schedule Appointment**: Create a new appointment
- **Create Transcription**: Start a new transcription for this patient
- **Resend Invitation**: If account is pending, resend activation email
- **Mark Inactive**: Deactivate the patient record

---

## Editing Patient Information

### How to Edit

1. Open the patient profile
2. Click "Edit Patient" button
3. Update any fields as needed
4. Click "Save Changes"

### What Can Be Edited

- Contact information (phone, email, address)
- Preferred contact method
- Demographics (name, date of birth, gender)

### What Cannot Be Changed

- Medical Record Number (MRN) - This is permanent
- Creation date and creator
- Account activation status (managed through portal)

### Best Practices

- **Verify Changes**: Always confirm changes with the patient
- **Update Regularly**: Keep contact information current
- **Document Changes**: The system automatically tracks who made changes and when

---

## Managing Patient Status

### Active vs. Inactive Patients

**Active Patients**
- Currently receiving care
- Appear in default patient list
- Can schedule appointments
- Can access patient portal (if activated)

**Inactive Patients**
- No longer receiving care
- Hidden from default views
- Cannot schedule new appointments
- Portal access disabled

### Marking a Patient Inactive

1. Open patient profile
2. Click "Mark as Inactive"
3. Confirm the action
4. Patient is removed from default views

### Reactivating a Patient

1. Toggle "Show Inactive" on patient list
2. Find the inactive patient
3. Open their profile
4. Click "Reactivate Patient"
5. Patient returns to active status

### When to Mark Inactive

- Patient has moved to another provider
- Patient is no longer seeking care
- Patient has requested record closure
- Administrative cleanup

---

## Patient Portal Invitations

### How Patient Portal Access Works

1. **Clinician Creates Patient**: You create the patient record with their email
2. **System Sends Invitation**: An automated email is sent to the patient
3. **Patient Activates Account**: Patient clicks the link and sets their password
4. **Patient Can Log In**: Patient gains access to their portal

### Invitation Email Contents

The patient receives an email with:
- Welcome message
- Activation link (valid for 7 days)
- Instructions for setting password
- Information about portal features

### Resending Invitations

**When to Resend:**
- Patient didn't receive the original email
- Activation link expired (after 7 days)
- Email was sent to wrong address

**How to Resend:**
1. Open patient profile
2. Look for "Pending" status badge
3. Click "Resend Invitation" button
4. New email is sent immediately

### Checking Activation Status

**Account Status Indicators:**
- 🟡 **Pending**: Invitation sent, not yet activated
- 🟢 **Active**: Patient has activated their account
- ⚫ **Inactive**: Account deactivated

### Troubleshooting Portal Access

**Patient didn't receive email:**
- Check spam/junk folder
- Verify email address is correct
- Resend invitation

**Activation link expired:**
- Resend invitation to generate new link
- New link valid for 7 days

**Patient forgot password:**
- Patient should use "Forgot Password" on login page
- They'll receive password reset email

---

## Exporting Patient Data

### Exporting Patient List

1. **Navigate to Patients Page**
2. **Apply Filters** (optional)
   - Search for specific patients
   - Filter by active/inactive
   - Sort as desired
3. **Click "Export to CSV"**
4. **File Downloads** with timestamp in filename

### What's Included in Export

- Patient name
- Medical Record Number (MRN)
- Date of birth
- Age
- Gender
- Phone number
- Email address
- Status (active/inactive)
- Last visit date
- Total visits

### Export Uses

- **Reporting**: Generate reports for administration
- **Analysis**: Analyze patient demographics
- **Backup**: Create backup records
- **Integration**: Import into other systems

### Privacy Considerations

- Exports contain PHI (Protected Health Information)
- Handle exported files securely
- Delete files when no longer needed
- Follow HIPAA guidelines for data handling

---

## Tips and Best Practices

### Data Entry

✅ **Do:**
- Verify patient information before saving
- Use consistent formatting for phone numbers
- Double-check email addresses
- Complete all required fields

❌ **Don't:**
- Enter placeholder or fake data
- Skip required fields
- Use abbreviations in names
- Forget to save changes

### Patient Communication

✅ **Do:**
- Inform patients about portal invitations
- Explain portal benefits
- Provide support for activation
- Keep contact information updated

❌ **Don't:**
- Assume patients received emails
- Share activation links insecurely
- Create accounts without patient consent

### Record Management

✅ **Do:**
- Review patient records regularly
- Update information as it changes
- Mark inactive patients appropriately
- Link transcriptions to correct patients

❌ **Don't:**
- Create duplicate patient records
- Leave outdated information
- Delete patients (use inactive status)
- Mix up patient records

---

## Common Questions

**Q: Can I change a patient's MRN?**
A: No, the MRN is permanent and cannot be changed once assigned.

**Q: What if I create a duplicate patient by mistake?**
A: Mark the duplicate as inactive. Contact your system administrator if you need to merge records.

**Q: How long are activation links valid?**
A: Activation links expire after 7 days. You can resend a new invitation at any time.

**Q: Can patients see all their information in the portal?**
A: Patients can view their appointments, transcriptions, and basic demographics. They cannot edit their information.

**Q: What happens to appointments when I mark a patient inactive?**
A: Past appointments remain in the system. Future appointments should be cancelled before marking inactive.

**Q: Can I export data for just one patient?**
A: Yes, search for the patient first, then export. The export will include only the filtered results.

---

## Need Help?

If you encounter issues or have questions:
- Contact your system administrator
- Refer to the Appointment Scheduling Guide for appointment-related questions
- Check the Patient Portal Guide for portal-specific information
