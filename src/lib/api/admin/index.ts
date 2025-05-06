// Export all admin services from this central file
import { AdminApiService } from './adminApiService';
import { EventAdminService } from './eventAdminService';
import { TicketAdminService } from './ticketAdminService';
import { RegistrationAdminService } from './registrationAdminService';
import { CustomerAdminService } from './customerAdminService';
import { PackageAdminService } from './packageAdminService';

// Create singleton instances for use throughout the app
export const adminApi = new AdminApiService();
export const eventAdmin = new EventAdminService();
export const ticketAdmin = new TicketAdminService();
export const registrationAdmin = new RegistrationAdminService();
export const customerAdmin = new CustomerAdminService();
export const packageAdmin = new PackageAdminService();

// Re-export types
export type { AdminApiResponse, QueryParams } from './adminApiService';
export type { 
  AdminEventDetails, 
  EventCapacityUpdate,
  EventCreateRequest 
} from './eventAdminService';
export type { 
  TicketDefinitionCreateRequest,
  PriceTierCreateRequest 
} from './ticketAdminService';
export type { 
  AdminRegistrationDetails,
  RegistrationStatusUpdateRequest 
} from './registrationAdminService';
export type { 
  AdminCustomerDetails,
  CustomerUpdateRequest 
} from './customerAdminService';
export type {
  AdminPackageDetails,
  PackageCreateRequest,
  PackageEventAddRequest
} from './packageAdminService';

// Export a central API access object for convenience
const adminAPI = {
  // Core API
  hasAdminPermission: adminApi.hasAdminPermission.bind(adminApi),
  
  // Events
  events: {
    getEvents: eventAdmin.getEvents.bind(eventAdmin),
    getEvent: eventAdmin.getEvent.bind(eventAdmin),
    createEvent: eventAdmin.createEvent.bind(eventAdmin),
    updateEvent: eventAdmin.updateEvent.bind(eventAdmin),
    deleteEvent: eventAdmin.deleteEvent.bind(eventAdmin),
    getEventCapacity: eventAdmin.getEventCapacity.bind(eventAdmin),
    updateEventCapacity: eventAdmin.updateEventCapacity.bind(eventAdmin),
    getEventTicketDefinitions: eventAdmin.getEventTicketDefinitions.bind(eventAdmin)
  },
  
  // Tickets
  tickets: {
    getTicketDefinitions: ticketAdmin.getTicketDefinitions.bind(ticketAdmin),
    getTicketDefinition: ticketAdmin.getTicketDefinition.bind(ticketAdmin),
    createTicketDefinition: ticketAdmin.createTicketDefinition.bind(ticketAdmin),
    updateTicketDefinition: ticketAdmin.updateTicketDefinition.bind(ticketAdmin),
    deleteTicketDefinition: ticketAdmin.deleteTicketDefinition.bind(ticketAdmin),
    getTicketPriceTiers: ticketAdmin.getTicketPriceTiers.bind(ticketAdmin),
    createPriceTier: ticketAdmin.createPriceTier.bind(ticketAdmin),
    updatePriceTier: ticketAdmin.updatePriceTier.bind(ticketAdmin),
    deletePriceTier: ticketAdmin.deletePriceTier.bind(ticketAdmin),
    getTicketAvailability: ticketAdmin.getTicketAvailability.bind(ticketAdmin)
  },
  
  // Registrations
  registrations: {
    getRegistrations: registrationAdmin.getRegistrations.bind(registrationAdmin),
    getRegistration: registrationAdmin.getRegistration.bind(registrationAdmin),
    updateRegistrationStatus: registrationAdmin.updateRegistrationStatus.bind(registrationAdmin),
    getRegistrationAttendees: registrationAdmin.getRegistrationAttendees.bind(registrationAdmin),
    getRegistrationTickets: registrationAdmin.getRegistrationTickets.bind(registrationAdmin),
    getRegistrationPayments: registrationAdmin.getRegistrationPayments.bind(registrationAdmin),
    cancelRegistration: registrationAdmin.cancelRegistration.bind(registrationAdmin),
    getRegistrationStats: registrationAdmin.getRegistrationStats.bind(registrationAdmin)
  },
  
  // Customers
  customers: {
    getCustomers: customerAdmin.getCustomers.bind(customerAdmin),
    getCustomer: customerAdmin.getCustomer.bind(customerAdmin),
    updateCustomer: customerAdmin.updateCustomer.bind(customerAdmin),
    getCustomerRegistrations: customerAdmin.getCustomerRegistrations.bind(customerAdmin),
    searchCustomers: customerAdmin.searchCustomers.bind(customerAdmin),
    getCustomerStats: customerAdmin.getCustomerStats.bind(customerAdmin)
  },
  
  // Packages
  packages: {
    getPackages: packageAdmin.getPackages.bind(packageAdmin),
    getPackage: packageAdmin.getPackage.bind(packageAdmin),
    createPackage: packageAdmin.createPackage.bind(packageAdmin),
    updatePackage: packageAdmin.updatePackage.bind(packageAdmin),
    deletePackage: packageAdmin.deletePackage.bind(packageAdmin),
    addEventToPackage: packageAdmin.addEventToPackage.bind(packageAdmin),
    removeEventFromPackage: packageAdmin.removeEventFromPackage.bind(packageAdmin),
    getPackageEvents: packageAdmin.getPackageEvents.bind(packageAdmin),
    updatePackageCapacity: packageAdmin.updatePackageCapacity.bind(packageAdmin),
    getPackageCapacity: packageAdmin.getPackageCapacity.bind(packageAdmin)
  }
};

export default adminAPI;