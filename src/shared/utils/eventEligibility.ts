import { EventType } from '../types/event';
import { parseISO, compareAsc } from 'date-fns';

// Define AttendeeType type alias for code clarity
type AttendeeType = 'mason' | 'ladyPartner' | 'guest' | 'guestPartner';

// Define type for attribute values
type AttributeValue = string | boolean | number | null;

// Defines eligibility criteria for attendees based on their type and attributes
export interface EligibilityRules {
  attendeeType: AttendeeType;
  requiredAttributes?: {
    [key: string]: AttributeValue; // Can specify required values for any attribute
  };
  excludedAttributes?: {
    [key: string]: AttributeValue; // Can specify values that make an attendee ineligible
  };
}

// Interface for attendee data
export interface AttendeeData {
  [key: string]: unknown;
  grandOfficer?: string;
  // Add other common properties here as needed
}

// Map of event IDs to their eligibility rules
const eventEligibilityMap: Record<string, EligibilityRules[]> = {
  // Grand Officers Preparation Meeting - only for Masons with Current Grand Office
  'grand-officers-meeting': [
    {
      attendeeType: 'mason',
      requiredAttributes: {
        grandOfficer: 'Current'
      }
    }
  ],
  
  // Partners' Harbour Cruise - only for Lady & Partners and Guest Partners
  'ladies-program': [
    {
      attendeeType: 'ladyPartner'
    },
    {
      attendeeType: 'guestPartner'
    }
  ],
  
  // Proclamation Ceremony - excluded for Lady & Partners and Guest Partners
  'grand-Proclamation-ceremony': [
    {
      attendeeType: 'mason'
    },
    {
      attendeeType: 'guest'
    }
  ],
  
  // All other events have no restrictions - everyone can attend
};

// Check if an attendee is eligible for an event
export const isEligibleForEvent = (
  eventId: string, 
  attendeeType: AttendeeType,
  attendeeData: AttendeeData
): boolean => {
  // If no specific eligibility rules exist, everyone is eligible
  if (!eventEligibilityMap[eventId]) {
    return true;
  }

  // Check if any eligibility rule matches this attendee
  const isEligible = eventEligibilityMap[eventId].some(rule => {
    // First check if attendee type matches
    if (rule.attendeeType !== attendeeType) {
      return false;
    }
    
    // Check required attributes if specified
    if (rule.requiredAttributes) {
      for (const [key, value] of Object.entries(rule.requiredAttributes)) {
        if (attendeeData[key] !== value) {
          return false;
        }
      }
    }
    
    // Check excluded attributes if specified
    if (rule.excludedAttributes) {
      for (const [key, value] of Object.entries(rule.excludedAttributes)) {
        if (attendeeData[key] === value) {
          return false;
        }
      }
    }
    
    // If all checks passed, the attendee is eligible
    return true;
  });
  
  return isEligible;
};

// Get eligible events for an attendee
export const getEligibleEvents = (
  events: EventType[],
  attendeeType: AttendeeType,
  attendeeData: AttendeeData
): EventType[] => {
  return events.filter(event => 
    isEligibleForEvent(event.id, attendeeType, attendeeData)
  );
};

// Sort events by date and time
export const sortEventsByDate = (events: EventType[]): EventType[] => {
  return [...events].sort((a, b) => {
    // First compare by date
    const dateComparison = compareAsc(parseISO(a.date), parseISO(b.date));
    
    // If same date, compare by time
    if (dateComparison === 0) {
      // Extract start hours for comparison
      const aTimeStart = a.time.split(' - ')[0];
      const bTimeStart = b.time.split(' - ')[0];
      
      // Simple string comparison works for HH:MM format
      return aTimeStart.localeCompare(bTimeStart);
    }
    
    return dateComparison;
  });
};