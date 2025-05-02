**Title:** Refactor Context Update Functions (update*Field) for ID Lookup

**Description:** Modify the `updateMasonField`, `updateGuestField`, `updateLadyPartnerField`, `updateGuestPartnerField` functions in the context to find the attendee/partner by ID instead of index before updating their state.

**Instructions:**

1.  Open `src/context/RegisterFormContext.tsx`.
2.  Modify `updateMasonField(id: string, field: string, value: string | boolean)`:
    *   Inside `setFormState`, replace `const updatedMasons = [...prev.masons]; updatedMasons[index] = { ...updatedMasons[index], [field]: value };` with logic that finds the mason by `id` and updates them:
        ```typescript
        const updatedMasons = prev.masons.map(mason =>
          mason.id === id ? { ...mason, [field]: value } : mason
        );
        ```
    *   Ensure the function signature accepts `id: string`.
3.  Modify `updateGuestField(id: string, field: string, value: string | boolean)`:
    *   Apply the same pattern as above, using `prev.guests.map` and finding by `guest.id === id`.
    *   Ensure the function signature accepts `id: string`.
4.  Modify `updateLadyPartnerField(id: string, field: string, value: string | boolean)`:
    *   Apply the same pattern as above, using `prev.ladyPartners.map` and finding by `partner.id === id`.
    *   Ensure the function signature accepts `id: string`.
5.  Modify `updateGuestPartnerField(id: string, field: string, value: string | boolean)`:
    *   Apply the same pattern as above, using `prev.guestPartners.map` and finding by `partner.id === id`.
    *   Ensure the function signature accepts `id: string`. 