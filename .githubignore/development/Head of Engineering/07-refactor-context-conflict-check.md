**Title:** Refactor Context Email Conflict Check Logic for IDs

**Description:** Modify `checkEmailOnBlur`, `clearEmailConflictFlag`, `confirmEmailConflictResolution`, `cancelEmailConflictResolution` to operate using attendee IDs.

**Instructions:**

1.  Open `src/context/RegisterFormContext.tsx`.
2.  Modify `clearEmailConflictFlag(attendeeId: string)`:
    *   Change signature to accept `attendeeId: string`.
    *   Use `attendeeId` directly as the key to delete from `prev.emailConflictFlags`.
3.  Modify `checkEmailOnBlur(attendeeId: string, attendeeType: AttendeeType, email: string)`:
    *   Change signature to accept `attendeeId: string` and `attendeeType: AttendeeType` (this requires updating calling components in Task 09).
    *   Find `currentAttendee` using `attendeeId` and `attendeeType` by searching the appropriate array (`masons`, `guests`, etc.).
    *   Modify `findExistingDirectEmailOwner` helper function:
        *   Change signature to accept `excludeId: string` instead of `excludeIndex`.
        *   The inner `checkList` needs to compare `attendee.id !== excludeId` when iterating.
        *   It should return `{ type: AttendeeType; id: string; name: string; }` (where `id` is the ID of the found owner).
    *   Inside `if (duplicateOwner)`:
        *   Update any `console.log` to use IDs.
        *   Populate `EmailConflictModalDetails` using IDs (`attendeeId` (for the modal target), `attendeeType`, `sourceConflictingAttendeeId: attendeeId`, `actualConflictingAttendeeId: duplicateOwner.id`). Adjust target `attendeeId`/`attendeeType` based on the scenario (A, B, C) as before.
    *   Inside the `else` block (no conflict): Call `clearEmailConflictFlag(attendeeId)`.
    *   Update the `useCallback` dependency array for `checkEmailOnBlur` (likely needs `clearEmailConflictFlag` added if not already present).
4.  Modify `confirmEmailConflictResolution()`:
    *   Destructure `attendeeId` and `attendeeType` from `emailConflictModalDetails`.
    *   Use `attendeeId` as the key to clear from `emailConflictFlags`.
    *   Use `attendeeId` and `attendeeType` to find and update the correct attendee in the correct array (`masons`, `guests`, etc.) using `map`.
5.  Modify `cancelEmailConflictResolution()`:
    *   Destructure `attendeeId` and `actualConflictingAttendeeId` from `emailConflictModalDetails`.
    *   Use `attendeeId` as the key when setting the flag in `emailConflictFlags`. Store `actualConflictingAttendeeId` in the flag data (e.g., `{ conflictingAttendeeId: actualConflictingAttendeeId }`). 