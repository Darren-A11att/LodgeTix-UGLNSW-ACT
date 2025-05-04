export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      Attendees: {
        Row: {
          attendeeid: string
          city: string | null
          contactpreference: string | null
          createdAt: string
          dietaryrequirements: string | null
          firstName: string | null
          grandLodgeId: string | null
          grandOfficer: string | null
          grandOffice: string | null
          grandRank: string | null
          isActive: boolean
          lastName: string | null
          lodgeId: string | null
          lodgeNumber: string | null
          mobilePhone: string | null
          orderId: string | null
          postalAddress: string | null
          postalCode: string | null
          primaryEmail: string | null
          primaryPhone: string | null
          rank: string | null
          registrationid: string | null
          relationship: string | null
          relatedAttendeeId: string | null
          specialNeeds: string | null
          state: string | null
          title: string | null
          attendeeType: "Mason" | "LadyPartner" | "Guest" | "GuestPartner"
          updatedAt: string
        }
        Insert: {
          attendeeid?: string
          city?: string | null
          contactpreference?: string | null
          createdAt?: string
          dietaryrequirements?: string | null
          firstName?: string | null
          grandLodgeId?: string | null
          grandOfficer?: string | null
          grandOffice?: string | null
          grandRank?: string | null
          isActive?: boolean
          lastName?: string | null
          lodgeId?: string | null
          lodgeNumber?: string | null
          mobilePhone?: string | null
          orderId?: string | null
          postalAddress?: string | null
          postalCode?: string | null
          primaryEmail?: string | null
          primaryPhone?: string | null
          rank?: string | null
          registrationid?: string | null
          relationship?: string | null
          relatedAttendeeId?: string | null
          specialNeeds?: string | null
          state?: string | null
          title?: string | null
          attendeeType?: "Mason" | "LadyPartner" | "Guest" | "GuestPartner"
          updatedAt?: string
        }
        Update: {
          attendeeid?: string
          city?: string | null
          contactpreference?: string | null
          createdAt?: string
          dietaryrequirements?: string | null
          firstName?: string | null
          grandLodgeId?: string | null
          grandOfficer?: string | null
          grandOffice?: string | null
          grandRank?: string | null
          isActive?: boolean
          lastName?: string | null
          lodgeId?: string | null
          lodgeNumber?: string | null
          mobilePhone?: string | null
          orderId?: string | null
          postalAddress?: string | null
          postalCode?: string | null
          primaryEmail?: string | null
          primaryPhone?: string | null
          rank?: string | null
          registrationid?: string | null
          relationship?: string | null
          relatedAttendeeId?: string | null
          specialNeeds?: string | null
          state?: string | null
          title?: string | null
          attendeeType?: "Mason" | "LadyPartner" | "Guest" | "GuestPartner"
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Attendees_grandLodgeId_fkey"
            columns: ["grandLodgeId"]
            isOneToOne: false
            referencedRelation: "GrandLodges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Attendees_lodgeId_fkey"
            columns: ["lodgeId"]
            isOneToOne: false
            referencedRelation: "Lodges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Attendees_relatedAttendeeId_fkey"
            columns: ["relatedAttendeeId"]
            isOneToOne: false
            referencedRelation: "Attendees"
            referencedColumns: ["attendeeid"]
          },
          {
            foreignKeyName: "Attendees_registrationid_fkey"
            columns: ["registrationid"]
            isOneToOne: false
            referencedRelation: "Registrations"
            referencedColumns: ["id"]
          }
        ]
      }
      attendee_access: {
        Row: {
          id: string
          attendee_id: string
          event_id: string
          access_granted_at: string
          access_source: string
          is_active: boolean
          access_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          attendee_id: string
          event_id: string
          access_granted_at?: string
          access_source: string
          is_active?: boolean
          access_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          attendee_id?: string
          event_id?: string
          access_granted_at?: string
          access_source?: string
          is_active?: boolean
          access_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendee_access_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "Attendees"
            referencedColumns: ["attendeeid"]
          },
          {
            foreignKeyName: "attendee_access_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          }
        ]
      }
      Customers: {
        Row: {
          createdAt: string
          email: string | null
          id: string
          mobilePhone: string | null
          name: string | null
          paymentMethod: string | null
          phone: string | null
          stripeCustomerId: string | null
          userId: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email?: string | null
          id?: string
          mobilePhone?: string | null
          name?: string | null
          paymentMethod?: string | null
          phone?: string | null
          stripeCustomerId?: string | null
          userId?: string | null
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string | null
          id?: string
          mobilePhone?: string | null
          name?: string | null
          paymentMethod?: string | null
          phone?: string | null
          stripeCustomerId?: string | null
          userId?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Customers_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      event_capacity: {
        Row: {
          event_id: string
          max_capacity: number
          reserved_count: number
          sold_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          event_id: string
          max_capacity: number
          reserved_count?: number
          sold_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          event_id?: string
          max_capacity?: number
          reserved_count?: number
          sold_count?: number
          created_at?: string
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
          {
            foreignKeyName: "event_capacity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_availability_summary"
            referencedColumns: ["event_id"]
          }
        ]
      }
      Events: {
        Row: {
          createdAt: string
          description: string | null
          eventEnd: string | null
          eventIncludes: string[] | null
          eventStart: string | null
          featured: boolean | null
          id: string
          imageUrl: string | null
          importantInformation: string | null
          isMultiDay: boolean | null
          isPurchasableIndividually: boolean | null
          latitude: number | null
          location: string | null
          longitude: number | null
          parentEventId: string | null
          slug: string
          title: string
          type: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          eventEnd?: string | null
          eventIncludes?: string[] | null
          eventStart?: string | null
          featured?: boolean | null
          id?: string
          imageUrl?: string | null
          importantInformation?: string | null
          isMultiDay?: boolean | null
          isPurchasableIndividually?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          parentEventId?: string | null
          slug: string
          title: string
          type?: string | null
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          eventEnd?: string | null
          eventIncludes?: string[] | null
          eventStart?: string | null
          featured?: boolean | null
          id?: string
          imageUrl?: string | null
          importantInformation?: string | null
          isMultiDay?: boolean | null
          isPurchasableIndividually?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          parentEventId?: string | null
          slug?: string
          title?: string
          type?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Events_parentEventId_fkey"
            columns: ["parentEventId"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          }
        ]
      }
      GrandLodges: {
        Row: {
          country: string | null
          createdAt: string
          id: string
          name: string
          updatedAt: string
        }
        Insert: {
          country?: string | null
          createdAt?: string
          id?: string
          name: string
          updatedAt?: string
        }
        Update: {
          country?: string | null
          createdAt?: string
          id?: string
          name?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Lodges: {
        Row: {
          createdAt: string
          grandLodgeId: string | null
          id: string
          lodgeNumber: string | null
          name: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          grandLodgeId?: string | null
          id?: string
          lodgeNumber?: string | null
          name: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          grandLodgeId?: string | null
          id?: string
          lodgeNumber?: string | null
          name?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Lodges_grandLodgeId_fkey"
            columns: ["grandLodgeId"]
            isOneToOne: false
            referencedRelation: "GrandLodges"
            referencedColumns: ["id"]
          }
        ]
      }
      package_capacity: {
        Row: {
          package_id: string
          max_capacity: number
          reserved_count: number
          sold_count: number
        }
        Insert: {
          package_id: string
          max_capacity: number
          reserved_count?: number
          sold_count?: number
        }
        Update: {
          package_id?: string
          max_capacity?: number
          reserved_count?: number
          sold_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_capacity_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: true
            referencedRelation: "packages"
            referencedColumns: ["id"]
          }
        ]
      }
      package_events: {
        Row: {
          id: string
          package_id: string
          event_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          package_id: string
          event_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          event_id?: string
          created_at?: string
          updated_at?: string
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
          }
        ]
      }
      packages: {
        Row: {
          id: string
          name: string
          description: string
          parent_event_id: string
          is_active: boolean
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          parent_event_id: string
          is_active?: boolean
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          parent_event_id?: string
          is_active?: boolean
          price?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          }
        ]
      }
      Registrations: {
        Row: {
          createdAt: string
          customerId: string | null
          email: string | null
          formData: Json | null
          id: string
          isPaid: boolean | null
          name: string | null
          orderTotal: number | null
          paymentIntentId: string | null
          paymentMethod: string | null
          paymentStatus: string | null
          registrationType: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          customerId?: string | null
          email?: string | null
          formData?: Json | null
          id?: string
          isPaid?: boolean | null
          name?: string | null
          orderTotal?: number | null
          paymentIntentId?: string | null
          paymentMethod?: string | null
          paymentStatus?: string | null
          registrationType?: string | null
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          customerId?: string | null
          email?: string | null
          formData?: Json | null
          id?: string
          isPaid?: boolean | null
          name?: string | null
          orderTotal?: number | null
          paymentIntentId?: string | null
          paymentMethod?: string | null
          paymentStatus?: string | null
          registrationType?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Registrations_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customers"
            referencedColumns: ["id"]
          }
        ]
      }
      ticket_definitions: {
        Row: {
          id: string
          event_id: string
          name: string
          description: string
          price: number
          is_active: boolean
          attendee_type: string[]
          available_from: string | null
          available_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          description: string
          price: number
          is_active?: boolean
          attendee_type?: string[]
          available_from?: string | null
          available_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          description?: string
          price?: number
          is_active?: boolean
          attendee_type?: string[]
          available_from?: string | null
          available_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_definitions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          }
        ]
      }
      Tickets: {
        Row: {
          attendeeId: string | null
          createdAt: string
          eventId: string | null
          id: string
          isPaid: boolean | null
          isScanned: boolean | null
          isValid: boolean | null
          orderId: string | null
          orderItemId: string | null
          registrationId: string | null
          scannedAt: string | null
          ticketDefinitionId: string | null
          ticketNumber: string | null
          ticketQrUrl: string | null
          ticketType: string | null
          updatedAt: string
        }
        Insert: {
          attendeeId?: string | null
          createdAt?: string
          eventId?: string | null
          id?: string
          isPaid?: boolean | null
          isScanned?: boolean | null
          isValid?: boolean | null
          orderId?: string | null
          orderItemId?: string | null
          registrationId?: string | null
          scannedAt?: string | null
          ticketDefinitionId?: string | null
          ticketNumber?: string | null
          ticketQrUrl?: string | null
          ticketType?: string | null
          updatedAt?: string
        }
        Update: {
          attendeeId?: string | null
          createdAt?: string
          eventId?: string | null
          id?: string
          isPaid?: boolean | null
          isScanned?: boolean | null
          isValid?: boolean | null
          orderId?: string | null
          orderItemId?: string | null
          registrationId?: string | null
          scannedAt?: string | null
          ticketDefinitionId?: string | null
          ticketNumber?: string | null
          ticketQrUrl?: string | null
          ticketType?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Tickets_attendeeId_fkey"
            columns: ["attendeeId"]
            isOneToOne: false
            referencedRelation: "Attendees"
            referencedColumns: ["attendeeid"]
          },
          {
            foreignKeyName: "Tickets_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Tickets_registrationId_fkey"
            columns: ["registrationId"]
            isOneToOne: false
            referencedRelation: "Registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Tickets_ticketDefinitionId_fkey"
            columns: ["ticketDefinitionId"]
            isOneToOne: false
            referencedRelation: "ticket_definitions"
            referencedColumns: ["id"]
          }
        ]
      }
      value_added_services: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          price: number
          inventory_count: number | null
          max_per_attendee: number
          eligible_attendee_types: string[]
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: string
          price: number
          inventory_count?: number | null
          max_per_attendee?: number
          eligible_attendee_types?: string[]
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          price?: number
          inventory_count?: number | null
          max_per_attendee?: number
          eligible_attendee_types?: string[]
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      vas_inventory: {
        Row: {
          service_id: string
          total_inventory: number
          reserved_count: number
          sold_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          service_id: string
          total_inventory: number
          reserved_count?: number
          sold_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          service_id?: string
          total_inventory?: number
          reserved_count?: number
          sold_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vas_inventory_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: true
            referencedRelation: "value_added_services"
            referencedColumns: ["id"]
          }
        ]
      }
      vas_purchases: {
        Row: {
          id: string
          service_id: string
          attendee_id: string
          quantity: number
          unit_price: number
          total_price: number
          purchase_status: string
          payment_intent_id: string | null
          order_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id: string
          attendee_id: string
          quantity: number
          unit_price: number
          total_price: number
          purchase_status?: string
          payment_intent_id?: string | null
          order_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          attendee_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          purchase_status?: string
          payment_intent_id?: string | null
          order_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vas_purchases_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "Attendees"
            referencedColumns: ["attendeeid"]
          },
          {
            foreignKeyName: "vas_purchases_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "value_added_services"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      event_availability_summary: {
        Row: {
          event_id: string | null
          event_title: string | null
          event_start_date: string | null
          event_end_date: string | null
          max_capacity: number | null
          reserved_count: number | null
          sold_count: number | null
          available_count: number | null
          usage_percentage: number | null
          is_sold_out: boolean | null
          is_high_demand: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      confirm_event_capacity: {
        Args: {
          p_event_id: string
          p_quantity?: number
        }
        Returns: boolean
      }
      get_event_availability: {
        Args: {
          p_event_id: string
        }
        Returns: Json
      }
      get_ticket_availability: {
        Args: {
          p_event_id: string
          p_ticket_definition_id: string
        }
        Returns: Json
      }
      initialize_event_capacity: {
        Args: {
          p_event_id: string
          p_max_capacity?: number
        }
        Returns: Record<string, unknown>
      }
      is_event_high_demand: {
        Args: {
          p_event_id: string
          p_threshold_percent?: number
        }
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
      release_event_capacity: {
        Args: {
          p_event_id: string
          p_quantity?: number
        }
        Returns: boolean
      }
      reserve_event_capacity: {
        Args: {
          p_event_id: string
          p_quantity?: number
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}