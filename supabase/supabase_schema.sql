

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE TYPE "public"."stripe_order_status" AS ENUM (
    'pending',
    'completed',
    'canceled'
);


ALTER TYPE "public"."stripe_order_status" OWNER TO "postgres";


CREATE TYPE "public"."stripe_subscription_status" AS ENUM (
    'not_started',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
);


ALTER TYPE "public"."stripe_subscription_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_event_days"("parent_id" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_date DATE;
  day_number INTEGER := 1;
  day_name TEXT;
BEGIN
  -- Delete existing days for this event
  DELETE FROM event_days WHERE event_id = parent_id;
  
  -- Only continue if this is a multi-day event
  IF EXISTS (SELECT 1 FROM events WHERE id = parent_id AND is_multi_day = TRUE) THEN
    -- For each distinct date in child events, create a day record
    FOR current_date IN 
      SELECT DISTINCT date FROM events 
      WHERE parent_event_id = parent_id
      ORDER BY date
    LOOP
      -- Create day name based on day number and date
      day_name := 'Day ' || day_number || ' - ' || to_char(current_date, 'FMDay, FMMonth DD');
      
      -- Insert the day
      INSERT INTO event_days (event_id, date, day_number, name)
      VALUES (parent_id, current_date, day_number, day_name);
      
      day_number := day_number + 1;
    END LOOP;
  END IF;
END;
$$;


ALTER FUNCTION "public"."refresh_event_days"("parent_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_parent_event_date_range"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  min_date DATE;
  max_date DATE;
  day_count INTEGER;
  parent_id TEXT;
BEGIN
  -- Only run for child events with parent_event_id
  IF NEW.parent_event_id IS NOT NULL THEN
    parent_id := NEW.parent_event_id;
    
    -- Calculate min and max dates across all child events
    SELECT MIN(date), MAX(date) 
    INTO min_date, max_date
    FROM events 
    WHERE parent_event_id = parent_id;
    
    -- Count distinct days
    SELECT COUNT(DISTINCT date)
    INTO day_count
    FROM events
    WHERE parent_event_id = parent_id;
    
    -- Update parent event dates and multi-day flag
    UPDATE events
    SET 
      date = min_date,
      end_date = max_date,
      is_multi_day = (day_count > 1)
    WHERE id = parent_id;
    
    -- Ensure days table is updated
    PERFORM refresh_event_days(parent_id);
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_parent_event_date_range"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."attendee_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "mason_id" "uuid",
    "guest_id" "uuid",
    "attendee_type" "text" NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "attendee_links_attendee_type_check" CHECK (("attendee_type" = ANY (ARRAY['mason'::"text", 'guest'::"text"]))),
    CONSTRAINT "chk_mason_or_guest" CHECK (((("mason_id" IS NOT NULL) AND ("guest_id" IS NULL) AND ("attendee_type" = 'mason'::"text")) OR (("mason_id" IS NULL) AND ("guest_id" IS NOT NULL) AND ("attendee_type" = 'guest'::"text"))))
);


ALTER TABLE "public"."attendee_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendee_ticket_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "attendee_link_id" "uuid" NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "ticket_definition_id" "uuid" NOT NULL,
    "price_at_assignment" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."attendee_ticket_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_days" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_id" "text" NOT NULL,
    "date" "date" NOT NULL,
    "day_number" integer NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_days" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "text" NOT NULL,
    "parent_event_id" "text",
    "title" "text" NOT NULL,
    "day" "text",
    "date" "date",
    "time" "text",
    "location" "text",
    "description" "text",
    "type" "text",
    "price" numeric,
    "is_purchasable_individually" boolean DEFAULT true,
    "maxAttendees" bigint,
    "featured" boolean DEFAULT false,
    "imageUrl" "text",
    "event_includes" "text"[],
    "important_information" "text"[],
    "latitude" numeric,
    "longitude" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_date" "date",
    "start_time" time without time zone,
    "end_time" time without time zone,
    "is_multi_day" boolean DEFAULT false
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."event_schedule" AS
 WITH "event_with_days" AS (
         SELECT "e_1"."id",
            "e_1"."parent_event_id",
            "e_1"."title",
            "e_1"."day",
            "e_1"."date",
            "e_1"."time",
            "e_1"."location",
            "e_1"."description",
            "e_1"."type",
            "e_1"."price",
            "e_1"."is_purchasable_individually",
            "e_1"."maxAttendees",
            "e_1"."featured",
            "e_1"."imageUrl",
            "e_1"."event_includes",
            "e_1"."important_information",
            "e_1"."latitude",
            "e_1"."longitude",
            "e_1"."created_at",
            "e_1"."end_date",
            "e_1"."start_time",
            "e_1"."end_time",
            "e_1"."is_multi_day",
            "d"."id" AS "day_id",
            "d"."day_number",
            "d"."name" AS "day_name"
           FROM ("public"."events" "e_1"
             LEFT JOIN "public"."event_days" "d" ON ((("e_1"."parent_event_id" = "d"."event_id") AND ("e_1"."date" = "d"."date"))))
          WHERE ("e_1"."parent_event_id" IS NOT NULL)
        )
 SELECT "e"."id",
    "e"."title",
    "e"."description",
    "e"."date",
    "e"."start_time",
    "e"."end_time",
    "e"."location",
    "e"."type",
    "e"."day_id",
    "e"."day_number",
    "e"."day_name",
    "p"."id" AS "parent_id",
    "p"."title" AS "parent_title",
    "p"."is_multi_day"
   FROM ("event_with_days" "e"
     JOIN "public"."events" "p" ON (("e"."parent_event_id" = "p"."id")))
  ORDER BY "p"."id", "e"."date", "e"."start_time";


ALTER TABLE "public"."event_schedule" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_vas_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "text" NOT NULL,
    "vas_id" "text" NOT NULL,
    "price_override" numeric
);


