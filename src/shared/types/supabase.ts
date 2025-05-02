export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attendee_links: {
        Row: {
          attendee_type: string
          created_at: string
          guest_id: string | null
          id: string
          is_primary: boolean
          mason_id: string | null
          registration_id: string
        }
        Insert: {
          attendee_type: string
          created_at?: string
          guest_id?: string | null
          id?: string
          is_primary?: boolean
          mason_id?: string | null
          registration_id: string
        }
        Update: {
          attendee_type?: string
          created_at?: string
          guest_id?: string | null
          id?: string
          is_primary?: boolean
          mason_id?: string | null
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendee_links_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendee_links_mason_id_fkey"
            columns: ["mason_id"]
            isOneToOne: false
            referencedRelation: "masons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendee_links_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      attendee_ticket_assignments: {
        Row: {
          attendee_link_id: string
          created_at: string
          id: string
          price_at_assignment: number
          registration_id: string
          ticket_definition_id: string
        }
        Insert: {
          attendee_link_id: string
          created_at?: string
          id?: string
          price_at_assignment: number
          registration_id: string
          ticket_definition_id: string
        }
        Update: {
          attendee_link_id?: string
          created_at?: string
          id?: string
          price_at_assignment?: number
          registration_id?: string
          ticket_definition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendee_ticket_assignments_attendee_link_id_fkey"
            columns: ["attendee_link_id"]
            isOneToOne: false
            referencedRelation: "attendee_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendee_ticket_assignments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
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
      customers: {
        Row: {
          address_line1: string
          address_line2: string | null
          business_name: string | null
          city: string
          country: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          postal_code: string
          state: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          business_name?: string | null
          city: string
          country: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          postal_code: string
          state: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          business_name?: string | null
          city?: string
          country?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          postal_code?: string
          state?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      event_days: {
        Row: {
          created_at: string | null
          date: string
          day_number: number
          event_id: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          date: string
          day_number: number
          event_id?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          date?: string
          day_number?: number
          event_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_days_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
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
            referencedRelation: "events"
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
      events: {
        Row: {
          created_at: string
          // date: string | null // Replaced by event_start
          // day: string | null // To be derived
          description: string | null
          // end_date: string | null // Replaced by event_end
          // end_time: string | null // Replaced by event_end
          event_includes: string[] | null
          event_start: string // Added: Represents timestamptz from DB (ISO string)
          event_end: string | null // Added: Represents timestamptz from DB (ISO string)
          featured: boolean | null
          id: string
          imageUrl: string | null
          important_information: string[] | null
          is_multi_day: boolean | null // This might need re-evaluation based on event_start/event_end
          is_purchasable_individually: boolean | null
          latitude: number | null
          location: string | null
          longitude: number | null
          maxAttendees: number | null
          parent_event_id: string | null
          price: number | null
          slug: string | null 
          // start_time: string | null // Replaced by event_start
          // time: string | null // To be derived
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string
          // date?: string | null
          // day?: string | null
          description?: string | null
          // end_date?: string | null
          // end_time?: string | null
          event_includes?: string[] | null
          event_start?: string // Added: Expects ISO string or DB compatible format
          event_end?: string | null // Added: Expects ISO string or DB compatible format
          featured?: boolean | null
          id?: string
          imageUrl?: string | null
          important_information?: string[] | null
          is_multi_day?: boolean | null
          is_purchasable_individually?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          maxAttendees?: number | null
          parent_event_id?: string | null
          price?: number | null
          slug?: string | null 
          // start_time?: string | null
          // time?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string
          // date?: string | null
          // day?: string | null
          description?: string | null
          // end_date?: string | null
          // end_time?: string | null
          event_includes?: string[] | null
          event_start?: string // Added
          event_end?: string | null // Added
          featured?: boolean | null
          id?: string
          imageUrl?: string | null
          important_information?: string[] | null
          is_multi_day?: boolean | null
          is_purchasable_individually?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          maxAttendees?: number | null
          parent_event_id?: string | null
          price?: number | null
          slug?: string | null 
          // start_time?: string | null
          // time?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_metadata: {
        Row: {
          created_at: string | null
          feature_id: string
          id: string
          key: string
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          feature_id: string
          id?: string
          key: string
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          feature_id?: string
          id?: string
          key?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_metadata_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      grand_lodges: {
        Row: {
          abbreviation: string | null
          country: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          abbreviation?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          abbreviation?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      guests: {
        Row: {
          contact_confirmed: boolean | null
          contact_preference: string | null
          created_at: string
          customer_id: string | null
          dietary_requirements: string | null
          email: string | null
          first_name: string | null
          guest_type: string
          id: string
          last_name: string | null
          partner_relationship: string | null
          phone: string | null
          related_guest_id: string | null
          related_mason_id: string | null
          special_needs: string | null
          title: string | null
        }
        Insert: {
          contact_confirmed?: boolean | null
          contact_preference?: string | null
          created_at?: string
          customer_id?: string | null
          dietary_requirements?: string | null
          email?: string | null
          first_name?: string | null
          guest_type: string
          id?: string
          last_name?: string | null
          partner_relationship?: string | null
          phone?: string | null
          related_guest_id?: string | null
          related_mason_id?: string | null
          special_needs?: string | null
          title?: string | null
        }
        Update: {
          contact_confirmed?: boolean | null
          contact_preference?: string | null
          created_at?: string
          customer_id?: string | null
          dietary_requirements?: string | null
          email?: string | null
          first_name?: string | null
          guest_type?: string
          id?: string
          last_name?: string | null
          partner_relationship?: string | null
          phone?: string | null
          related_guest_id?: string | null
          related_mason_id?: string | null
          special_needs?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_guests_customer_id"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_related_guest_id_fkey"
            columns: ["related_guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_related_mason_id_fkey"
            columns: ["related_mason_id"]
            isOneToOne: false
            referencedRelation: "masons"
            referencedColumns: ["id"]
          },
        ]
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
          number: string | null
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
          number?: string | null
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
          number?: string | null
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
      masons: {
        Row: {
          created_at: string
          customer_id: string | null
          dietary_requirements: string | null
          email: string | null
          first_name: string | null
          grand_lodge_id: string | null
          grand_office: string | null
          grand_office_other: string | null
          grand_officer: string | null
          grand_rank: string | null
          id: string
          last_name: string | null
          lodge_id: string | null
          phone: string | null
          rank: string | null
          special_needs: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          dietary_requirements?: string | null
          email?: string | null
          first_name?: string | null
          grand_lodge_id?: string | null
          grand_office?: string | null
          grand_office_other?: string | null
          grand_officer?: string | null
          grand_rank?: string | null
          id?: string
          last_name?: string | null
          lodge_id?: string | null
          phone?: string | null
          rank?: string | null
          special_needs?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          dietary_requirements?: string | null
          email?: string | null
          first_name?: string | null
          grand_lodge_id?: string | null
          grand_office?: string | null
          grand_office_other?: string | null
          grand_officer?: string | null
          grand_rank?: string | null
          id?: string
          last_name?: string | null
          lodge_id?: string | null
          phone?: string | null
          rank?: string | null
          special_needs?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_masons_customer_id"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "masons_grand_lodge_id_fkey"
            columns: ["grand_lodge_id"]
            isOneToOne: false
            referencedRelation: "grand_lodges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "masons_lodge_id_fkey"
            columns: ["lodge_id"]
            isOneToOne: false
            referencedRelation: "lodges"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "events"
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
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "registrations"
            referencedColumns: ["id"]
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
      registrations: {
        Row: {
          agree_to_terms: boolean
          created_at: string
          customer_id: string
          id: string
          parent_event_id: string | null
          payment_status: string
          registration_type: string
          stripe_payment_intent_id: string | null
          total_price_paid: number | null
        }
        Insert: {
          agree_to_terms?: boolean
          created_at?: string
          customer_id: string
          id?: string
          parent_event_id?: string | null
          payment_status?: string
          registration_type: string
          stripe_payment_intent_id?: string | null
          total_price_paid?: number | null
        }
        Update: {
          agree_to_terms?: boolean
          created_at?: string
          customer_id?: string
          id?: string
          parent_event_id?: string | null
          payment_status?: string
          registration_type?: string
          stripe_payment_intent_id?: string | null
          total_price_paid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_registrations_customer_id"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_coupons: {
        Row: {
          amount_off: number | null
          created: string | null
          created_at: string
          currency: string | null
          duration: string
          duration_in_months: number | null
          id: string
          max_redemptions: number | null
          metadata: Json | null
          name: string | null
          percent_off: number | null
          redeem_by: string | null
          times_redeemed: number
          valid: boolean
        }
        Insert: {
          amount_off?: number | null
          created?: string | null
          created_at?: string
          currency?: string | null
          duration: string
          duration_in_months?: number | null
          id: string
          max_redemptions?: number | null
          metadata?: Json | null
          name?: string | null
          percent_off?: number | null
          redeem_by?: string | null
          times_redeemed?: number
          valid: boolean
        }
        Update: {
          amount_off?: number | null
          created?: string | null
          created_at?: string
          currency?: string | null
          duration?: string
          duration_in_months?: number | null
          id?: string
          max_redemptions?: number | null
          metadata?: Json | null
          name?: string | null
          percent_off?: number | null
          redeem_by?: string | null
          times_redeemed?: number
          valid?: boolean
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          customer_id: string
          deleted_at: string | null
          id: number
          stripe_customer_id_text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          deleted_at?: string | null
          id?: never
          stripe_customer_id_text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          deleted_at?: string | null
          id?: never
          stripe_customer_id_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_stripe_customers_customer_id"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_discounts: {
        Row: {
          coupon_id: string
          created: string | null
          created_at: string
          end_date: string | null
          id: string
          invoice_id: string | null
          promotion_code_id: string | null
          quote_id: string | null
          start_date: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          coupon_id: string
          created?: string | null
          created_at?: string
          end_date?: string | null
          id: string
          invoice_id?: string | null
          promotion_code_id?: string | null
          quote_id?: string | null
          start_date?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          coupon_id?: string
          created?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          invoice_id?: string | null
          promotion_code_id?: string | null
          quote_id?: string | null
          start_date?: string | null
          stripe_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_discount_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "stripe_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_discount_quote"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "stripe_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_discounts_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "stripe_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_discounts_promotion_code_id_fkey"
            columns: ["promotion_code_id"]
            isOneToOne: false
            referencedRelation: "stripe_promotion_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_discounts_stripe_customer_id_fkey"
            columns: ["stripe_customer_id"]
            isOneToOne: false
            referencedRelation: "stripe_customers"
            referencedColumns: ["stripe_customer_id_text"]
          },
        ]
      }
      stripe_invoice_line_items: {
        Row: {
          amount: number | null
          amount_excluding_tax: number | null
          created_at: string
          currency: string | null
          description: string | null
          discountable: boolean | null
          id: string
          invoice_id: string
          period: Json | null
          plan_id: string | null
          price_id: string | null
          proration: boolean | null
          proration_details: Json | null
          quantity: number | null
          tax_amounts: Json | null
          tax_rates: Json | null
          type: string | null
        }
        Insert: {
          amount?: number | null
          amount_excluding_tax?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          discountable?: boolean | null
          id: string
          invoice_id: string
          period?: Json | null
          plan_id?: string | null
          price_id?: string | null
          proration?: boolean | null
          proration_details?: Json | null
          quantity?: number | null
          tax_amounts?: Json | null
          tax_rates?: Json | null
          type?: string | null
        }
        Update: {
          amount?: number | null
          amount_excluding_tax?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          discountable?: boolean | null
          id?: string
          invoice_id?: string
          period?: Json | null
          plan_id?: string | null
          price_id?: string | null
          proration?: boolean | null
          proration_details?: Json | null
          quantity?: number | null
          tax_amounts?: Json | null
          tax_rates?: Json | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "stripe_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_invoice_line_items_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "stripe_prices"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          amount_remaining: number | null
          amount_shipping: number | null
          billing_reason: Database["public"]["Enums"]["billing_reason"] | null
          charge_id: string | null
          collection_method:
            | Database["public"]["Enums"]["collection_method"]
            | null
          created: string | null
          created_at: string
          currency: string
          customer_address: Json | null
          customer_shipping: Json | null
          description: string | null
          discount_details: Json | null
          due_date: string | null
          finalized_at: string | null
          hosted_invoice_url: string | null
          id: string
          invoice_pdf: string | null
          marked_uncollectible_at: string | null
          number: string | null
          paid: boolean
          paid_at: string | null
          paid_out_of_band: boolean
          payment_intent_id: string | null
          period_end: string | null
          period_start: string | null
          quote_id: string | null
          receipt_number: string | null
          statement_descriptor: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          status_transitions: Json | null
          stripe_customer_id: string | null
          subtotal: number | null
          subtotal_excluding_tax: number | null
          tax: number | null
          tax_details: Json | null
          total: number | null
          total_excluding_tax: number | null
          voided_at: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          amount_remaining?: number | null
          amount_shipping?: number | null
          billing_reason?: Database["public"]["Enums"]["billing_reason"] | null
          charge_id?: string | null
          collection_method?:
            | Database["public"]["Enums"]["collection_method"]
            | null
          created?: string | null
          created_at?: string
          currency: string
          customer_address?: Json | null
          customer_shipping?: Json | null
          description?: string | null
          discount_details?: Json | null
          due_date?: string | null
          finalized_at?: string | null
          hosted_invoice_url?: string | null
          id: string
          invoice_pdf?: string | null
          marked_uncollectible_at?: string | null
          number?: string | null
          paid?: boolean
          paid_at?: string | null
          paid_out_of_band?: boolean
          payment_intent_id?: string | null
          period_end?: string | null
          period_start?: string | null
          quote_id?: string | null
          receipt_number?: string | null
          statement_descriptor?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          status_transitions?: Json | null
          stripe_customer_id?: string | null
          subtotal?: number | null
          subtotal_excluding_tax?: number | null
          tax?: number | null
          tax_details?: Json | null
          total?: number | null
          total_excluding_tax?: number | null
          voided_at?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          amount_remaining?: number | null
          amount_shipping?: number | null
          billing_reason?: Database["public"]["Enums"]["billing_reason"] | null
          charge_id?: string | null
          collection_method?:
            | Database["public"]["Enums"]["collection_method"]
            | null
          created?: string | null
          created_at?: string
          currency?: string
          customer_address?: Json | null
          customer_shipping?: Json | null
          description?: string | null
          discount_details?: Json | null
          due_date?: string | null
          finalized_at?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf?: string | null
          marked_uncollectible_at?: string | null
          number?: string | null
          paid?: boolean
          paid_at?: string | null
          paid_out_of_band?: boolean
          payment_intent_id?: string | null
          period_end?: string | null
          period_start?: string | null
          quote_id?: string | null
          receipt_number?: string | null
          statement_descriptor?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          status_transitions?: Json | null
          stripe_customer_id?: string | null
          subtotal?: number | null
          subtotal_excluding_tax?: number | null
          tax?: number | null
          tax_details?: Json | null
          total?: number | null
          total_excluding_tax?: number | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "stripe_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_invoices_stripe_customer_id_fkey"
            columns: ["stripe_customer_id"]
            isOneToOne: false
            referencedRelation: "stripe_customers"
            referencedColumns: ["stripe_customer_id_text"]
          },
        ]
      }
      stripe_prices: {
        Row: {
          active: boolean
          billing_scheme: Database["public"]["Enums"]["billing_scheme"] | null
          created: string | null
          created_at: string
          currency: string
          id: string
          livemode: boolean | null
          lookup_key: string | null
          metadata: Json | null
          nickname: string | null
          recurring: Json | null
          stripe_product_id: string
          tax_behavior: Database["public"]["Enums"]["tax_behavior"] | null
          ticket_definition_id: string | null
          tiers_mode: string | null
          transform_quantity: Json | null
          type: Database["public"]["Enums"]["price_type"] | null
          unit_amount: number | null
          unit_amount_decimal: number | null
          vas_id: string | null
        }
        Insert: {
          active: boolean
          billing_scheme?: Database["public"]["Enums"]["billing_scheme"] | null
          created?: string | null
          created_at?: string
          currency: string
          id: string
          livemode?: boolean | null
          lookup_key?: string | null
          metadata?: Json | null
          nickname?: string | null
          recurring?: Json | null
          stripe_product_id: string
          tax_behavior?: Database["public"]["Enums"]["tax_behavior"] | null
          ticket_definition_id?: string | null
          tiers_mode?: string | null
          transform_quantity?: Json | null
          type?: Database["public"]["Enums"]["price_type"] | null
          unit_amount?: number | null
          unit_amount_decimal?: number | null
          vas_id?: string | null
        }
        Update: {
          active?: boolean
          billing_scheme?: Database["public"]["Enums"]["billing_scheme"] | null
          created?: string | null
          created_at?: string
          currency?: string
          id?: string
          livemode?: boolean | null
          lookup_key?: string | null
          metadata?: Json | null
          nickname?: string | null
          recurring?: Json | null
          stripe_product_id?: string
          tax_behavior?: Database["public"]["Enums"]["tax_behavior"] | null
          ticket_definition_id?: string | null
          tiers_mode?: string | null
          transform_quantity?: Json | null
          type?: Database["public"]["Enums"]["price_type"] | null
          unit_amount?: number | null
          unit_amount_decimal?: number | null
          vas_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_prices_stripe_product_id_fkey"
            columns: ["stripe_product_id"]
            isOneToOne: false
            referencedRelation: "stripe_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_prices_ticket_definition_id_fkey"
            columns: ["ticket_definition_id"]
            isOneToOne: true
            referencedRelation: "ticket_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_prices_vas_id_fkey"
            columns: ["vas_id"]
            isOneToOne: false
            referencedRelation: "value_added_services"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_products: {
        Row: {
          active: boolean
          created: string | null
          created_at: string
          default_price_id: string | null
          description: string | null
          event_id: string | null
          id: string
          livemode: boolean | null
          metadata: Json | null
          name: string
          tax_code_id: string | null
          updated: string | null
          vas_id: string | null
        }
        Insert: {
          active: boolean
          created?: string | null
          created_at?: string
          default_price_id?: string | null
          description?: string | null
          event_id?: string | null
          id: string
          livemode?: boolean | null
          metadata?: Json | null
          name: string
          tax_code_id?: string | null
          updated?: string | null
          vas_id?: string | null
        }
        Update: {
          active?: boolean
          created?: string | null
          created_at?: string
          default_price_id?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          livemode?: boolean | null
          metadata?: Json | null
          name?: string
          tax_code_id?: string | null
          updated?: string | null
          vas_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_default_price"
            columns: ["default_price_id"]
            isOneToOne: true
            referencedRelation: "stripe_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_products_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_products_tax_code_id_fkey"
            columns: ["tax_code_id"]
            isOneToOne: false
            referencedRelation: "stripe_tax_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_products_vas_id_fkey"
            columns: ["vas_id"]
            isOneToOne: false
            referencedRelation: "value_added_services"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_promotion_codes: {
        Row: {
          active: boolean
          code: string
          coupon_id: string
          created: string | null
          created_at: string
          expires_at: string | null
          id: string
          max_redemptions: number | null
          metadata: Json | null
          stripe_customer_id: string | null
          times_redeemed: number
        }
        Insert: {
          active: boolean
          code: string
          coupon_id: string
          created?: string | null
          created_at?: string
          expires_at?: string | null
          id: string
          max_redemptions?: number | null
          metadata?: Json | null
          stripe_customer_id?: string | null
          times_redeemed?: number
        }
        Update: {
          active?: boolean
          code?: string
          coupon_id?: string
          created?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          max_redemptions?: number | null
          metadata?: Json | null
          stripe_customer_id?: string | null
          times_redeemed?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_promo_codes_stripe_customer"
            columns: ["stripe_customer_id"]
            isOneToOne: false
            referencedRelation: "stripe_customers"
            referencedColumns: ["stripe_customer_id_text"]
          },
          {
            foreignKeyName: "stripe_promotion_codes_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "stripe_coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_quote_line_items: {
        Row: {
          amount_subtotal: number | null
          amount_total: number | null
          created_at: string
          currency: string | null
          description: string | null
          discounts: Json | null
          id: string
          price_id: string | null
          product_id: string | null
          quantity: number | null
          quote_id: string
          taxes: Json | null
        }
        Insert: {
          amount_subtotal?: number | null
          amount_total?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          discounts?: Json | null
          id: string
          price_id?: string | null
          product_id?: string | null
          quantity?: number | null
          quote_id: string
          taxes?: Json | null
        }
        Update: {
          amount_subtotal?: number | null
          amount_total?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          discounts?: Json | null
          id?: string
          price_id?: string | null
          product_id?: string | null
          quantity?: number | null
          quote_id?: string
          taxes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_quote_line_items_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "stripe_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_quote_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stripe_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "stripe_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_quotes: {
        Row: {
          amount_subtotal: number | null
          amount_total: number | null
          automatic_tax: Json | null
          collection_method:
            | Database["public"]["Enums"]["collection_method"]
            | null
          computed: Json | null
          created: string | null
          created_at: string
          currency: string | null
          description: string | null
          expires_at: string | null
          footer: string | null
          from_quote_id: string | null
          header: string | null
          id: string
          invoice_id: string | null
          invoice_settings: Json | null
          livemode: boolean | null
          metadata: Json | null
          number: string | null
          status: Database["public"]["Enums"]["quote_status"] | null
          status_transitions: Json | null
          stripe_customer_id: string | null
          test_clock_id: string | null
          total_details: Json | null
          transfer_data: Json | null
        }
        Insert: {
          amount_subtotal?: number | null
          amount_total?: number | null
          automatic_tax?: Json | null
          collection_method?:
            | Database["public"]["Enums"]["collection_method"]
            | null
          computed?: Json | null
          created?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          expires_at?: string | null
          footer?: string | null
          from_quote_id?: string | null
          header?: string | null
          id: string
          invoice_id?: string | null
          invoice_settings?: Json | null
          livemode?: boolean | null
          metadata?: Json | null
          number?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          status_transitions?: Json | null
          stripe_customer_id?: string | null
          test_clock_id?: string | null
          total_details?: Json | null
          transfer_data?: Json | null
        }
        Update: {
          amount_subtotal?: number | null
          amount_total?: number | null
          automatic_tax?: Json | null
          collection_method?:
            | Database["public"]["Enums"]["collection_method"]
            | null
          computed?: Json | null
          created?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          expires_at?: string | null
          footer?: string | null
          from_quote_id?: string | null
          header?: string | null
          id?: string
          invoice_id?: string | null
          invoice_settings?: Json | null
          livemode?: boolean | null
          metadata?: Json | null
          number?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          status_transitions?: Json | null
          stripe_customer_id?: string | null
          test_clock_id?: string | null
          total_details?: Json | null
          transfer_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_quote_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "stripe_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_quotes_from_quote_id_fkey"
            columns: ["from_quote_id"]
            isOneToOne: false
            referencedRelation: "stripe_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_quotes_stripe_customer_id_fkey"
            columns: ["stripe_customer_id"]
            isOneToOne: false
            referencedRelation: "stripe_customers"
            referencedColumns: ["stripe_customer_id_text"]
          },
        ]
      }
      stripe_tax_codes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      stripe_tax_rates: {
        Row: {
          active: boolean
          country: string | null
          created: string | null
          created_at: string
          description: string | null
          display_name: string
          id: string
          inclusive: boolean
          jurisdiction: string | null
          metadata: Json | null
          percentage: number
          state: string | null
          tax_type: string | null
        }
        Insert: {
          active: boolean
          country?: string | null
          created?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          id: string
          inclusive?: boolean
          jurisdiction?: string | null
          metadata?: Json | null
          percentage: number
          state?: string | null
          tax_type?: string | null
        }
        Update: {
          active?: boolean
          country?: string | null
          created?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          inclusive?: boolean
          jurisdiction?: string | null
          metadata?: Json | null
          percentage?: number
          state?: string | null
          tax_type?: string | null
        }
        Relationships: []
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
            referencedRelation: "events"
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
      [_ in never]: never
    }
    Functions: {
      refresh_event_days: {
        Args: { parent_id: string }
        Returns: undefined
      }
    }
    Enums: {
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
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
