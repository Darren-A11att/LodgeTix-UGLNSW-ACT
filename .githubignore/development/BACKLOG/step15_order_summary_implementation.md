# Step 15: Order Summary Implementation

## Context for the Agentic AI Software Engineer

The LodgeTix system requires a comprehensive order summary system that shows attendees a detailed breakdown of their selected tickets, prices, and total cost before proceeding to payment. Currently, the system has a basic `OrderSummarySection.tsx` component that displays ticket information but uses hardcoded prices and relies on mock data from `events.js` rather than real database data.

Analysis of the codebase reveals the following:

1. The existing `OrderSummarySection.tsx` component has an advanced structure for displaying attendee information, but needs integration with real ticket and event data.
2. The component uses helper utilities (`ticketUtils` and `attendeeUtils`) that need to be updated to use actual database data.
3. The order summary includes an attendee header with personal information, a detailed event table showing selected packages or individual events, and price calculations.
4. The current implementation handles multiple attendee types (masons, lady partners, guests, and guest partners) with different display requirements.
5. There's also an edit functionality that allows users to modify attendee details directly from the summary page.

This step builds upon the previous ticket selection implementation and requires integration with the ticket data from Supabase. The order summary must accurately reflect the attendee choices, packages, and pricing.

## Objective

Create a comprehensive order review system that:

1. Accurately calculates and displays total costs based on selected tickets
2. Shows a detailed breakdown of events included in each ticket package
3. Displays individual attendee information with correct ticket assignments
4. Supports editing attendee information from the summary screen
5. Provides a clear grand total before proceeding to payment
6. Includes handling of discounts and special pricing where applicable

## Pre-requisites

- Completed Step 14: Ticket Selection and Management
- Access to ticket definitions and pricing from Supabase
- Understanding of the existing order summary components and structure
- Knowledge of the overall registration flow and state management

## Analysis Steps

1. Review the existing `OrderSummarySection.tsx` component:
   - `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/components/register/OrderSummarySection.tsx`

2. Examine related components and utilities:
   - `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/components/register/AttendeeEditModal.tsx`
   - Helper utilities: `ticketUtils` and `attendeeUtils`

3. Understand the state management for tickets:
   - `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/context/RegistrationContext.tsx`

4. Review the ticket definitions table to understand pricing structure:
   - `SELECT * FROM ticket_definitions LIMIT 5`

5. Understand package-event relationships:
   - `SELECT * FROM package_events LIMIT 5`

## Implementation Steps

1. Update the `ticketUtils` in `OrderSummarySection.tsx` to use ticket data from Supabase:

   ```typescript
   const ticketUtils = {
     // Update to use ticket data from API instead of hardcoded values
     getTicketName: (ticketId: string | undefined, tickets: TicketType[]): string => {
       if (!ticketId) return "";
       const ticket = tickets.find(t => t.id === ticketId);
       return ticket ? ticket.name : "";
     },

     // Update to get prices from the tickets array
     getTicketPrice: (ticketId: string | undefined, tickets: TicketType[]): number => {
       if (!ticketId) return 0;
       const ticket = tickets.find(t => t.id === ticketId);
       return ticket ? ticket.price : 0;
     },

     // Update to get event details from the API
     getEventById: (eventId: string, events: EventType[]): EventType | undefined => {
       return events.find(e => e.id === eventId);
     },

     // Update to use package_events data from database
     isEventIncludedInPackage: (eventId: string, packageId: string, packageEvents: PackageEventType[]): boolean => {
       return packageEvents.some(pe => pe.package_id === packageId && pe.event_id === eventId);
     },

     // Update to calculate attendee total using actual ticket data
     calculateAttendeeTotal: (
       ticketId: string | undefined,
       attendee: AttendeeData,
       tickets: TicketType[],
       events: EventType[]
     ): number => {
       // Implementation using actual data
     }
   };
   ```

2. Create a new API function in `/src/lib/api/packages.ts` to fetch package event associations:

   ```typescript
   // Function to fetch all package-event associations
   export async function fetchPackageEvents(): Promise<PackageEventType[]> {
     try {
       const { data, error } = await supabase
         .from('package_events')
         .select('*');
       
       if (error) {
         console.error('Error fetching package events:', error);
         return [];
       }
       
       return data || [];
     } catch (err) {
       console.error('Unexpected error fetching package events:', err);
       return [];
     }
   }
   ```

3. Update the `OrderSummarySection.tsx` component to fetch and use real data:

   ```typescript
   // New state variables for ticket and event data
   const [tickets, setTickets] = useState<TicketType[]>([]);
   const [eventsList, setEventsList] = useState<EventType[]>([]);
   const [packageEvents, setPackageEvents] = useState<PackageEventType[]>([]);
   const [isLoading, setIsLoading] = useState<boolean>(true);
   const [error, setError] = useState<string | null>(null);

   // Add useEffect to fetch data when component mounts
   useEffect(() => {
     const fetchData = async () => {
       setIsLoading(true);
       try {
         // Fetch tickets, events, and package relationships
         const [ticketsData, eventsData, packageEventsData] = await Promise.all([
           fetchTicketsForEvent(selectedEventId), // From Step 14
           getEvents('authenticated'),            // Reuse existing function
           fetchPackageEvents()                   // New function
         ]);
         
         setTickets(ticketsData);
         setEventsList(eventsData);
         setPackageEvents(packageEventsData);
         setError(null);
       } catch (err) {
         setError('Failed to load order data');
         console.error('Error loading order summary data:', err);
       } finally {
         setIsLoading(false);
       }
     };
     
     fetchData();
   }, [selectedEventId]);
   ```

