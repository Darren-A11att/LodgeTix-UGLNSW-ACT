**Title:** Adapt Backend API/Functions for Saving Registration Data

**Description:** Modify the backend API endpoint(s) responsible for receiving registration form data and saving it to the database according to the new normalized schema.

**Instructions:**

1.  **Identify Backend Code:** Locate the server-side code (e.g., Supabase Edge Function, Next.js API route, separate backend service) that handles the POST/PUT request for submitting the registration form.
2.  **Update API Input Validation:** Adjust input validation (e.g., using Zod, Yup) to expect the refactored frontend payload structure (separate attendee arrays with UUIDs and relationship IDs like `masonId`, `guestId`).
3.  **Implement Save Logic (within a Database Transaction):**
    *   **Get/Create Payer Contact/Org:** Based on submitted payer details (and potentially `auth.user()`), find or create the corresponding record(s) in `public.Contacts` and potentially `public.Organisations`. Use helper functions for this lookup/creation.
    *   **Get/Create Customer:** Find or create the record in `public.Customers`, linking it to the `contactId` or `organisationId` found above. Get the `customerId`.
    *   **Create Registration:** Insert into `public.Registrations`, linking `customerId` and `eventId`. Get the `registrationId`.
    *   **Process Attendees Loop:**
        *   Create a temporary map `frontendIdToBackendAttendeeIdMap = {}`.
        *   Iterate through the combined list of attendees (Masons, Guests, Partners) from the input payload.
        *   For each attendee:
            *   Find/Create `Contacts` record (similar to payer, handle potential reuse). Get `contactId`.
            *   If Mason, Find/Create `MasonicProfiles` record, link to `contactId`.
            *   Insert into `public.Attendees` with `registrationId`, `contactId`, `attendeeType`, `eventTitle` (if provided), `dietary`, `specialNeeds` (if stored here), `contactPreference`, `delegatedContactId` (lookup contact ID based on preference), `relationship` (for partners). Get the new `attendeeId`.
            *   Store mapping: `frontendIdToBackendAttendeeIdMap[attendee.id] = attendeeId;`.
    *   **Process Relationships Loop:**
        *   Iterate through the partners *again* from the input payload.
        *   Find the partner's backend `attendeeId` using the map: `partnerAttendeeId = frontendIdToBackendAttendeeIdMap[partner.id]`.
        *   Find the corresponding Mason/Guest backend ID using the map: `relatedBackendId = frontendIdToBackendAttendeeIdMap[partner.masonId || partner.guestId]`.
        *   `UPDATE public.Attendees SET relatedAttendeeId = relatedBackendId WHERE attendeeId = partnerAttendeeId;`.
    *   **Process Tickets:**
        *   Iterate through the ticket selections from the payload.
        *   For each selection, find the backend `attendeeId` from the map.
        *   Insert into `public.Tickets` linking `attendeeId`, child `eventId`, `ticketDefinitionId`, `pricePaid`.
    *   **Update Registration:** Set `primaryAttendeeId` on the `Registrations` record (find backend ID of primary attendee from map).
4.  **Return Success/Error:** Send appropriate response to the frontend.
5.  **Tech:** Use Supabase client library (`supabase.rpc` for transactions or careful sequencing of inserts/updates) or appropriate ORM methods. 