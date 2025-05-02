**Title:** Update FormState and Related Context Types for ID Refactoring

**Description:** Modify context-related type definitions (`FormState`, `EmailConflictModalDetails`, etc.) to use attendee IDs instead of indices or composite keys.

**Instructions:**

1.  Open `src/context/RegisterFormContext.tsx`.
2.  Modify the `FormState` interface:
    *   Inspect the `attendeeAddOrder` type. Ensure it stores `{ type: AttendeeType; id: string; }`.
    *   Modify the `emailConflictFlags` type: Change the key type from `Record<string, EmailConflictInfo>` (where key was `${type}-${index}`) to `Record<string, EmailConflictInfo>` (where key will now be the attendee `id`). Update the `EmailConflictInfo` interface if needed (e.g., `conflictingAttendeeId?: string;`).
3.  Modify the `EmailConflictModalDetails` interface:
    *   Remove `attendeeIndex`. Add `attendeeId: string;` (ID of the attendee whose preference might change).
    *   Remove `sourceConflictingName` and `actualConflictingName`. Add `sourceConflictingAttendeeId: string;` and `actualConflictingAttendeeId: string;`.
    *   Keep `attendeeType`, `attemptedEmail`, `canChangePreference`, `newPreference`.
4.  Modify the `RegisterFormContextType` interface:
    *   Update the signatures of all functions that currently accept an `index` parameter (e.g., `updateMasonField`, `updateGuestField`, `updateLadyPartnerField`, `updateGuestPartnerField`, `selectMasonTicket`, `selectLadyPartnerTicket`, `selectGuestTicket`, `selectGuestPartnerTicket`, `removeMasonByIndex`, `toggleSameLodge`, `toggleHasLadyPartner`, `removeGuestByIndex`, `toggleGuestUseContact`, `toggleGuestHasPartner`, `checkEmailOnBlur`, `clearEmailConflictFlag`) to accept `id: string` instead of `index: number`.
    *   Update the signature of `confirmEmailConflictResolution` and `cancelEmailConflictResolution` if they relied on index-based details (they now implicitly rely on the updated `EmailConflictModalDetails` structure). 