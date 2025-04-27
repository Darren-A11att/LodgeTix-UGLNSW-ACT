# Step 17: Confirmation and Receipts

## Context for the Agentic AI Software Engineer

The LodgeTix system requires a comprehensive confirmation and receipt system that provides users with confirmation of their registration, digital receipts, and the option to save or print their registration details. Currently, the system has a basic `ConfirmationSection.tsx` component that displays some registration details but lacks integration with actual payment data, proper PDF receipt generation, and confirmation email functionality.

Analysis of the codebase reveals:

1. The existing `ConfirmationSection.tsx` component renders a confirmation screen with ticket information and a print-friendly version, but uses hardcoded values.
2. The confirmation component already has a structure for displaying attendee information and ticket details.
3. The component includes a print function but lacks proper PDF generation.
4. The UI mentions sending a confirmation email, but this functionality is not implemented.
5. There's no integration with Supabase to fetch the actual registration and payment data.

For a complete confirmation and receipt system, we need to integrate with the registration and payment data, generate proper PDF receipts, and implement email confirmations via Supabase Edge Functions.

## Objective

Implement a comprehensive confirmation and receipt system that:

1. Generates confirmation screens with accurate registration information
2. Creates professionally formatted PDF receipts/tickets
3. Sends confirmation emails with registration details
4. Provides an option to print or save registration details
5. Shows clear next steps for the registration process

## Pre-requisites

- Completed Step 16: Payment Integration
- Access to registration and payment data in Supabase
- Understanding of PDF generation in the browser
- Knowledge of Supabase Edge Functions for email sending

## Analysis Steps

1. Review the current confirmation component:
   - `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/components/register/ConfirmationSection.tsx`

2. Understand the registration data structure:
   - `SELECT * FROM registrations LIMIT 5` to see what data is available

3. Review the existing print functionality:
   - Examine the `handlePrint` function and print-friendly section

4. Understand the desired confirmation email content:
   - Look at the UI text to determine what should be included in emails

5. Examine the existing order number generation:
   - Currently uses a random number, should be replaced with actual registration ID

## Implementation Steps

1. Create a helper function to fetch registration details by ID in `/src/lib/api/registrations.ts`:

   ```typescript
   import { supabase } from '../supabase';

   /**
    * Fetches detailed registration information by ID
    * @param registrationId - The UUID of the registration
    * @returns Detailed registration data with related records
    */
   export async function fetchRegistrationDetails(registrationId: string) {
     try {
       // Fetch the basic registration record
       const { data: registration, error: registrationError } = await supabase
         .from('registrations')
         .select(`
           id,
           registration_type,
           total_price_paid,
           payment_status,
           agree_to_terms,
           stripe_payment_intent_id,
           created_at,
           parent_event_id,
           customer_id
         `)
         .eq('id', registrationId)
         .single();
       
       if (registrationError) {
         console.error('Error fetching registration:', registrationError);
         return null;
       }
       
       // Fetch related attendee ticket assignments
       const { data: ticketAssignments, error: ticketsError } = await supabase
         .from('attendee_ticket_assignments')
         .select(`
           id,
           attendee_link_id,
           ticket_definition_id,
           price_at_assignment,
           ticket_definitions(id, name, description, price)
         `)
         .eq('registration_id', registrationId);
       
       if (ticketsError) {
         console.error('Error fetching ticket assignments:', ticketsError);
       }
       
       // Fetch related attendee links
       const { data: attendeeLinks, error: attendeeLinksError } = await supabase
         .from('attendee_links')
         .select(`
           id,
           registration_id,
           mason_id,
           guest_id,
           masons(id, title, first_name, last_name, phone, email, rank, lodge_id, dietary_requirements, special_needs, lodges(name, number)),
           guests(id, title, first_name, last_name, phone, email, dietary_requirements, special_needs)
         `)
         .eq('registration_id', registrationId);
       
       if (attendeeLinksError) {
         console.error('Error fetching attendee links:', attendeeLinksError);
       }
       
       // Return combined data
       return {
         registration,
         ticketAssignments: ticketAssignments || [],
         attendeeLinks: attendeeLinks || []
       };
     } catch (err) {
       console.error('Unexpected error fetching registration details:', err);
       return null;
     }
   }
   ```

