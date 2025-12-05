# Appointment Scheduling User Guide

## Overview

The Appointment Scheduling system in ClinicaVoice helps clinicians manage their schedules, book patient appointments, and track appointment status. This guide covers everything from creating appointments to managing your calendar and analyzing appointment patterns.

## Table of Contents

1. [Scheduling an Appointment](#scheduling-an-appointment)
2. [Viewing Your Calendar](#viewing-your-calendar)
3. [Managing Appointment Status](#managing-appointment-status)
4. [Rescheduling Appointments](#rescheduling-appointments)
5. [Cancelling Appointments](#cancelling-appointments)
6. [Blocking Time Slots](#blocking-time-slots)
7. [Today's Appointments Dashboard](#todays-appointments-dashboard)
8. [Appointment Analytics](#appointment-analytics)
9. [Exporting Appointment Data](#exporting-appointment-data)

---

## Scheduling an Appointment

### Step-by-Step Instructions

1. **Navigate to Appointments**
   - Click "Appointments" in the sidebar
   - Or click "Schedule Appointment" from patient profile
   - Or click on an empty time slot in the calendar

2. **Select Patient**
   - Use the patient selector dropdown
   - Search by name or MRN
   - Or click "Add New Patient" to create one

3. **Choose Date and Time**
   - Select date from calendar picker
   - Choose time from dropdown (15-minute increments)
   - System shows available time slots

4. **Set Appointment Details**
   - **Type**: Select from dropdown
     - Consultation
     - Follow-up
     - Procedure
     - Urgent
   - **Duration**: Auto-filled based on type, can be customized
     - Adjustable in 15-minute increments
   - **Notes**: Add any relevant information (optional)

5. **Save Appointment**
   - Click "Schedule Appointment"
   - System checks for conflicts
   - Confirmation message appears

### Appointment Types and Default Durations

| Type | Default Duration | Typical Use |
|------|-----------------|-------------|
| Consultation | 30 minutes | Initial patient visits |
| Follow-up | 15 minutes | Check-ups, progress reviews |
| Procedure | 60 minutes | Medical procedures |
| Urgent | 20 minutes | Urgent care needs |

### Conflict Detection

The system automatically prevents:
- **Double-booking**: Can't schedule overlapping appointments
- **Blocked time**: Can't book during breaks or blocked slots
- **Past dates**: Can't schedule appointments in the past

If a conflict is detected:
- Error message explains the issue
- Suggested alternative times may be shown
- Choose a different time slot

---

## Viewing Your Calendar

### Calendar Views

**Day View**
- Shows one day at a time
- Hourly breakdown
- Best for detailed daily planning
- Shows exact appointment times

**Week View**
- Shows 7 days at once
- See patterns across the week
- Identify busy and slow periods
- Plan ahead effectively

**Month View**
- Shows entire month
- High-level overview
- Spot gaps in schedule
- Long-term planning

### Switching Views

- Click "Day", "Week", or "Month" buttons at top of calendar
- Use arrow buttons to navigate forward/backward
- Click "Today" to return to current date

### Calendar Features

**Color Coding**
- 🟦 **Blue**: Consultation appointments
- 🟩 **Green**: Follow-up appointments
- 🟨 **Yellow**: Procedure appointments
- 🟥 **Red**: Urgent appointments
- ⬛ **Gray**: Blocked time slots

**Appointment Information**
Each appointment shows:
- Patient name
- Appointment time
- Duration
- Appointment type
- Status indicator

**Quick Actions**
- Click appointment to view details
- Hover for quick preview
- Right-click for context menu (future feature)

### Navigating the Calendar

**Keyboard Shortcuts** (future feature)
- Arrow keys: Navigate dates
- T: Jump to today
- D/W/M: Switch to day/week/month view

**Date Picker**
- Click date in header to open picker
- Jump to any date quickly
- Navigate months easily

---

## Managing Appointment Status

### Appointment Statuses

| Status | Meaning | When to Use |
|--------|---------|-------------|
| **Scheduled** | Initial state | Appointment created |
| **Confirmed** | Patient confirmed | Patient confirmed attendance |
| **Completed** | Visit finished | After appointment occurs |
| **Cancelled** | Appointment cancelled | Patient or clinician cancels |
| **No-Show** | Patient didn't attend | Patient missed appointment |

### Updating Status

1. **Open Appointment**
   - Click appointment in calendar
   - Or find in appointment list

2. **Change Status**
   - Click status dropdown
   - Select new status
   - Add reason if required (for cancellations)

3. **Save Changes**
   - Click "Update Status"
   - System records change with timestamp

### Status-Specific Actions

**Marking as Completed**
- System prompts: "Create transcription for this visit?"
- Click "Yes" to start transcription immediately
- Or click "No" to complete without transcription

**Marking as Cancelled**
- **Reason required**: Must provide cancellation reason
- Common reasons:
  - Patient request
  - Clinician unavailable
  - Emergency
  - Rescheduled
  - Other (specify)

**Marking as No-Show**
- Use when patient doesn't attend
- Helps track no-show patterns
- Included in analytics

### Status History

- All status changes are tracked
- View history in appointment details
- Shows who made changes and when
- Useful for auditing and analysis

---

## Rescheduling Appointments

### How to Reschedule

1. **Open Appointment**
   - Find appointment in calendar
   - Click to open details

2. **Click "Reschedule"**
   - Reschedule dialog opens
   - Current date/time shown

3. **Select New Date/Time**
   - Choose new date from picker
   - Select new time slot
   - System checks for conflicts

4. **Confirm Reschedule**
   - Review new details
   - Click "Confirm Reschedule"
   - Original creation date preserved

### Important Notes

- **Original date preserved**: System tracks when appointment was first created
- **Conflict checking**: New time slot must be available
- **Patient notification**: Patient receives update (if portal active)
- **Cancel option**: Can cancel reschedule to keep original time

### Best Practices

✅ **Do:**
- Notify patient before rescheduling
- Check patient availability
- Reschedule as soon as possible
- Document reason in notes

❌ **Don't:**
- Reschedule without patient consent
- Reschedule to conflicting times
- Forget to update patient
- Reschedule repeatedly

---

## Cancelling Appointments

### Cancellation Process

1. **Open Appointment**
2. **Click "Cancel Appointment"**
3. **Provide Reason** (required)
   - Patient request
   - Clinician unavailable
   - Emergency
   - Weather/facility closure
   - Other (specify)
4. **Confirm Cancellation**

### What Happens When You Cancel

- Appointment status changes to "Cancelled"
- Time slot becomes available
- Cancellation reason stored
- Timestamp and user recorded
- Patient notified (if portal active)

### Cancellation vs. Deletion

**Cancel** (Recommended):
- Keeps appointment in history
- Maintains audit trail
- Included in analytics
- Can view later

**Delete** (Not recommended):
- Removes appointment completely
- No history maintained
- Not available in standard interface

### Cancellation Analytics

Track cancellation patterns:
- Cancellation rate by type
- Common cancellation reasons
- Patient-specific patterns
- Time-based trends

---

## Blocking Time Slots

### Why Block Time?

Block time slots for:
- Lunch breaks
- Administrative tasks
- Meetings
- Training sessions
- Personal time off
- Facility maintenance

### Creating a Time Block

1. **Navigate to Calendar**
2. **Click "Block Time"** or click on time slot
3. **Set Details**
   - **Date**: When to block
   - **Start Time**: Block begins
   - **End Time**: Block ends
   - **Reason**: Why blocking (required)
   - **Type**: Break, Admin, Meeting, Other

4. **Save Block**
   - Time becomes unavailable
   - Shows as gray on calendar
   - Prevents appointment booking

### Recurring Time Blocks

**Daily Blocks**
- Example: Lunch break every day
- Set once, applies daily
- Can set end date

**Weekly Blocks**
- Example: Staff meeting every Monday
- Select days of week
- Repeats weekly

**Custom Patterns**
- More complex schedules
- Specific dates only
- Flexible configuration

### Managing Time Blocks

**View Blocks**
- Shown in gray on calendar
- Labeled with reason
- Distinct from appointments

**Edit Blocks**
- Click block to open
- Modify time or reason
- Save changes

**Remove Blocks**
- Click block
- Click "Remove Block"
- Time becomes available

---

## Today's Appointments Dashboard

### Dashboard Widget

The dashboard shows today's appointments at a glance:

**Location**: Main dashboard page

**Information Displayed**:
- All appointments for current day
- Chronological order (earliest first)
- Patient name and MRN
- Appointment time
- Appointment type
- Current status

### Imminent Appointments

**Highlighted Appointments**:
- Appointments within next hour shown in orange
- Helps you prepare for upcoming visits
- Updates in real-time

### Quick Actions from Dashboard

- **View Details**: Click appointment to see full details
- **Update Status**: Quick status change buttons
- **Start Transcription**: Begin transcription for completed visits
- **View Patient**: Jump to patient profile

### Empty State

When no appointments scheduled:
- "No appointments today" message
- Suggestion to review schedule
- Link to calendar view

---

## Appointment Analytics

### Accessing Analytics

1. Navigate to "Analytics" in sidebar
2. Select "Appointments" tab
3. Choose date range

### Available Metrics

**Appointment Counts**
- Total appointments by status
- Scheduled vs. completed
- Cancelled vs. no-show
- Trends over time

**No-Show Rate**
- Percentage of no-shows
- Comparison to previous periods
- Patient-specific patterns
- Day/time patterns

**Cancellation Rate**
- Percentage of cancellations
- Cancellation reasons breakdown
- Advance notice analysis
- Trends identification

**Average Duration**
- By appointment type
- Actual vs. scheduled
- Efficiency metrics
- Capacity planning

**Patient Volume**
- New vs. returning patients
- Appointments per day/week/month
- Peak times identification
- Capacity utilization

### Using Analytics

**Optimize Scheduling**:
- Identify peak times
- Adjust availability
- Reduce no-shows
- Improve efficiency

**Improve Operations**:
- Spot bottlenecks
- Balance workload
- Plan staffing
- Enhance patient experience

**Track Performance**:
- Monitor trends
- Set benchmarks
- Measure improvements
- Report to administration

### Filtering Analytics

- **Date Range**: Custom date selection
- **Appointment Type**: Filter by type
- **Status**: Include/exclude statuses
- **Patient**: Individual patient analysis

---

## Exporting Appointment Data

### Export Options

**Export Appointment List**
1. Navigate to Appointments page
2. Apply filters (optional)
3. Click "Export to CSV"
4. File downloads with timestamp

**Export Calendar View**
1. Select date range in calendar
2. Click "Export"
3. Choose format (CSV)
4. Download file

### What's Included

- Appointment date and time
- Patient name and MRN
- Appointment type
- Duration
- Status
- Notes
- Created by/date
- Modified by/date

### Export Uses

- **Reporting**: Generate reports for administration
- **Billing**: Track billable appointments
- **Analysis**: Analyze in spreadsheet software
- **Backup**: Create backup records
- **Integration**: Import into other systems

### Privacy and Security

- Exports contain PHI
- Handle securely
- Follow HIPAA guidelines
- Delete when no longer needed
- Encrypt if transmitting

---

## Tips and Best Practices

### Scheduling Efficiency

✅ **Do:**
- Schedule similar appointment types together
- Leave buffer time between appointments
- Block time for administrative tasks
- Review schedule at start of day
- Confirm appointments in advance

❌ **Don't:**
- Overbook your schedule
- Skip breaks
- Schedule back-to-back complex appointments
- Ignore no-show patterns
- Forget to update status

### Patient Communication

✅ **Do:**
- Confirm appointments 24 hours ahead
- Notify patients of changes promptly
- Provide clear instructions
- Send reminders
- Follow up on no-shows

❌ **Don't:**
- Assume patients remember appointments
- Reschedule without notice
- Cancel at last minute
- Ignore patient preferences

### Time Management

✅ **Do:**
- Use time blocks effectively
- Plan for unexpected delays
- Review analytics regularly
- Adjust schedule based on patterns
- Maintain work-life balance

❌ **Don't:**
- Overcommit your time
- Skip lunch breaks
- Ignore scheduling conflicts
- Work through blocked time

---

## Common Questions

**Q: Can I schedule appointments for other clinicians?**
A: Currently, each clinician manages their own schedule. Multi-clinician scheduling is a future feature.

**Q: What if a patient needs a longer appointment?**
A: Adjust the duration when creating the appointment. Use 15-minute increments.

**Q: Can patients schedule their own appointments?**
A: Not currently. Patient self-scheduling is planned for a future release.

**Q: How far in advance can I schedule?**
A: There's no limit. Schedule as far ahead as needed.

**Q: What happens to appointments when I mark a patient inactive?**
A: Past appointments remain. Cancel future appointments before marking patient inactive.

**Q: Can I see cancelled appointments in my calendar?**
A: Yes, cancelled appointments remain visible with "Cancelled" status. Filter them out if desired.

**Q: How do I handle walk-in patients?**
A: Create an appointment with current date/time, or mark as "Urgent" type.

**Q: Can I print my schedule?**
A: Use your browser's print function, or export to CSV and print from spreadsheet software.

---

## Need Help?

If you encounter issues or have questions:
- Contact your system administrator
- Refer to the Patient Management Guide for patient-related questions
- Check the Patient Portal Guide for portal-specific information
