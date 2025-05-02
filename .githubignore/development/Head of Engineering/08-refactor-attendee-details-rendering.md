**Title:** Refactor AttendeeDetails Component for ID-Based Rendering Order

**Description:** Modify the `AttendeeDetails` component to render attendees based on the `attendeeAddOrder` array and ID lookups, ensuring partners appear immediately after their Mason/Guest.

**Instructions:**

1.  Open `src/components/register/AttendeeDetails.tsx`.
2.  Import necessary types (`MasonData`, `GuestData`, `LadyPartnerData`, `GuestPartnerData`, `AttendeeType`) and the context hook (`useRegisterForm`).
3.  Get `formState` from `useRegisterForm()`.
4.  Remove the existing rendering logic that likely maps over separate `masons` and `guests` arrays using indices.
5.  Implement new rendering logic within the component's return statement:
    ```jsx
    {formState.attendeeAddOrder.map(orderItem => {
      if (orderItem.type === 'mason') {
        const mason = formState.masons.find(m => m.id === orderItem.id);
        if (!mason) return null; // Should not happen if state is consistent
        const partner = formState.ladyPartners.find(lp => lp.masonId === mason.id);
        return (
          <React.Fragment key={mason.id}>
            <MasonContactInfo 
              id={mason.id} 
              mason={mason} 
              isPrimary={formState.masons[0].id === mason.id} // Determine if primary
              // Pass other needed props like primaryMasonData if required
            />
            {partner && (
              <LadyPartnerForm 
                key={partner.id} 
                id={partner.id} 
                ladyPartner={partner} 
                masonData={mason} 
                // Pass primaryMasonData if needed
                // Pass onRemove handler (likely needs refactoring to use ID)
              />
            )}
          </React.Fragment>
        );
      } else if (orderItem.type === 'guest') {
        const guest = formState.guests.find(g => g.id === orderItem.id);
        if (!guest) return null;
        const partner = formState.guestPartners.find(gp => gp.guestId === guest.id);
        return (
          <React.Fragment key={guest.id}>
            <GuestContactInfo 
              id={guest.id} 
              guest={guest} 
              // Pass index if needed only for display numbering (Guest 1, Guest 2)
              // index={formState.guests.findIndex(g => g.id === guest.id)} 
            />
            {partner && (
              <GuestPartnerForm 
                key={partner.id} 
                id={partner.id} 
                partner={partner} 
                guestData={guest}
                guestIndex={formState.guests.findIndex(g => g.id === guest.id)} // Needed for partner confirmation message
                // Pass onRemove handler
              />
            )}
          </React.Fragment>
        );
      }
      return null;
    })}
    ```
6.  Ensure all rendered components receive the `id` prop and any other necessary data props (like `masonData`, `guestData`, `primaryMasonData`). Pay attention to props needed for display text (like `guestIndex`).
7.  Refactor how `onRemove` handlers are passed and implemented in child components to use IDs (Task 09 will detail the child component changes). 