2. Create a PDF receipt generator function in `/src/lib/pdfGenerator.ts`:

   ```typescript
   import { jsPDF } from 'jspdf';
   import 'jspdf-autotable';

   /**
    * Generates a PDF receipt for a registration
    * @param registrationData - The registration data
    * @returns Blob of the generated PDF
    */
   export function generateReceiptPDF(registrationData: any) {
     // Create new PDF document
     const doc = new jsPDF();
     
     // Add header
     doc.setFontSize(22);
     doc.text('Grand Proclamation 2025', 105, 20, { align: 'center' });
     doc.setFontSize(16);
     doc.text('Registration Receipt', 105, 30, { align: 'center' });
     
     // Add registration details
     doc.setFontSize(12);
     doc.text(`Registration ID: ${registrationData.registration.id}`, 20, 45);
     doc.text(`Date: ${new Date(registrationData.registration.created_at).toLocaleDateString()}`, 20, 52);
     doc.text(`Status: ${registrationData.registration.payment_status}`, 20, 59);
     
     // Add customer information
     const primaryAttendee = registrationData.attendeeLinks[0]?.masons || registrationData.attendeeLinks[0]?.guests;
     if (primaryAttendee) {
       doc.text('Primary Contact:', 20, 70);
       doc.text(`Name: ${primaryAttendee.title} ${primaryAttendee.first_name} ${primaryAttendee.last_name}`, 30, 77);
       doc.text(`Email: ${primaryAttendee.email}`, 30, 84);
       doc.text(`Phone: ${primaryAttendee.phone}`, 30, 91);
     }
     
     // Add attendee table
     doc.text('Attendees:', 20, 105);
     
     // Format attendee data for table
     const attendeeRows = registrationData.attendeeLinks.map((link: any) => {
       const attendee = link.masons || link.guests;
       const ticket = registrationData.ticketAssignments.find(
         (t: any) => t.attendee_link_id === link.id
       );
       
       return [
         `${attendee.title} ${attendee.first_name} ${attendee.last_name}`,
         link.masons ? 'Mason' : 'Guest',
         ticket?.ticket_definitions?.name || 'No ticket',
         `$${ticket?.price_at_assignment?.toFixed(2) || '0.00'}`
       ];
     });
     
     // Draw attendee table
     (doc as any).autoTable({
       startY: 110,
       head: [['Name', 'Type', 'Ticket', 'Price']],
       body: attendeeRows,
     });
     
     // Add payment summary
     const finalY = (doc as any).lastAutoTable.finalY + 15;
     doc.text('Payment Summary:', 20, finalY);
     doc.text(`Total Paid: $${registrationData.registration.total_price_paid?.toFixed(2) || '0.00'}`, 30, finalY + 7);
     doc.text(`Payment Method: Credit Card`, 30, finalY + 14);
     doc.text(`Transaction ID: ${registrationData.registration.stripe_payment_intent_id || 'N/A'}`, 30, finalY + 21);
     
     // Add footer
     doc.setFontSize(10);
     const pageHeight = doc.internal.pageSize.height;
     doc.text('United Grand Lodge of NSW & ACT', 105, pageHeight - 30, { align: 'center' });
     doc.text('Sydney Masonic Centre, 66 Goulburn St, Sydney NSW 2000', 105, pageHeight - 25, { align: 'center' });
     doc.text('+61 2 9862 0400 | info@grandProclamation.org.au', 105, pageHeight - 20, { align: 'center' });
     
     // Return the PDF as a blob
     return doc.output('blob');
   }
   ```