4. Update the `PackageEventsTable` component to use real package event data:

   ```typescript
   // Update to use real package data
   const PackageEventsTable: React.FC<PackageEventsTableProps> = ({
     ticketId,
     ticketName,
     packageEvents,
     eventsList
   }) => {
     // Filter events included in this package
     const eventsInPackage = eventsList.filter(event => 
       packageEvents.some(pe => pe.package_id === ticketId && pe.event_id === event.id)
     );
     
     return (
       <>
         <tr>
           <td colSpan={5} className="p-4 font-medium text-slate-800 border-b border-slate-200">
             {ticketName} Package
           </td>
         </tr>

         {eventsInPackage.map(event => (
           <EventItemRow key={event.id} event={event} isIncluded={true} />
         ))}
       </>
     );
   };
   ```

5. Update the main component to handle loading states and errors:

   ```typescript
   return (
     <div>
       <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>

       {isLoading ? (
         <div className="flex justify-center py-8">
           <div className="spinner"></div> {/* Add a loading spinner component */}
         </div>
       ) : error ? (
         <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
           <h3 className="text-red-800 font-medium">Error Loading Order</h3>
           <p className="text-red-700">{error}</p>
           <button 
             onClick={() => /* Reload data function */} 
             className="mt-2 text-red-800 underline"
           >
             Try Again
           </button>
         </div>
       ) : (
         /* Existing order summary content */
       )}
     </div>
   );
   ```

6. Implement discount handling (if applicable):

   ```typescript
   // Add to ticketUtils
   applyDiscount: (price: number, discountType: string, discountValue: number): number => {
     if (discountType === 'percentage') {
       return price * (1 - (discountValue / 100));
     } else if (discountType === 'fixed') {
       return Math.max(0, price - discountValue);
     }
     return price;
   }
   ```

7. Update the `calculateTotalPrice` function to use real ticket data:

   ```typescript
   const calculateTotalPrice = (): number => {
     const orderedEntries = generateOrderedAttendeeEntries();
     let total = 0;

     for (const entry of orderedEntries) {
       // Use updated ticketUtils with actual ticket data
       const ticketPrice = ticketUtils.getTicketPrice(entry.ticketId, tickets);
       
       if (entry.ticketId) {
         total += ticketPrice;
       } else if (
         entry.attendee.ticket?.events &&
         entry.attendee.ticket.events.length > 0
       ) {
         // Sum prices of individual events using actual event data
         let eventTotal = 0;
         for (const eventId of entry.attendee.ticket.events) {
           const event = eventsList.find(e => e.id === eventId);
           if (event?.price) {
             eventTotal += event.price;
           }
         }
         total += eventTotal;
       }
     }

     // Apply any global discounts here if needed
     
     return total;
   };
   ```

## Testing Steps

1. Test data loading and display:
   - Verify that ticket, event, and package data are fetched correctly
   - Check that loading states are shown appropriately
   - Ensure error handling works when API calls fail

2. Test price calculations:
   - Verify that individual attendee totals are calculated correctly
   - Check that the grand total is accurate
   - Test with different combinations of package and individual event tickets

3. Test package event display:
   - Ensure events included in packages are displayed correctly
   - Verify that "Included" is shown for events in packages
   - Check that individual event prices are shown correctly

4. Test attendee editing:
   - Verify that the edit modal opens correctly
   - Test updating attendee information and confirm changes reflect in the summary
   - Check that canceling edits doesn't affect the displayed data

5. End-to-end testing:
   - Complete attendee details and ticket selection steps
   - Check that order summary displays all selected options accurately
   - Verify navigation to payment works correctly

## Verification Checklist

- [ ] Order summary correctly loads and displays real ticket and event data
- [ ] Package events are displayed correctly with "Included" markers
- [ ] Individual event prices are displayed accurately
- [ ] Attendee totals are calculated correctly
- [ ] Grand total is accurate and updates when selections change
- [ ] Loading states are displayed during data fetching
- [ ] Error handling is implemented for failed API calls
- [ ] Attendee edit functionality works correctly
- [ ] Responsive design works on mobile devices
- [ ] Navigation between steps works correctly

## Common Errors and Solutions

1. Missing or incorrect ticket prices
   - Check that the ticket data is being fetched correctly from Supabase
   - Verify the price field is being parsed as a number, not a string
   - Ensure fallback behavior when ticket data is not available

2. Package events not displaying
   - Verify that package-event associations are being fetched correctly
   - Check that the event filtering logic is working as expected
   - Ensure package IDs and event IDs are being compared correctly

3. Total price calculation issues
   - Implement detailed logging of each price calculation step
   - Verify that individual and package prices are being summed correctly
   - Check for any currency formatting issues (e.g., ensure calculations use numbers, not formatted strings)

4. Slow loading performance
   - Implement parallel data fetching using Promise.all
   - Consider caching ticket and package data in context
   - Add appropriate loading indicators for better user experience

5. Edit modal not updating summary
   - Verify that edited data is being saved to context
   - Check that the summary component re-renders when relevant data changes
   - Ensure proper cleanup of event listeners and subscriptions
