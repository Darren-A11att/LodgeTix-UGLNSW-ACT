**Title:** Refactor Context Toggle Functions for ID Lookup

**Description:** Modify `toggleSameLodge`, `toggleHasLadyPartner`, `toggleGuestUseContact`, `toggleGuestHasPartner` to find attendees by ID.

**Instructions:**

1.  Open `src/context/RegisterFormContext.tsx`.
2.  Modify `toggleSameLodge(id: string, checked: boolean)`:
    *   Ensure signature accepts `id: string`.
    *   Inside `setFormState`, find the mason to update using `map` and `mason.id === id`.
3.  Modify `toggleHasLadyPartner(masonId: string, checked: boolean)`:
    *   Rename parameter from `index` to `masonId`. Ensure signature accepts `masonId: string`.
    *   Inside `setFormState`:
        *   Find the target mason: `const mason = prev.masons.find(m => m.id === masonId);`. Return `prev` if mason not found.
        *   Update the `updatedMasons` array using `map` and `m.id === masonId`.
        *   When adding a partner (`if (checked)`): Set `newPartner.masonId = masonId`. Remove the old `findIndex` check based on `masonIndex`. Check if a partner exists using `prev.ladyPartners.some(lp => lp.masonId === masonId)`. Only add if one doesn't exist.
        *   When removing a partner (`else`): Filter `updatedLadyPartners` using `filter(lp => lp.masonId !== masonId)`.
4.  Modify `toggleGuestUseContact(id: string, checked: boolean)`:
    *   Ensure signature accepts `id: string`.
    *   Inside `setFormState`, find the guest to update using `map` and `guest.id === id`.
5.  Modify `toggleGuestHasPartner(guestId: string, checked: boolean)`:
    *   Rename parameter from `index` to `guestId`. Ensure signature accepts `guestId: string`.
    *   Inside `setFormState`:
        *   Find the target guest: `const guest = prev.guests.find(g => g.id === guestId);`. Return `prev` if guest not found.
        *   Update the `updatedGuests` array using `map` and `g.id === guestId`.
        *   When adding a partner (`if (checked)`): Set `newPartner.guestId = guestId`. Remove the old `findIndex` check based on `guestIndex`. Check if a partner exists using `prev.guestPartners.some(gp => gp.guestId === guestId)`. Only add if one doesn't exist.
        *   When removing a partner (`else`): Filter `updatedGuestPartners` using `filter(gp => gp.guestId !== guestId)`. 