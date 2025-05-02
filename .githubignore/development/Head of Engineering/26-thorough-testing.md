**Title:** Thorough Testing of ID-Based Refactoring and New Schema

**Description:** Perform comprehensive testing after the frontend and backend refactoring to ensure stability, data integrity, and correct functionality.

**Instructions:**

1.  **Component Isolation Tests (Frontend):**
    *   Verify individual form components (`MasonContactInfo`, `GuestContactInfo`, `LadyPartnerForm`, `GuestPartnerForm`) correctly receive and use the `id` prop.
    *   Test calls to context functions from these components, ensuring the correct `id` is passed.
    *   Test conditional rendering within components based on data associated with the `id`.
2.  **Context State Tests (Frontend):**
    *   Test adding Masons, Guests, and Partners. Verify stable `id`s are assigned and relationships (`masonId`, `guestId`) are correctly set.
    *   Test removing Masons, Guests, and Partners (using the new `*ById` functions). Verify the correct attendee and their partner (if applicable) are removed without affecting others' relationships or IDs.
    *   Test updating various fields for different attendee types. Verify the correct attendee is updated using ID lookup.
    *   Test the `attendeeAddOrder` state reflects additions/removals correctly.
3.  **Rendering Order Tests (Frontend):**
    *   Verify `AttendeeDetails` renders attendees in the correct order based on `attendeeAddOrder`.
    *   Verify partners always render immediately after their corresponding Mason/Guest, regardless of addition/removal order.
4.  **Email Conflict Logic Tests (Frontend):**
    *   Test all conflict scenarios (Mason vs Partner, Partner vs Mason, Mason vs Mason, etc.).
    *   Verify the conflict modal uses IDs internally and displays the correct attendee names based on the `actualConflictingAttendeeId`.
    *   Verify the "Confirm Change" action targets the correct attendee (identified by `attendeeId` in modal details) and updates their state correctly.
    *   Verify the "Cancel" action correctly sets the `emailConflictFlags` using the `attendeeId`.
5.  **End-to-End Tests (Frontend + Backend):**
    *   Perform a full registration flow (Myself & Others):
        *   Add multiple Masons, Guests, and Partners in various orders.
        *   Remove some attendees.
        *   Fill in all details.
        *   Trigger and resolve email conflicts.
        *   Select tickets.
        *   Submit the registration.
    *   **Verify Saved Data (Backend):** Inspect the Supabase database directly. Check that `Contacts`, `MasonicProfiles`, `Customers`, `Registrations`, `Attendees`, `Tickets`, etc., are created correctly with the right data and foreign key relationships (especially `relatedAttendeeId`).
    *   **Verify Loaded Data (Backend + Frontend):** Implement functionality to load an existing registration and verify that the frontend state is populated correctly, mirroring the saved data and structure (including rendering order).
6.  **Edge Case Testing:**
    *   Test maximum attendee limits.
    *   Test forms with only a Primary Mason.
    *   Test registrations with complex partner additions/removals.
    *   Test empty fields and validation triggers.
7.  **Database Constraint Testing (Backend):**
    *   Attempt to create data that violates UNIQUE constraints (e.g., duplicate `Customers.contactId`).
    *   Attempt operations that violate FOREIGN KEY constraints (e.g., delete a `Contact` referenced by an `Attendee`).
    *   Verify CHECK constraints (e.g., `Customers` link check). 