ALTER TABLE "public"."event_vas_options" OWNER TO "postgres";


COMMENT ON TABLE "public"."event_vas_options" IS 'Optional VAS items offered when selecting a specific individual event ticket.';



COMMENT ON COLUMN "public"."event_vas_options"."price_override" IS 'Specific price for this VAS when added via this event (overrides base price if set).';



CREATE TABLE IF NOT EXISTS "public"."grand_lodges" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "country" "text",
    "abbreviation" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."grand_lodges" OWNER TO "postgres";


COMMENT ON TABLE "public"."grand_lodges" IS 'Stores details about Grand Lodges.';



CREATE TABLE IF NOT EXISTS "public"."guests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "guest_type" "text" NOT NULL,
    "title" "text",
    "first_name" "text",
    "last_name" "text",
    "phone" "text",
    "email" "text",
    "dietary_requirements" "text",
    "special_needs" "text",
    "contact_preference" "text",
    "contact_confirmed" boolean DEFAULT false,
    "partner_relationship" "text",
    "related_mason_id" "uuid",
    "related_guest_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_related_id_for_partner" CHECK (((("guest_type" = 'lady_partner'::"text") AND ("related_mason_id" IS NOT NULL) AND ("related_guest_id" IS NULL)) OR (("guest_type" = 'guest_partner'::"text") AND ("related_mason_id" IS NULL) AND ("related_guest_id" IS NOT NULL)) OR (("guest_type" = 'guest'::"text") AND ("related_mason_id" IS NULL) AND ("related_guest_id" IS NULL)))),
    CONSTRAINT "chk_relationship_for_partner" CHECK (((("guest_type" = ANY (ARRAY['lady_partner'::"text", 'guest_partner'::"text"])) AND ("partner_relationship" IS NOT NULL)) OR (("guest_type" = 'guest'::"text") AND ("partner_relationship" IS NULL)))),
    CONSTRAINT "guests_guest_type_check" CHECK (("guest_type" = ANY (ARRAY['guest'::"text", 'lady_partner'::"text", 'guest_partner'::"text"])))
);


ALTER TABLE "public"."guests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lodges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "grand_lodge_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "number" "text",
    "display_name" "text",
    "district" "text",
    "meeting_place" "text",
    "area_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lodges" OWNER TO "postgres";


