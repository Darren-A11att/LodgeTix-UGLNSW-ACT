**Title:** Update Attendee Type Definitions for ID-Based Relationships

**Description:** Modify the core attendee type definitions in TypeScript to replace index-based relationships with ID-based relationships (UUID strings).

**Instructions:**

1.  Open `src/shared/types/register.ts`.
2.  Modify the `LadyPartnerData` interface:
    *   Remove the `masonIndex: number;` field.
    *   Add a `masonId: string;` field.
3.  Modify the `GuestPartnerData` interface:
    *   Remove the `guestIndex: number;` field.
    *   Add a `guestId: string;` field.
4.  Ensure `MasonData`, `GuestData`, `LadyPartnerData`, and `GuestPartnerData` interfaces all have the `id: string;` field (it should already exist from previous UUID work, but verify). 