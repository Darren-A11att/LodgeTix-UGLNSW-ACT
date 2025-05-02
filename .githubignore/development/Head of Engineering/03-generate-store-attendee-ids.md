**Title:** Generate and Store UUIDs for New Attendees in Context

**Description:** Modify the context functions responsible for adding attendees to generate a UUID using `crypto.randomUUID()` and store it in the attendee's `id` field and the `attendeeAddOrder` array.

**Instructions:**

1.  Open `src/context/RegisterFormContext.tsx`.
2.  Modify the `addMason` function:
    *   Before creating the `newMason` object, generate an ID: `const newMasonId = crypto.randomUUID();`.
    *   Ensure the `newMason` object is assigned `id: newMasonId`.
    *   Ensure the `newAttendeeOrder` object pushed to `attendeeAddOrder` uses `id: newMasonId`.
3.  Modify the `addGuest` function:
    *   Before creating the `newGuest` object, generate an ID: `const newGuestId = crypto.randomUUID();`.
    *   Ensure the `newGuest` object is assigned `id: newGuestId`.
    *   Ensure the `newAttendeeOrder` object pushed to `attendeeAddOrder` uses `id: newGuestId`.
4.  Modify the `toggleHasLadyPartner` function:
    *   Inside the `if (checked)` block where a new partner is added:
        *   Before creating the `newPartner` object, generate an ID: `const newPartnerId = crypto.randomUUID();`.
        *   Ensure the `newPartner` object is assigned `id: newPartnerId`.
        *   Ensure it correctly assigns `masonId: mason.id` (where `mason` is the mason found using the incoming `masonId` (previously `index`)).
5.  Modify the `toggleGuestHasPartner` function:
    *   Inside the `if (checked)` block where a new partner is added:
        *   Before creating the `newPartner` object, generate an ID: `const newPartnerId = crypto.randomUUID();`.
        *   Ensure the `newPartner` object is assigned `id: newPartnerId`.
        *   Ensure it correctly assigns `guestId: guest.id` (where `guest` is the guest found using the incoming `guestId` (previously `index`)). 