3. Create a Supabase Edge Function for sending confirmation emails in `/supabase/functions/send-confirmation-email/index.ts`:

   ```typescript
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
   import { corsHeaders } from '../_shared/cors.ts'
   import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

   // Create a Supabase client
   const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
   const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
   const supabase = createClient(supabaseUrl, supabaseServiceKey)

   serve(async (req) => {
     // Handle CORS preflight requests
     if (req.method === 'OPTIONS') {
       return new Response('ok', { headers: corsHeaders })
     }

     try {
       const { registrationId } = await req.json()
       
       if (!registrationId) {
         return new Response(
           JSON.stringify({ error: 'Registration ID is required' }),
           {
             status: 400,
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           }
         )
       }
       
       // Fetch registration details
       const { data: registration, error: registrationError } = await supabase
         .from('registrations')
         .select(`
           id,
           registration_type,
           total_price_paid,
           payment_status,
           stripe_payment_intent_id,
           created_at,
           parent_event_id,
           customer_id
         `)
         .eq('id', registrationId)
         .single()
       
       if (registrationError || !registration) {
         return new Response(
           JSON.stringify({ error: 'Registration not found' }),
           {
             status: 404,
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           }
         )
       }
       
       // Fetch customer details
       const { data: customer, error: customerError } = await supabase
         .from('customers')
         .select('email, first_name, last_name')
         .eq('id', registration.customer_id)
         .single()
       
       if (customerError || !customer) {
         return new Response(
           JSON.stringify({ error: 'Customer not found' }),
           {
             status: 404,
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           }
         )
       }
       
       // Initialize SMTP client (using environment variables)
       const smtpClient = new SmtpClient({
         connection: {
           hostname: Deno.env.get('SMTP_HOST') ?? '',
           port: parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
           auth: {
             username: Deno.env.get('SMTP_USERNAME') ?? '',
             password: Deno.env.get('SMTP_PASSWORD') ?? '',
           },
           tls: true,
         },
       });
       
       // Prepare email content
       const emailContent = `
         <html>
           <body>
             <h1>Grand Proclamation 2025 Registration Confirmation</h1>
             <p>Dear ${customer.first_name},</p>
             <p>Thank you for registering for the Grand Proclamation 2025. Your registration has been confirmed.</p>
             <div style="border: 1px solid #ccc; padding: 15px; margin: 15px 0;">
               <h2>Registration Details</h2>
               <p><strong>Registration ID:</strong> ${registration.id}</p>
               <p><strong>Registration Date:</strong> ${new Date(registration.created_at).toLocaleDateString()}</p>
               <p><strong>Payment Status:</strong> ${registration.payment_status}</p>
               <p><strong>Total Paid:</strong> $${registration.total_price_paid?.toFixed(2) || '0.00'}</p>
             </div>
             <p>You can view your full registration details and tickets by logging into your account.</p>
             <p>One month before the event, you'll receive your official invitation and event details.</p>
             <p>A week before the event, you'll receive a final reminder with check-in instructions.</p>
             <p>If you have any questions, please contact us at info@grandProclamation.org.au or call +61 2 9862 0400.</p>
             <p>Best regards,<br>Grand Proclamation 2025 Team</p>
           </body>
         </html>
       `;
       
       // Send the email
       await smtpClient.send({
         from: "Grand Proclamation <registration@grandProclamation.org.au>",
         to: customer.email,
         subject: "Your Grand Proclamation 2025 Registration Confirmation",
         content: emailContent,
         html: emailContent,
       });
       
       // Close the connection
       await smtpClient.close();
       
       return new Response(
         JSON.stringify({ success: true, message: 'Confirmation email sent' }),
         {
           status: 200,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         }
       )
     } catch (err) {
       return new Response(
         JSON.stringify({ error: `Error sending confirmation email: ${err.message}` }),
         { 
           status: 500,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         }
       )
     }
   })
   ```

4. Create a helper function to send confirmation emails in `/src/lib/api/confirmation.ts`:

   ```typescript
   import { supabase } from '../supabase';

   /**
    * Sends a confirmation email for a completed registration
    * @param registrationId - The UUID of the registration
    * @returns Success status and message
    */
   export async function sendConfirmationEmail(registrationId: string) {
     try {
       const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
         body: { registrationId }
       });
       
       if (error) {
         console.error('Error sending confirmation email:', error);
         return { success: false, message: error.message };
       }
       
       return { success: true, message: 'Confirmation email sent successfully' };
     } catch (err) {
       console.error('Unexpected error sending confirmation email:', err);
       return { success: false, message: 'Failed to send confirmation email' };
     }
   }

   /**
    * Generates a download link for a PDF receipt
    * @param registrationId - The UUID of the registration
    * @returns URL for downloading the receipt
    */
   export async function generateReceiptDownloadUrl(registrationId: string) {
     try {
       // This could be implemented as a Supabase Edge Function or 
       // by generating the PDF client-side and creating a blob URL
       // For now, we'll simulate with a static URL
       return `/api/receipt/${registrationId}`;
     } catch (err) {
       console.error('Error generating receipt download URL:', err);
       return null;
     }
   }
   ```

