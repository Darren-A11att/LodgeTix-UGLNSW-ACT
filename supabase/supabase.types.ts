export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendee_ticket_assignments: {
        Row: {
          attendee_id: string | null
          created_at: string
          id: string
          price_at_assignment: number
          registration_id: string
          ticket_definition_id: string
        }
        Insert: {
          attendee_id?: string | null
          created_at?: string
          id?: string
          price_at_assignment: number
          registration_id: string
          ticket_definition_id: string
        }
        Update: {
          attendee_id?: string | null
          created_at?: string
          id?: string
          price_at_assignment?: number
          registration_id?: string
          ticket_definition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendee_ticket_assignments_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "Attendees"
            referencedColumns: ["attendeeid"]
          },
          {
            foreignKeyName: "attendee_ticket_assignments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_summary"
            referencedColumns: ["registrationId"]
          },
          {
            foreignKeyName: "attendee_ticket_assignments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "Registrations"
            referencedColumns: ["registrationId"]
          },
          {
            foreignKeyName: "attendee_ticket_assignments_ticket_definition_id_fkey"
            columns: ["ticket_definition_id"]
            isOneToOne: false
            referencedRelation: "ticket_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      Attendees: {
        Row: {
          attendeeid: string
          attendeetype: Database["public"]["Enums"]["attendee_type"]
          contactpreference: Database["public"]["Enums"]["attendee_contact_preference"]
          createdat: string
          dietaryrequirements: string | null
          eventtitle: string | null
          person_id: string | null
          registrationid: string
          relatedattendeeid: string | null
          relationship: string | null
          specialneeds: string | null
          updatedat: string
        }
        Insert: {
          attendeeid?: string
          attendeetype: Database["public"]["Enums"]["attendee_type"]
          contactpreference: Database["public"]["Enums"]["attendee_contact_preference"]
          createdat?: string
          dietaryrequirements?: string | null
          eventtitle?: string | null
          person_id?: string | null
          registrationid: string
          relatedattendeeid?: string | null
          relationship?: string | null
          specialneeds?: string | null
          updatedat?: string
        }
        Update: {
          attendeeid?: string
          attendeetype?: Database["public"]["Enums"]["attendee_type"]
          contactpreference?: Database["public"]["Enums"]["attendee_contact_preference"]
          createdat?: string
          dietaryrequirements?: string | null
          eventtitle?: string | null
          person_id?: string | null
          registrationid?: string
          relatedattendeeid?: string | null
          relationship?: string | null
          specialneeds?: string | null
          updatedat?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendees_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "attendees_registrationid_fkey"
            columns: ["registrationid"]
            isOneToOne: false
            referencedRelation: "registration_summary"
            referencedColumns: ["registrationId"]
          },
          {
            foreignKeyName: "attendees_registrationid_fkey"
            columns: ["registrationid"]
            isOneToOne: false
            referencedRelation: "Registrations"
            referencedColumns: ["registrationId"]
          },
          {
            foreignKeyName: "attendees_relatedattendeeid_fkey"
            columns: ["relatedattendeeid"]
            isOneToOne: false
            referencedRelation: "Attendees"
            referencedColumns: ["attendeeid"]
          },
        ]
      }
      Customers: {
        Row: {
          addressLine1: string | null
          addressLine2: string | null
          billingCity: string | null
          billingCountry: string | null
          billingEmail: string | null
          billingFirstName: string | null
          billingLastName: string | null
          billingOrganisationName: string | null
          billingPhone: string | null
          billingPostalCode: string | null
          billingState: string | null
          billingStreetAddress: string | null
          businessName: string | null
          city: string | null
          contactId: string | null
          country: string | null
          createdAt: string | null
          email: string | null
          firstName: string | null
          id: string
          lastName: string | null
          organisationId: string | null
          person_id: string | null
          phone: string | null
          postalCode: string | null
          state: string | null
          stripeCustomerId: string | null
          updatedAt: string | null
          userId: string | null
        }
        Insert: {
          addressLine1?: string | null
          addressLine2?: string | null
          billingCity?: string | null
          billingCountry?: string | null
          billingEmail?: string | null
          billingFirstName?: string | null
          billingLastName?: string | null
          billingOrganisationName?: string | null
          billingPhone?: string | null
          billingPostalCode?: string | null
          billingState?: string | null
          billingStreetAddress?: string | null
          businessName?: string | null
          city?: string | null
          contactId?: string | null
          country?: string | null
          createdAt?: string | null
          email?: string | null
          firstName?: string | null
          id: string
          lastName?: string | null
          organisationId?: string | null
          person_id?: string | null
          phone?: string | null
          postalCode?: string | null
          state?: string | null
          stripeCustomerId?: string | null
          updatedAt?: string | null
          userId?: string | null
        }
        Update: {
          addressLine1?: string | null
          addressLine2?: string | null
          billingCity?: string | null
          billingCountry?: string | null
          billingEmail?: string | null
          billingFirstName?: string | null
          billingLastName?: string | null
          billingOrganisationName?: string | null
          billingPhone?: string | null
          billingPostalCode?: string | null
          billingState?: string | null
          billingStreetAddress?: string | null
          businessName?: string | null
          city?: string | null
          contactId?: string | null
          country?: string | null
          createdAt?: string | null
          email?: string | null
          firstName?: string | null
          id?: string
          lastName?: string | null
          organisationId?: string | null
          person_id?: string | null
          phone?: string | null
          postalCode?: string | null
          state?: string | null
          stripeCustomerId?: string | null
          updatedAt?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["person_id"]
          },
        ]
      }
      DisplayScopes: {
        Row: {
          createdAt: string
          id: string
          name: string
        }
        Insert: {
          createdAt?: string
          id?: string
          name: string
        }
        Update: {
          createdAt?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      event_capacity: {
        Row: {
          created_at: string
          event_id: string
          max_capacity: number
          reserved_count: number
          sold_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          max_capacity: number
          reserved_count?: number
          sold_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          max_capacity?: number
          reserved_count?: number
          sold_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_capacity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "Events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_fees: {
        Row: {
          applies_to: string
          created_at: string
          event_fee_id: string
          event_id: string
          fee_type_id: string
          fee_value: number
          is_active: boolean
          is_passed_to_customer: boolean
          updated_at: string
        }
        Insert: {
          applies_to: string
          created_at?: string
          event_fee_id?: string
          event_id: string
          fee_type_id: string
          fee_value: number
          is_active?: boolean
          is_passed_to_customer?: boolean
          updated_at?: string
        }
        Update: {
          applies_to?: string
          created_at?: string
          event_fee_id?: string
          event_id?: string
          fee_type_id?: string
          fee_value?: number
          is_active?: boolean
          is_passed_to_customer?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_fees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_fees_fee_type_id_fkey"
            columns: ["fee_type_id"]
            isOneToOne: false
            referencedRelation: "fee_types"
            referencedColumns: ["fee_type_id"]
          },
        ]
      }
      event_vas_options: {
        Row: {
          event_id: string | null
          id: string
          price_override: number | null
          vas_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          price_override?: number | null
          vas_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          price_override?: number | null
          vas_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_vas_options_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_vas_options_vas_id_fkey"
            columns: ["vas_id"]
            isOneToOne: false
            referencedRelation: "value_added_services"
            referencedColumns: ["id"]
          },
        ]
      }
      Events: {
        Row: {
          createdAt: string
          description: string | null
          displayScopeId: string | null
          eventEnd: string | null
          eventId: string | null
          eventIncludes: string[] | null
          eventStart: string | null
          featured: boolean | null
          id: string
          imageUrl: string | null
          importantInformation: string[] | null
          isMultiDay: boolean | null
          isPurchasableIndividually: boolean | null
          latitude: number | null
          location: string | null
          locationid: string | null
          longitude: number | null
          maxAttendees: number | null
          organiserorganisationid: string | null
          parentEventId: string | null
          price: number | null
          registrationAvailabilityId: string | null
          slug: string | null
          title: string
          type: string | null
        }
        Insert: {
          createdAt?: string
          description?: string | null
          displayScopeId?: string | null
          eventEnd?: string | null
          eventId?: string | null
          eventIncludes?: string[] | null
          eventStart?: string | null
          featured?: boolean | null
          id?: string
          imageUrl?: string | null
          importantInformation?: string[] | null
          isMultiDay?: boolean | null
          isPurchasableIndividually?: boolean | null
          latitude?: number | null
          location?: string | null
          locationid?: string | null
          longitude?: number | null
          maxAttendees?: number | null
          organiserorganisationid?: string | null
          parentEventId?: string | null
          price?: number | null
          registrationAvailabilityId?: string | null
          slug?: string | null
          title: string
          type?: string | null
        }
        Update: {
          createdAt?: string
          description?: string | null
          displayScopeId?: string | null
          eventEnd?: string | null
          eventId?: string | null
          eventIncludes?: string[] | null
          eventStart?: string | null
          featured?: boolean | null
          id?: string
          imageUrl?: string | null
          importantInformation?: string[] | null
          isMultiDay?: boolean | null
          isPurchasableIndividually?: boolean | null
          latitude?: number | null
          location?: string | null
          locationid?: string | null
          longitude?: number | null
          maxAttendees?: number | null
          organiserorganisationid?: string | null
          parentEventId?: string | null
          price?: number | null
          registrationAvailabilityId?: string | null
          slug?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_display_scope_id_fkey"
            columns: ["displayScopeId"]
            isOneToOne: false
            referencedRelation: "DisplayScopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_locationid_fkey"
            columns: ["locationid"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["locationid"]
          },
          {
            foreignKeyName: "events_organiserorganisationid_fkey"
            columns: ["organiserorganisationid"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisationid"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parentEventId"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_registration_availability_id_fkey"
            columns: ["registrationAvailabilityId"]
            isOneToOne: false
            referencedRelation: "registration_availabilities"
            referencedColumns: ["id"]
          },
        ]
      }
      EventTickets: {
        Row: {
          availableCount: number
          createdAt: string
          eventId: string
          eventTicketId: string
          price: number
          reservedCount: number
          soldCount: number
          status: string
          ticketDefinitionId: string | null
          totalCapacity: number
          updatedAt: string
        }
        Insert: {
          availableCount: number
          createdAt?: string
          eventId: string
          eventTicketId?: string
          price: number
          reservedCount?: number
          soldCount?: number
          status?: string
          ticketDefinitionId?: string | null
          totalCapacity: number
          updatedAt?: string
        }
        Update: {
          availableCount?: number
          createdAt?: string
          eventId?: string
          eventTicketId?: string
          price?: number
          reservedCount?: number
          soldCount?: number
          status?: string
          ticketDefinitionId?: string | null
          totalCapacity?: number
          updatedAt?: string
        }
        Relationships: []
      }
      fee_types: {
        Row: {
          created_at: string
          description: string | null
          fee_calculation_type: string
          fee_default_value: number
          fee_type_id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fee_calculation_type: string
          fee_default_value?: number
          fee_type_id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fee_calculation_type?: string
          fee_default_value?: number
          fee_type_id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      grand_lodges: {
        Row: {
          abbreviation: string | null
          country: string | null
          country_code_iso3: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          abbreviation?: string | null
          country?: string | null
          country_code_iso3?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          abbreviation?: string | null
          country?: string | null
          country_code_iso3?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          capacity: number | null
          country: string | null
          createdat: string
          latitude: number | null
          locationid: string
          longitude: number | null
          placename: string
          postalcode: string | null
          roomorarea: string | null
          state: string | null
          streetaddress: string | null
          suburb: string | null
          updatedat: string
        }
        Insert: {
          capacity?: number | null
          country?: string | null
          createdat?: string
          latitude?: number | null
          locationid?: string
          longitude?: number | null
          placename: string
          postalcode?: string | null
          roomorarea?: string | null
          state?: string | null
          streetaddress?: string | null
          suburb?: string | null
          updatedat?: string
        }
        Update: {
          capacity?: number | null
          country?: string | null
          createdat?: string
          latitude?: number | null
          locationid?: string
          longitude?: number | null
          placename?: string
          postalcode?: string | null
          roomorarea?: string | null
          state?: string | null
          streetaddress?: string | null
          suburb?: string | null
          updatedat?: string
        }
        Relationships: []
      }
      lodges: {
        Row: {
          area_type: string | null
          created_at: string
          display_name: string | null
          district: string | null
          grand_lodge_id: string | null
          id: string
          meeting_place: string | null
          name: string
          number: number | null
          state_region: string | null
        }
        Insert: {
          area_type?: string | null
          created_at?: string
          display_name?: string | null
          district?: string | null
          grand_lodge_id?: string | null
          id?: string
          meeting_place?: string | null
          name: string
          number?: number | null
          state_region?: string | null
        }
        Update: {
          area_type?: string | null
          created_at?: string
          display_name?: string | null
          district?: string | null
          grand_lodge_id?: string | null
          id?: string
          meeting_place?: string | null
          name?: string
          number?: number | null
          state_region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lodges_grand_lodge_id_fkey"
            columns: ["grand_lodge_id"]
            isOneToOne: false
            referencedRelation: "grand_lodges"
            referencedColumns: ["id"]
          },
        ]
      }
      MasonicProfiles: {
        Row: {
          createdat: string
          grandoffice: string | null
          grandofficer: string | null
          grandrank: string | null
          lodgeid: string | null
          masonicprofileid: string
          masonictitle: string | null
          person_id: string | null
          rank: string | null
          updatedat: string
        }
        Insert: {
          createdat?: string
          grandoffice?: string | null
          grandofficer?: string | null
          grandrank?: string | null
          lodgeid?: string | null
          masonicprofileid?: string
          masonictitle?: string | null
          person_id?: string | null
          rank?: string | null
          updatedat?: string
        }
        Update: {
          createdat?: string
          grandoffice?: string | null
          grandofficer?: string | null
          grandrank?: string | null
          lodgeid?: string | null
          masonicprofileid?: string
          masonictitle?: string | null
          person_id?: string | null
          rank?: string | null
          updatedat?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_masonicprofiles_organisation_link"
            columns: ["lodgeid"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisationid"]
          },
          {
            foreignKeyName: "masonicprofiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["person_id"]
          },
        ]
      }
      OrganisationMemberships: {
        Row: {
          createdat: string
          isprimarycontact: boolean | null
          membershipid: string
          organisationid: string
          person_id: string | null
          roleinorg: string | null
          updatedat: string
        }
        Insert: {
          createdat?: string
          isprimarycontact?: boolean | null
          membershipid?: string
          organisationid: string
          person_id?: string | null
          roleinorg?: string | null
          updatedat?: string
        }
        Update: {
          createdat?: string
          isprimarycontact?: boolean | null
          membershipid?: string
          organisationid?: string
          person_id?: string | null
          roleinorg?: string | null
          updatedat?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisationmemberships_organisationid_fkey"
            columns: ["organisationid"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["organisationid"]
          },
          {
            foreignKeyName: "organisationmemberships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["person_id"]
          },
        ]
      }
      organisations: {
        Row: {
          city: string | null
          country: string | null
          createdat: string
          name: string
          organisationid: string
          postalcode: string | null
          state: string | null
          streetaddress: string | null
          type: Database["public"]["Enums"]["organisation_type"]
          updatedat: string
          website: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          createdat?: string
          name: string
          organisationid?: string
          postalcode?: string | null
          state?: string | null
          streetaddress?: string | null
          type: Database["public"]["Enums"]["organisation_type"]
          updatedat?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          createdat?: string
          name?: string
          organisationid?: string
          postalcode?: string | null
          state?: string | null
          streetaddress?: string | null
          type?: Database["public"]["Enums"]["organisation_type"]
          updatedat?: string
          website?: string | null
        }
        Relationships: []
      }
      package_events: {
        Row: {
          event_id: string | null
          id: string
          package_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          package_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          package_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_events_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_vas_options: {
        Row: {
          id: string
          package_id: string | null
          price_override: number | null
          vas_id: string | null
        }
        Insert: {
          id?: string
          package_id?: string | null
          price_override?: number | null
          vas_id?: string | null
        }
        Update: {
          id?: string
          package_id?: string | null
          price_override?: number | null
          vas_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_vas_options_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_vas_options_vas_id_fkey"
            columns: ["vas_id"]
            isOneToOne: false
            referencedRelation: "value_added_services"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          includes_description: string[] | null
          name: string
          parent_event_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          includes_description?: string[] | null
          name: string
          parent_event_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          includes_description?: string[] | null
          name?: string
          parent_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          auth_user_id: string | null
          city: string | null
          country: string | null
          created_at: string
          dietary_requirements: string | null
          first_name: string | null
          is_organisation: boolean
          last_name: string | null
          person_id: string
          postal_code: string | null
          primary_email: string | null
          primary_phone: string | null
          special_needs: string | null
          state: string | null
          street_address: string | null
          suffix: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          dietary_requirements?: string | null
          first_name?: string | null
          is_organisation?: boolean
          last_name?: string | null
          person_id?: string
          postal_code?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          special_needs?: string | null
          state?: string | null
          street_address?: string | null
          suffix?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          dietary_requirements?: string | null
          first_name?: string | null
          is_organisation?: boolean
          last_name?: string | null
          person_id?: string
          postal_code?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          special_needs?: string | null
          state?: string | null
          street_address?: string | null
          suffix?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      price_tiers: {
        Row: {
          created_at: string
          description: string | null
          is_active: boolean
          name: string
          tier_id: string
          tier_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          name: string
          tier_id?: string
          tier_order: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          name?: string
          tier_id?: string
          tier_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      registration_availabilities: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      registration_vas: {
        Row: {
          created_at: string
          id: string
          price_at_purchase: number
          quantity: number
          registration_id: string
          vas_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          price_at_purchase: number
          quantity?: number
          registration_id: string
          vas_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          price_at_purchase?: number
          quantity?: number
          registration_id?: string
          vas_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_vas_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_summary"
            referencedColumns: ["registrationId"]
          },
          {
            foreignKeyName: "registration_vas_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "Registrations"
            referencedColumns: ["registrationId"]
          },
          {
            foreignKeyName: "registration_vas_vas_id_fkey"
            columns: ["vas_id"]
            isOneToOne: false
            referencedRelation: "value_added_services"
            referencedColumns: ["id"]
          },
        ]
      }
      Registrations: {
        Row: {
          agreeToTerms: boolean | null
          createdAt: string | null
          customerId: string | null
          eventId: string | null
          paymentStatus: string | null
          primaryAttendeeId: string | null
          registrationDate: string | null
          registrationId: string
          registrationType: string | null
          status: string | null
          stripePaymentIntentId: string | null
          totalAmountPaid: number | null
          totalPricePaid: number | null
          updatedAt: string | null
        }
        Insert: {
          agreeToTerms?: boolean | null
          createdAt?: string | null
          customerId?: string | null
          eventId?: string | null
          paymentStatus?: string | null
          primaryAttendeeId?: string | null
          registrationDate?: string | null
          registrationId: string
          registrationType?: string | null
          status?: string | null
          stripePaymentIntentId?: string | null
          totalAmountPaid?: number | null
          totalPricePaid?: number | null
          updatedAt?: string | null
        }
        Update: {
          agreeToTerms?: boolean | null
          createdAt?: string | null
          customerId?: string | null
          eventId?: string | null
          paymentStatus?: string | null
          primaryAttendeeId?: string | null
          registrationDate?: string | null
          registrationId?: string
          registrationType?: string | null
          status?: string | null
          stripePaymentIntentId?: string | null
          totalAmountPaid?: number | null
          totalPricePaid?: number | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_consolidated_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_customer_id_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customers"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_definitions: {
        Row: {
          created_at: string
          description: string | null
          eligibility_attendee_types: string[] | null
          eligibility_mason_rank: string | null
          event_id: string | null
          id: string
          is_active: boolean | null
          name: string
          package_id: string | null
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          eligibility_attendee_types?: string[] | null
          eligibility_mason_rank?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          package_id?: string | null
          price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          eligibility_attendee_types?: string[] | null
          eligibility_mason_rank?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          package_id?: string | null
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_definitions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_definitions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_type_price_tiers: {
        Row: {
          created_at: string
          end_datetime: string
          id: string
          is_active: boolean
          price: number
          price_tier_id: string
          quantity_limit: number | null
          quantity_sold: number
          start_datetime: string
          ticket_definition_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_datetime: string
          id?: string
          is_active?: boolean
          price: number
          price_tier_id: string
          quantity_limit?: number | null
          quantity_sold?: number
          start_datetime: string
          ticket_definition_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_datetime?: string
          id?: string
          is_active?: boolean
          price?: number
          price_tier_id?: string
          quantity_limit?: number | null
          quantity_sold?: number
          start_datetime?: string
          ticket_definition_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_type_price_tiers_price_tier_id_fkey"
            columns: ["price_tier_id"]
            isOneToOne: false
            referencedRelation: "price_tiers"
            referencedColumns: ["tier_id"]
          },
          {
            foreignKeyName: "ticket_type_price_tiers_ticket_definition_id_fkey"
            columns: ["ticket_definition_id"]
            isOneToOne: false
            referencedRelation: "ticket_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      Tickets: {
        Row: {
          attendeeid: string
          checkedinat: string | null
          createdat: string
          currency: string | null
          eventid: string
          originalPrice: number | null
          paymentStatus: string | null
          pricepaid: number
          purchasedAt: string | null
          reservationExpiresAt: string | null
          reservationId: string | null
          seatinfo: string | null
          status: string
          ticketdefinitionid: string | null
          ticketid: string
          updatedat: string
        }
        Insert: {
          attendeeid: string
          checkedinat?: string | null
          createdat?: string
          currency?: string | null
          eventid: string
          originalPrice?: number | null
          paymentStatus?: string | null
          pricepaid: number
          purchasedAt?: string | null
          reservationExpiresAt?: string | null
          reservationId?: string | null
          seatinfo?: string | null
          status?: string
          ticketdefinitionid?: string | null
          ticketid?: string
          updatedat?: string
        }
        Update: {
          attendeeid?: string
          checkedinat?: string | null
          createdat?: string
          currency?: string | null
          eventid?: string
          originalPrice?: number | null
          paymentStatus?: string | null
          pricepaid?: number
          purchasedAt?: string | null
          reservationExpiresAt?: string | null
          reservationId?: string | null
          seatinfo?: string | null
          status?: string
          ticketdefinitionid?: string | null
          ticketid?: string
          updatedat?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_attendeeid_fkey"
            columns: ["attendeeid"]
            isOneToOne: false
            referencedRelation: "Attendees"
            referencedColumns: ["attendeeid"]
          },
          {
            foreignKeyName: "tickets_eventid_fkey"
            columns: ["eventid"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticketdefinitionid_fkey"
            columns: ["ticketdefinitionid"]
            isOneToOne: false
            referencedRelation: "ticket_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      value_added_services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      registration_summary: {
        Row: {
          createdAt: string | null
          customer_name: string | null
          customerId: string | null
          event_title: string | null
          eventId: string | null
          paymentStatus: string | null
          primaryAttendeeId: string | null
          registrationDate: string | null
          registrationId: string | null
          registrationType: string | null
          status: string | null
          totalAmountPaid: number | null
          totalPricePaid: number | null
          updatedAt: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_consolidated_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_customer_id_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      broadcast_high_demand_event: {
        Args: { event_id: string }
        Returns: boolean
      }
      cancel_reservation: {
        Args: { p_reservation_id: string } | { p_reservation_id: string }
        Returns: number
      }
      cancel_reservation_simple: {
        Args: { p_reservation_id: string }
        Returns: boolean
      }
      clear_expired_reservations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      complete_reservation: {
        Args:
          | { p_reservation_id: string; p_attendee_id: string }
          | { p_reservation_id: string; p_attendee_id: string }
        Returns: string[]
      }
      complete_reservation_simple: {
        Args: { p_reservation_id: string; p_attendee_id: string }
        Returns: string[]
      }
      confirm_event_capacity: {
        Args: { p_event_id: string; p_quantity?: number }
        Returns: boolean
      }
      get_event_availability: {
        Args: { p_event_id: string }
        Returns: Json
      }
      get_ticket_availability: {
        Args:
          | { p_event_id: string; p_ticket_definition_id: string }
          | { p_event_id: string; p_ticket_definition_id: string }
        Returns: Json
      }
      get_ticket_availability_text: {
        Args: { p_event_id: string; p_ticket_definition_id: string }
        Returns: Json
      }
      get_ticket_availability_uuid: {
        Args: { p_event_id: string; p_ticket_definition_id: string }
        Returns: Json
      }
      hello_tickets: {
        Args: { name: string }
        Returns: string
      }
      initialize_event_capacity: {
        Args: { p_event_id: string; p_max_capacity?: number }
        Returns: {
          created_at: string
          event_id: string
          max_capacity: number
          reserved_count: number
          sold_count: number
          updated_at: string
        }
      }
      is_event_high_demand: {
        Args: { p_event_id: string; p_threshold_percent?: number }
        Returns: boolean
      }
      is_ticket_high_demand: {
        Args: {
          p_event_id: string
          p_ticket_definition_id: string
          p_threshold_percent?: number
        }
        Returns: boolean
      }
      log_column_rename: {
        Args: {
          table_name: string
          old_column: string
          new_column: string
          success?: boolean
        }
        Returns: undefined
      }
      log_table_rename: {
        Args: { old_name: string; new_name: string; success?: boolean }
        Returns: undefined
      }
      normalize_event_id: {
        Args: { p_id: string }
        Returns: string
      }
      refresh_event_days: {
        Args: { parent_id_uuid: string }
        Returns: undefined
      }
      release_event_capacity: {
        Args: { p_event_id: string; p_quantity?: number }
        Returns: boolean
      }
      reserve_event_capacity: {
        Args: { p_event_id: string; p_quantity?: number }
        Returns: boolean
      }
      reserve_tickets: {
        Args: {
          p_event_id: string
          p_ticket_definition_id: string
          p_quantity: number
          p_reservation_minutes?: number
        }
        Returns: {
          ticket_id: string
          reservation_id: string
          expires_at: string
        }[]
      }
      reserve_tickets_simple: {
        Args: {
          p_event_id: string
          p_ticket_definition_id: string
          p_quantity: number
          p_reservation_minutes?: number
        }
        Returns: {
          ticket_id: string
          reservation_id: string
          expires_at: string
        }[]
      }
      reserve_tickets_v2: {
        Args: {
          p_event_id: string
          p_ticket_definition_id: string
          p_quantity: number
          p_reservation_minutes?: number
        }
        Returns: {
          ticket_id: string
          reservation_id: string
          expires_at: string
        }[]
      }
      reserve_tickets_v3: {
        Args: {
          p_event_id: string
          p_ticket_definition_id: string
          p_quantity: number
          p_reservation_minutes?: number
        }
        Returns: {
          ticket_id: string
          reservation_id: string
          expires_at: string
        }[]
      }
      schedule_reservation_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_all_lodges: {
        Args: { search_term: string; result_limit?: number }
        Returns: {
          area_type: string | null
          created_at: string
          display_name: string | null
          district: string | null
          grand_lodge_id: string | null
          id: string
          meeting_place: string | null
          name: string
          number: number | null
          state_region: string | null
        }[]
      }
      search_grand_lodges_prioritized: {
        Args: { search_term: string; user_country: string }
        Returns: {
          abbreviation: string | null
          country: string | null
          country_code_iso3: string | null
          created_at: string
          id: string
          name: string
        }[]
      }
      test_reserve_tickets: {
        Args: {
          p_event_id: string
          p_ticket_definition_id: string
          p_quantity: number
        }
        Returns: {
          attendeeid: string
          checkedinat: string | null
          createdat: string
          currency: string | null
          eventid: string
          originalPrice: number | null
          paymentStatus: string | null
          pricepaid: number
          purchasedAt: string | null
          reservationExpiresAt: string | null
          reservationId: string | null
          seatinfo: string | null
          status: string
          ticketdefinitionid: string | null
          ticketid: string
          updatedat: string
        }[]
      }
      to_camel_case: {
        Args: { snake_str: string }
        Returns: string
      }
    }
    Enums: {
      attendee_contact_preference:
        | "Directly"
        | "PrimaryAttendee"
        | "Mason"
        | "Guest"
        | "ProvideLater"
      attendee_type: "Mason" | "Guest" | "LadyPartner" | "GuestPartner"
      billing_reason:
        | "subscription_cycle"
        | "subscription_create"
        | "subscription_update"
        | "subscription_threshold"
        | "manual"
        | "upcoming"
        | "quote_accept"
      billing_scheme: "per_unit" | "tiered"
      collection_method: "charge_automatically" | "send_invoice"
      invoice_status: "draft" | "open" | "paid" | "void" | "uncollectible"
      organisation_type:
        | "Lodge"
        | "GrandLodge"
        | "MasonicOrder"
        | "Company"
        | "Other"
      price_type: "one_time" | "recurring"
      quote_status: "draft" | "open" | "accepted" | "canceled" | "expired"
      stripe_order_status: "pending" | "completed" | "canceled"
      stripe_subscription_status:
        | "not_started"
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "paused"
      tax_behavior: "inclusive" | "exclusive" | "unspecified"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendee_contact_preference: [
        "Directly",
        "PrimaryAttendee",
        "Mason",
        "Guest",
        "ProvideLater",
      ],
      attendee_type: ["Mason", "Guest", "LadyPartner", "GuestPartner"],
      billing_reason: [
        "subscription_cycle",
        "subscription_create",
        "subscription_update",
        "subscription_threshold",
        "manual",
        "upcoming",
        "quote_accept",
      ],
      billing_scheme: ["per_unit", "tiered"],
      collection_method: ["charge_automatically", "send_invoice"],
      invoice_status: ["draft", "open", "paid", "void", "uncollectible"],
      organisation_type: [
        "Lodge",
        "GrandLodge",
        "MasonicOrder",
        "Company",
        "Other",
      ],
      price_type: ["one_time", "recurring"],
      quote_status: ["draft", "open", "accepted", "canceled", "expired"],
      stripe_order_status: ["pending", "completed", "canceled"],
      stripe_subscription_status: [
        "not_started",
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ],
      tax_behavior: ["inclusive", "exclusive", "unspecified"],
    },
  },
} as const
