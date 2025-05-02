**Title:** Refactor Email Conflict Modal for ID-Based Details

**Description:** Update the `EmailConflictModal` component to use the revised `EmailConflictModalDetails` structure which relies on IDs.

**Instructions:**

1.  Open `src/pages/RegisterPage.tsx`.
2.  Locate the `EmailConflictModal` functional component.
3.  Update the destructuring from `emailConflictModalDetails` to extract the ID-based fields defined in Task 02 (`attendeeId`, `attendeeType`, `sourceConflictingAttendeeId`, `actualConflictingAttendeeId`, `canChangePreference`, `newPreference`, `attemptedEmail`).
4.  Modify the logic that constructs the `targetAttendeeDesc`:
    *   It needs the `attendeeId` and `attendeeType` from the destructured details.
    *   Fetch the actual attendee data from the context `formState` using the `attendeeId` and `attendeeType` to get their name or related Mason/Guest name for a more descriptive string like "Caitlin Ellis" or "Partner of John Doe".
    *   Example lookup:
        ```typescript
        const { formState } = useRegisterForm(); // Get formState
        let targetAttendeeName = 'this attendee';
        if (attendeeType === 'ladyPartner') {
            const partner = formState.ladyPartners.find(p => p.id === attendeeId);
            const mason = formState.masons.find(m => m.id === partner?.masonId);
            targetAttendeeName = `${partner?.firstName || 'Partner'} (of ${mason?.firstName || 'Mason'})`;
        } // Add similar lookups for other types
        ```
5.  Update the message construction (`line1`, `line2`):
    *   Fetch the name for `actualConflictingAttendeeId` from `formState` similarly to step 4 to use in `line1`.
    *   Use the `targetAttendeeName` constructed in step 4 for `line2`.
6.  Ensure the conditional rendering of buttons based on `canChangePreference` is correct. 