COMMENT ON TABLE "public"."lodges" IS 'Stores details about individual Lodges.';



COMMENT ON COLUMN "public"."lodges"."grand_lodge_id" IS 'Link to the parent Grand Lodge.';



CREATE TABLE IF NOT EXISTS "public"."masons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text",
    "first_name" "text",
    "last_name" "text",
    "phone" "text",
    "email" "text",
    "dietary_requirements" "text",
    "special_needs" "text",
    "rank" "text",
    "grand_rank" "text",
    "grand_officer" "text",
    "grand_office" "text",
    "grand_office_other" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lodge_id" "uuid",
    "grand_lodge_id" "text"
);


ALTER TABLE "public"."masons" OWNER TO "postgres";


COMMENT ON COLUMN "public"."masons"."lodge_id" IS 'Foreign key referencing the specific Lodge.';



COMMENT ON COLUMN "public"."masons"."grand_lodge_id" IS 'Foreign key referencing the Grand Lodge.';



CREATE TABLE IF NOT EXISTS "public"."package_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "package_id" "text" NOT NULL,
    "event_id" "text" NOT NULL
);


ALTER TABLE "public"."package_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."package_vas_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "package_id" "text" NOT NULL,
    "vas_id" "text" NOT NULL,
    "price_override" numeric
);


ALTER TABLE "public"."package_vas_options" OWNER TO "postgres";


COMMENT ON TABLE "public"."package_vas_options" IS 'Optional VAS items offered when selecting a specific package.';



COMMENT ON COLUMN "public"."package_vas_options"."price_override" IS 'Specific price for this VAS when added via this package (overrides base price if set).';



CREATE TABLE IF NOT EXISTS "public"."packages" (
    "id" "text" NOT NULL,
    "parent_event_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "includes_description" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registration_vas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "vas_id" "text" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "price_at_purchase" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "registration_vas_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."registration_vas" OWNER TO "postgres";


COMMENT ON TABLE "public"."registration_vas" IS 'Records the specific VAS items chosen and added to a Registration.';



COMMENT ON COLUMN "public"."registration_vas"."price_at_purchase" IS 'The actual price paid for this VAS item in this registration.';



CREATE TABLE IF NOT EXISTS "public"."registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_event_id" "text" NOT NULL,
    "registration_type" "text" NOT NULL,
    "total_price_paid" numeric,
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "agree_to_terms" boolean DEFAULT false NOT NULL,
    "stripe_payment_intent_id" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "billing_first_name" "text",
    "billing_last_name" "text",
    "billing_business_name" "text",
    "billing_email" "text",
    "billing_phone" "text",
    "billing_address_line1" "text",
    "billing_address_line2" "text",
    "billing_city" "text",
    "billing_state" "text",
    "billing_postal_code" "text",
    "billing_country" "text"
);


ALTER TABLE "public"."registrations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."registrations"."billing_first_name" IS 'First name provided for billing at time of registration.';



COMMENT ON COLUMN "public"."registrations"."billing_last_name" IS 'Last name provided for billing at time of registration.';



COMMENT ON COLUMN "public"."registrations"."billing_business_name" IS 'Optional business name provided for billing.';



COMMENT ON COLUMN "public"."registrations"."billing_email" IS 'Email provided for billing at time of registration.';



COMMENT ON COLUMN "public"."registrations"."billing_phone" IS 'Phone provided for billing at time of registration.';



COMMENT ON COLUMN "public"."registrations"."billing_address_line1" IS 'Address Line 1 provided for billing.';



COMMENT ON COLUMN "public"."registrations"."billing_address_line2" IS 'Address Line 2 provided for billing.';



COMMENT ON COLUMN "public"."registrations"."billing_city" IS 'City provided for billing.';



COMMENT ON COLUMN "public"."registrations"."billing_state" IS 'State/Province/Territory provided for billing.';



COMMENT ON COLUMN "public"."registrations"."billing_postal_code" IS 'Postal code provided for billing.';



COMMENT ON COLUMN "public"."registrations"."billing_country" IS 'Country provided for billing.';



