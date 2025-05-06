# Register Components Directory Structure

## Structure Overview

```
src/components/register/
├── attendee/
│   ├── AttendeeCounter.tsx
│   ├── AttendeeDetails.tsx
│   ├── AttendeeEditModal.tsx
│   ├── AttendeeEventAccess.tsx
│   └── AttendeeSummary.tsx
├── forms/
│   ├── guest/
│   │   ├── GuestAdditionalInfo.tsx
│   │   ├── GuestBasicInfo.tsx
│   │   ├── GuestContactInfo.tsx
│   │   ├── GuestForm.tsx
│   │   ├── GuestPartnerForm.tsx
│   │   └── GuestPartnerToggle.tsx
│   └── mason/
│       ├── LadyPartnerForm.tsx
│       ├── LadyPartnerToggle.tsx
│       ├── MasonAdditionalInfo.tsx
│       ├── MasonBasicInfo.tsx
│       ├── MasonContactInfo.tsx
│       ├── MasonForm.tsx
│       ├── MasonGrandLodgeFields.tsx
│       └── MasonLodgeInfo.tsx
├── functions/
│   ├── AddRemoveControl.tsx
│   ├── AutocompleteInput.tsx
│   ├── DraftRecoveryModal.tsx
│   ├── PhoneInputWrapper.css
│   ├── PhoneInputWrapper.tsx
│   └── TermsAndConditions.tsx
├── order/
│   ├── ConfirmationSection.tsx
│   ├── OrderSummarySection.tsx
│   └── PaymentSection.tsx
├── registration/
│   ├── RegisterSteps.tsx
│   ├── RegistrationRecoveryModal.tsx
│   └── RegistrationTypeSelection.tsx
├── reservations/
│   ├── ReservationTimer.tsx
│   ├── ReservationTimerSection.realtime.tsx
│   └── ReservationTimerSection.tsx
├── ticket/
│   ├── AttendeeTicketItem.tsx
│   ├── EventSelectionList.tsx
│   ├── PackageTicketSection.tsx
│   ├── TicketSelection.tsx
│   ├── TicketingModeToggle.tsx
│   ├── TicketingSummary.tsx
│   └── UniformTicketing.tsx
├── PackageAvailability.tsx
├── PackageSelection.tsx
└── ValidationErrorSummary.tsx
```

## Component Groups

### Attendee Components
Components related to attendee management, such as counting, displaying details, and editing.

### Form Components
Segregated by attendee type (guest or mason), handles data input for each category of attendee.

### Function Components
Utility components used across the registration process, such as phone input, autocomplete, and terms display.

### Order Components
Components for handling the order process, including summary, confirmation, and payment.

### Registration Components
Core registration flow components, including steps and registration type selection.

### Reservation Components
Components handling the time-limited reservation process.

### Ticket Components
Components for managing ticket selection, including package and individual event tickets.

### Root-level Components
General components related to package selection and validation that don't fit into the above categories.