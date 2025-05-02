**Title:** Refactor Context Remove Functions for ID Lookup and Stable Relationships

**Description:** Modify `removeMasonByIndex` and `removeGuestByIndex` to use IDs for removal and eliminate the need to shift partner relationship indices.

**Instructions:**

1.  Open `src/context/RegisterFormContext.tsx`.
2.  Rename `removeMasonByIndex` to `removeMasonById` and update its signature to accept `id: string`.
    *   Inside `setFormState`:
        *   Find the `masonToRemove` using `prev.masons.find(m => m.id === id)`. Return `prev` if not found or if `id` corresponds to the primary mason (index 0 - check `prev.masons[0].id === id`).
        *   Filter the mason out: `const updatedMasons = prev.masons.filter(m => m.id !== id);`.
        *   Filter out associated partners using `masonId`: `let updatedLadyPartners = prev.ladyPartners.filter(lp => lp.masonId !== id);`.
        *   **Remove entirely** the logic that mapped over `updatedLadyPartners` to decrement `masonIndex`. This is no longer needed with stable IDs.
        *   Filter the `attendeeAddOrder` based on the `id`.
        *   Return the new state: `{ ...prev, masons: updatedMasons, ladyPartners: updatedLadyPartners, attendeeAddOrder: updatedOrder };`.
3.  Rename `removeGuestByIndex` to `removeGuestById` and update its signature to accept `id: string`.
    *   Inside `setFormState`:
        *   Find the `guestToRemove` using `prev.guests.find(g => g.id === id)`. Return `prev` if not found.
        *   Filter the guest out: `const updatedGuests = prev.guests.filter(g => g.id !== id);`.
        *   Filter out associated partners using `guestId`: `let updatedGuestPartners = prev.guestPartners.filter(gp => gp.guestId !== id);`.
        *   **Remove entirely** the logic that mapped over `updatedGuestPartners` to decrement `guestIndex`.
        *   Filter the `attendeeAddOrder` based on the `id`.
        *   Return the new state: `{ ...prev, guests: updatedGuests, guestPartners: updatedGuestPartners, attendeeAddOrder: updatedOrder };`.
4.  Update the `RegisterFormContextType` interface with the new function names (`removeMasonById`, `removeGuestById`). 