CREATE TABLE IF NOT EXISTS "public"."stripe_customers" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "customer_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."stripe_customers" OWNER TO "postgres";


ALTER TABLE "public"."stripe_customers" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."stripe_customers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."stripe_orders" (
    "id" bigint NOT NULL,
    "checkout_session_id" "text" NOT NULL,
    "payment_intent_id" "text" NOT NULL,
    "customer_id" "text" NOT NULL,
    "amount_subtotal" bigint NOT NULL,
    "amount_total" bigint NOT NULL,
    "currency" "text" NOT NULL,
    "payment_status" "text" NOT NULL,
    "status" "public"."stripe_order_status" DEFAULT 'pending'::"public"."stripe_order_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."stripe_orders" OWNER TO "postgres";


ALTER TABLE "public"."stripe_orders" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."stripe_orders_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."stripe_subscriptions" (
    "id" bigint NOT NULL,
    "customer_id" "text" NOT NULL,
    "subscription_id" "text",
    "price_id" "text",
    "current_period_start" bigint,
    "current_period_end" bigint,
    "cancel_at_period_end" boolean DEFAULT false,
    "payment_method_brand" "text",
    "payment_method_last4" "text",
    "status" "public"."stripe_subscription_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."stripe_subscriptions" OWNER TO "postgres";


ALTER TABLE "public"."stripe_subscriptions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."stripe_subscriptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."stripe_user_orders" WITH ("security_invoker"='true') AS
 SELECT "c"."customer_id",
    "o"."id" AS "order_id",
    "o"."checkout_session_id",
    "o"."payment_intent_id",
    "o"."amount_subtotal",
    "o"."amount_total",
    "o"."currency",
    "o"."payment_status",
    "o"."status" AS "order_status",
    "o"."created_at" AS "order_date"
   FROM ("public"."stripe_customers" "c"
     LEFT JOIN "public"."stripe_orders" "o" ON (("c"."customer_id" = "o"."customer_id")))
  WHERE (("c"."user_id" = "auth"."uid"()) AND ("c"."deleted_at" IS NULL) AND ("o"."deleted_at" IS NULL));


ALTER TABLE "public"."stripe_user_orders" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."stripe_user_subscriptions" WITH ("security_invoker"='true') AS
 SELECT "c"."customer_id",
    "s"."subscription_id",
    "s"."status" AS "subscription_status",
    "s"."price_id",
    "s"."current_period_start",
    "s"."current_period_end",
    "s"."cancel_at_period_end",
    "s"."payment_method_brand",
    "s"."payment_method_last4"
   FROM ("public"."stripe_customers" "c"
     LEFT JOIN "public"."stripe_subscriptions" "s" ON (("c"."customer_id" = "s"."customer_id")))
  WHERE (("c"."user_id" = "auth"."uid"()) AND ("c"."deleted_at" IS NULL) AND ("s"."deleted_at" IS NULL));


ALTER TABLE "public"."stripe_user_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_definitions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "package_id" "text",
    "event_id" "text",
    "name" "text" NOT NULL,
    "price" numeric NOT NULL,
    "description" "text",
    "eligibility_attendee_types" "text"[],
    "eligibility_mason_rank" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_package_or_event" CHECK (((("package_id" IS NOT NULL) AND ("event_id" IS NULL)) OR (("package_id" IS NULL) AND ("event_id" IS NOT NULL))))
);


ALTER TABLE "public"."ticket_definitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."value_added_services" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric NOT NULL,
    "type" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."value_added_services" OWNER TO "postgres";


COMMENT ON TABLE "public"."value_added_services" IS 'Defines available Value-Added Services (merchandise, donations, etc.).';



ALTER TABLE ONLY "public"."attendee_links"
    ADD CONSTRAINT "attendee_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendee_ticket_assignments"
    ADD CONSTRAINT "attendee_ticket_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_days"
    ADD CONSTRAINT "event_days_event_id_date_key" UNIQUE ("event_id", "date");



ALTER TABLE ONLY "public"."event_days"
    ADD CONSTRAINT "event_days_event_id_day_number_key" UNIQUE ("event_id", "day_number");



