**Title:** Review and Refactor Ticket Selection Logic for IDs

**Description:** Review context functions related to ticket selection (`selectTicket`, `select*Ticket`, `applyTicketToAllAttendees`) and update them to use attendee IDs if they currently rely on indices.

**Instructions:**

1.  Open `src/context/RegisterFormContext.tsx`.
2.  Review `selectMasonTicket`, `selectLadyPartnerTicket`, `selectGuestTicket`, `selectGuestPartnerTicket`.
    *   Ensure their signatures accept `attendeeId: string` instead of `masonIndex`, `partnerIndex`, `guestIndex`.
    *   Update internal logic to find the correct attendee/partner using `map` and comparing `attendee.id === attendeeId` or `partner.id === attendeeId`.
3.  Review `applyTicketToAllAttendees`.
    *   This function iterates over all attendees. Ensure it correctly copies the `id` and other necessary fields while updating the ticket info. No index lookup is needed here. Check that the `map` functions iterate correctly over `prev.masons`, `prev.ladyPartners`, etc.
4.  Review `selectTicket`.
    *   If `useUniformTicketing` is true, it calls `applyTicketToAllAttendees`, which should be fine after the previous step. Ensure no other index-based logic exists here.
5.  Update the `RegisterFormContextType` interface with the modified function signatures (using `attendeeId`). 