5. Update the `ConfirmationSection.tsx` component to use real data:

   ```typescript
   // Add these imports at the top
   import React, { useEffect, useRef, useState } from 'react';
   import { fetchRegistrationDetails } from '../../lib/api/registrations';
   import { sendConfirmationEmail } from '../../lib/api/confirmation';
   import { generateReceiptPDF } from '../../lib/pdfGenerator';
   import { saveAs } from 'file-saver'; // Need to add this package

   // Add state for registration data
   const [registrationData, setRegistrationData] = useState<any>(null);
   const [isLoading, setIsLoading] = useState<boolean>(true);
   const [emailSent, setEmailSent] = useState<boolean>(false);
   const [error, setError] = useState<string | null>(null);

   // Add useEffect to fetch registration data
   useEffect(() => {
     const fetchData = async () => {
       if (!formState.registrationId) {
         setError('Registration ID not found');
         setIsLoading(false);
         return;
       }
       
       try {
         const data = await fetchRegistrationDetails(formState.registrationId);
         if (!data) {
           setError('Failed to load registration details');
           setIsLoading(false);
           return;
         }
         
         setRegistrationData(data);
         
         // Send confirmation email automatically
         const emailResult = await sendConfirmationEmail(formState.registrationId);
         setEmailSent(emailResult.success);
       } catch (err) {
         console.error('Error loading confirmation data:', err);
         setError('An unexpected error occurred');
       } finally {
         setIsLoading(false);
       }
     };
     
     fetchData();
   }, [formState.registrationId]);
   
   // Add function to download PDF receipt
   const handleDownloadReceipt = async () => {
     if (!registrationData) return;
     
     try {
       const pdfBlob = generateReceiptPDF(registrationData);
       saveAs(pdfBlob, `grand-proclamation-receipt-${registrationData.registration.id}.pdf`);
     } catch (err) {
       console.error('Error generating PDF:', err);
       // Show error to user
     }
   };
   ```

6. Enhance the print functionality to use the PDF generator:

   ```typescript
   // Replace the current handlePrint function
   const handlePrint = () => {
     // For direct printing, we'll still use the window.print() approach
     // as it gives the user more control over printer settings
     setTimeout(() => {
       window.print();
     }, 100);
   };
   
   // Add a new button for downloading PDF receipt
   <button 
     type="button" 
     onClick={handleDownloadReceipt}
     className="btn-outline flex items-center mx-auto print:hidden ml-2"
   >
     <DownloadIcon className="h-4 w-4 mr-2" />
     Download Receipt PDF
   </button>
   ```

7. Update the UI to handle loading states and errors:

   ```typescript
   // Add to the render section
   return (
     <div className="text-center print:font-serif print:text-black print:bg-white">
       {isLoading ? (
         <div className="flex justify-center items-center py-12">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
         </div>
       ) : error ? (
         <div className="bg-red-50 p-6 rounded-lg mb-6 max-w-lg mx-auto">
           <h3 className="text-lg font-bold text-red-700 mb-2">Error Loading Registration</h3>
           <p className="text-red-600">{error}</p>
           <button 
             type="button"
             onClick={() => window.location.href = '/'}
             className="btn-primary mt-4"
           >
             Return to Homepage
           </button>
         </div>
       ) : (
         // Existing confirmation content, now using registrationData instead of formState
       )}
     </div>
   );
   ```

## Testing Steps

1. Test registration data loading:
   - Create test registrations with different statuses
   - Verify that the confirmation page loads registration data correctly
   - Check error handling for missing or invalid registration IDs

2. Test PDF receipt generation:
   - Generate receipts for various registration scenarios
   - Check that all required information appears in the PDF
   - Verify the download functionality works

3. Test email confirmation:
   - Ensure confirmation emails are sent correctly
   - Check email content for required information
   - Test error handling when email sending fails

4. Test print functionality:
   - Verify the print-friendly version displays correctly
   - Ensure all attendee information appears properly
   - Check that proper styling is applied to the printed version

5. Test responsiveness and accessibility:
   - Verify the confirmation page works on mobile devices
   - Check that print and download options are easily accessible
   - Ensure adequate contrast and readability

## Verification Checklist

- [ ] Registration data loads correctly from Supabase
- [ ] Confirmation page displays actual registration and payment details
- [ ] PDF receipt generation works and includes all required information
- [ ] Confirmation emails are sent successfully
- [ ] Print functionality produces well-formatted output
- [ ] Loading states and error handling work properly
- [ ] UI is responsive and accessible
- [ ] Next steps information is clear and accurate
- [ ] Download and print buttons are functional
- [ ] Registration ID is clearly displayed

## Common Errors and Solutions

1. Missing registration data
   - Check that the registration ID is being passed correctly
   - Verify database access permissions for the client
   - Log the full error when fetch requests fail

2. PDF generation errors
   - Check for required jsPDF libraries
   - Verify data structure being passed to the PDF generator
   - Handle edge cases where data might be missing

3. Email sending failures
   - Verify SMTP credentials in environment variables
   - Check for email format issues or invalid addresses
   - Implement a retry mechanism for failed email attempts

4. Print layout issues
   - Test with various browsers to ensure consistency
   - Use media queries to optimize for print (@media print {})
   - Provide fallback styling for older browsers

5. User navigation issues
   - Ensure clear back/home buttons on error screens
   - Provide feedback when actions (like downloading) are in progress
   - Implement a session timeout warning if applicable