ALTER TABLE ONLY "public"."event_days"
    ADD CONSTRAINT "event_days_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_vas_options"
    ADD CONSTRAINT "event_vas_options_event_id_vas_id_key" UNIQUE ("event_id", "vas_id");



ALTER TABLE ONLY "public"."event_vas_options"
    ADD CONSTRAINT "event_vas_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grand_lodges"
    ADD CONSTRAINT "grand_lodges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guests"
    ADD CONSTRAINT "guests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lodges"
    ADD CONSTRAINT "lodges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."masons"
    ADD CONSTRAINT "masons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."package_events"
    ADD CONSTRAINT "package_events_package_id_event_id_key" UNIQUE ("package_id", "event_id");



ALTER TABLE ONLY "public"."package_events"
    ADD CONSTRAINT "package_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."package_vas_options"
    ADD CONSTRAINT "package_vas_options_package_id_vas_id_key" UNIQUE ("package_id", "vas_id");



ALTER TABLE ONLY "public"."package_vas_options"
    ADD CONSTRAINT "package_vas_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registration_vas"
    ADD CONSTRAINT "registration_vas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_customer_id_key" UNIQUE ("customer_id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."stripe_orders"
    ADD CONSTRAINT "stripe_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_customer_id_key" UNIQUE ("customer_id");



ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_definitions"
    ADD CONSTRAINT "ticket_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."value_added_services"
    ADD CONSTRAINT "value_added_services_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_assignments_attendee_link" ON "public"."attendee_ticket_assignments" USING "btree" ("attendee_link_id");



CREATE INDEX "idx_assignments_definition" ON "public"."attendee_ticket_assignments" USING "btree" ("ticket_definition_id");



CREATE INDEX "idx_assignments_registration" ON "public"."attendee_ticket_assignments" USING "btree" ("registration_id");



CREATE INDEX "idx_attendee_links_guest" ON "public"."attendee_links" USING "btree" ("guest_id");



CREATE INDEX "idx_attendee_links_mason" ON "public"."attendee_links" USING "btree" ("mason_id");



CREATE INDEX "idx_attendee_links_registration" ON "public"."attendee_links" USING "btree" ("registration_id");



CREATE INDEX "idx_events_parent_event_id" ON "public"."events" USING "btree" ("parent_event_id");



CREATE INDEX "idx_guests_related_guest" ON "public"."guests" USING "btree" ("related_guest_id");



CREATE INDEX "idx_guests_related_mason" ON "public"."guests" USING "btree" ("related_mason_id");



CREATE INDEX "idx_lodges_grand_lodge" ON "public"."lodges" USING "btree" ("grand_lodge_id");



CREATE INDEX "idx_masons_grand_lodge" ON "public"."masons" USING "btree" ("grand_lodge_id");



CREATE INDEX "idx_masons_lodge" ON "public"."masons" USING "btree" ("lodge_id");



CREATE INDEX "idx_registration_vas_reg" ON "public"."registration_vas" USING "btree" ("registration_id");



CREATE INDEX "idx_registration_vas_vas" ON "public"."registration_vas" USING "btree" ("vas_id");



CREATE INDEX "idx_ticket_definitions_event" ON "public"."ticket_definitions" USING "btree" ("event_id");



CREATE INDEX "idx_ticket_definitions_package" ON "public"."ticket_definitions" USING "btree" ("package_id");



CREATE OR REPLACE TRIGGER "event_date_range_trigger" AFTER INSERT OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."update_parent_event_date_range"();



ALTER TABLE ONLY "public"."attendee_links"
    ADD CONSTRAINT "attendee_links_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendee_links"
    ADD CONSTRAINT "attendee_links_mason_id_fkey" FOREIGN KEY ("mason_id") REFERENCES "public"."masons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendee_links"
    ADD CONSTRAINT "attendee_links_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendee_ticket_assignments"
    ADD CONSTRAINT "attendee_ticket_assignments_attendee_link_id_fkey" FOREIGN KEY ("attendee_link_id") REFERENCES "public"."attendee_links"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendee_ticket_assignments"
    ADD CONSTRAINT "attendee_ticket_assignments_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendee_ticket_assignments"
    ADD CONSTRAINT "attendee_ticket_assignments_ticket_definition_id_fkey" FOREIGN KEY ("ticket_definition_id") REFERENCES "public"."ticket_definitions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."event_days"
    ADD CONSTRAINT "event_days_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_vas_options"
    ADD CONSTRAINT "event_vas_options_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_vas_options"
    ADD CONSTRAINT "event_vas_options_vas_id_fkey" FOREIGN KEY ("vas_id") REFERENCES "public"."value_added_services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_parent_event_id_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."guests"
    ADD CONSTRAINT "guests_related_guest_id_fkey" FOREIGN KEY ("related_guest_id") REFERENCES "public"."guests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."guests"
    ADD CONSTRAINT "guests_related_mason_id_fkey" FOREIGN KEY ("related_mason_id") REFERENCES "public"."masons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lodges"
    ADD CONSTRAINT "lodges_grand_lodge_id_fkey" FOREIGN KEY ("grand_lodge_id") REFERENCES "public"."grand_lodges"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."masons"
    ADD CONSTRAINT "masons_grand_lodge_id_fkey" FOREIGN KEY ("grand_lodge_id") REFERENCES "public"."grand_lodges"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."masons"
    ADD CONSTRAINT "masons_lodge_id_fkey" FOREIGN KEY ("lodge_id") REFERENCES "public"."lodges"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."package_events"
    ADD CONSTRAINT "package_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."package_events"
    ADD CONSTRAINT "package_events_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."package_vas_options"
    ADD CONSTRAINT "package_vas_options_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."package_vas_options"
    ADD CONSTRAINT "package_vas_options_vas_id_fkey" FOREIGN KEY ("vas_id") REFERENCES "public"."value_added_services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_parent_event_id_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registration_vas"
    ADD CONSTRAINT "registration_vas_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registration_vas"
    ADD CONSTRAINT "registration_vas_vas_id_fkey" FOREIGN KEY ("vas_id") REFERENCES "public"."value_added_services"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_parent_event_id_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "public"."events"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ticket_definitions"
    ADD CONSTRAINT "ticket_definitions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_definitions"
    ADD CONSTRAINT "ticket_definitions_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE CASCADE;



CREATE POLICY "Allow public read access to VAS" ON "public"."value_added_services" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to event VAS options" ON "public"."event_vas_options" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to events" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to grand lodges" ON "public"."grand_lodges" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to lodges" ON "public"."lodges" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to package VAS options" ON "public"."package_vas_options" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to package_events" ON "public"."package_events" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to packages" ON "public"."packages" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to ticket_definitions" ON "public"."ticket_definitions" FOR SELECT USING (true);



CREATE POLICY "Anyone can view event days" ON "public"."event_days" FOR SELECT USING (true);



CREATE POLICY "Anyone can view events with parent-child relationships" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Users can view their own customer data" ON "public"."stripe_customers" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND ("deleted_at" IS NULL)));



CREATE POLICY "Users can view their own order data" ON "public"."stripe_orders" FOR SELECT TO "authenticated" USING ((("customer_id" IN ( SELECT "stripe_customers"."customer_id"
   FROM "public"."stripe_customers"
  WHERE (("stripe_customers"."user_id" = "auth"."uid"()) AND ("stripe_customers"."deleted_at" IS NULL)))) AND ("deleted_at" IS NULL)));



CREATE POLICY "Users can view their own subscription data" ON "public"."stripe_subscriptions" FOR SELECT TO "authenticated" USING ((("customer_id" IN ( SELECT "stripe_customers"."customer_id"
   FROM "public"."stripe_customers"
  WHERE (("stripe_customers"."user_id" = "auth"."uid"()) AND ("stripe_customers"."deleted_at" IS NULL)))) AND ("deleted_at" IS NULL)));



ALTER TABLE "public"."attendee_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendee_ticket_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_days" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_vas_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grand_lodges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."guests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lodges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."masons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."package_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."package_vas_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registration_vas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_definitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."value_added_services" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
































































































































































































































































































GRANT ALL ON FUNCTION "public"."refresh_event_days"("parent_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_event_days"("parent_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_event_days"("parent_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_parent_event_date_range"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_parent_event_date_range"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_parent_event_date_range"() TO "service_role";





















GRANT ALL ON TABLE "public"."attendee_links" TO "anon";
GRANT ALL ON TABLE "public"."attendee_links" TO "authenticated";
GRANT ALL ON TABLE "public"."attendee_links" TO "service_role";



GRANT ALL ON TABLE "public"."attendee_ticket_assignments" TO "anon";
GRANT ALL ON TABLE "public"."attendee_ticket_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."attendee_ticket_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."event_days" TO "anon";
GRANT ALL ON TABLE "public"."event_days" TO "authenticated";
GRANT ALL ON TABLE "public"."event_days" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."event_schedule" TO "anon";
GRANT ALL ON TABLE "public"."event_schedule" TO "authenticated";
GRANT ALL ON TABLE "public"."event_schedule" TO "service_role";



GRANT ALL ON TABLE "public"."event_vas_options" TO "anon";
GRANT ALL ON TABLE "public"."event_vas_options" TO "authenticated";
GRANT ALL ON TABLE "public"."event_vas_options" TO "service_role";



GRANT ALL ON TABLE "public"."grand_lodges" TO "anon";
GRANT ALL ON TABLE "public"."grand_lodges" TO "authenticated";
GRANT ALL ON TABLE "public"."grand_lodges" TO "service_role";



GRANT ALL ON TABLE "public"."guests" TO "anon";
GRANT ALL ON TABLE "public"."guests" TO "authenticated";
GRANT ALL ON TABLE "public"."guests" TO "service_role";



GRANT ALL ON TABLE "public"."lodges" TO "anon";
GRANT ALL ON TABLE "public"."lodges" TO "authenticated";
GRANT ALL ON TABLE "public"."lodges" TO "service_role";



GRANT ALL ON TABLE "public"."masons" TO "anon";
GRANT ALL ON TABLE "public"."masons" TO "authenticated";
GRANT ALL ON TABLE "public"."masons" TO "service_role";



GRANT ALL ON TABLE "public"."package_events" TO "anon";
GRANT ALL ON TABLE "public"."package_events" TO "authenticated";
GRANT ALL ON TABLE "public"."package_events" TO "service_role";



GRANT ALL ON TABLE "public"."package_vas_options" TO "anon";
GRANT ALL ON TABLE "public"."package_vas_options" TO "authenticated";
GRANT ALL ON TABLE "public"."package_vas_options" TO "service_role";



GRANT ALL ON TABLE "public"."packages" TO "anon";
GRANT ALL ON TABLE "public"."packages" TO "authenticated";
GRANT ALL ON TABLE "public"."packages" TO "service_role";



GRANT ALL ON TABLE "public"."registration_vas" TO "anon";
GRANT ALL ON TABLE "public"."registration_vas" TO "authenticated";
GRANT ALL ON TABLE "public"."registration_vas" TO "service_role";



GRANT ALL ON TABLE "public"."registrations" TO "anon";
GRANT ALL ON TABLE "public"."registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."registrations" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_customers" TO "anon";
GRANT ALL ON TABLE "public"."stripe_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_customers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."stripe_customers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stripe_customers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stripe_customers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_orders" TO "anon";
GRANT ALL ON TABLE "public"."stripe_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."stripe_orders_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stripe_orders_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stripe_orders_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."stripe_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_subscriptions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."stripe_subscriptions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stripe_subscriptions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stripe_subscriptions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_user_orders" TO "anon";
GRANT ALL ON TABLE "public"."stripe_user_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_user_orders" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."stripe_user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_user_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_definitions" TO "anon";
GRANT ALL ON TABLE "public"."ticket_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_definitions" TO "service_role";



GRANT ALL ON TABLE "public"."value_added_services" TO "anon";
GRANT ALL ON TABLE "public"."value_added_services" TO "authenticated";
GRANT ALL ON TABLE "public"."value_added_services" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
