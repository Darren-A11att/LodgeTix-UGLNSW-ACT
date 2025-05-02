# Prompt Template for Remaining LodgeTix-Supabase Integration Steps

## What I Need

Create detailed implementation prompts for each of the following remaining steps in the LodgeTix-Supabase integration:

1. **Step 14: Ticket Selection and Management**
   - Functionality to fetch ticket types from Supabase
   - UI for selecting tickets for different attendee types
   - Managing ticket quantities and options

2. **Step 15: Order Summary Implementation**
   - Creating a comprehensive order review system
   - Calculating totals based on selected tickets
   - Managing discounts and special pricing

3. **Step 16: Payment Integration**
   - Integrating a payment processing system
   - Handling payment statuses
   - Storing payment records in Supabase

4. **Step 17: Confirmation and Receipts**
   - Generating confirmation screens
   - Creating PDF receipts/tickets
   - Sending confirmation emails via Supabase functions

5. **Step 18: Admin Dashboard - Registration Management**
   - Building an admin interface to view and manage registrations
   - Implementing filtering and search functionality
   - Creating status updates for registrations

## Instructions for Creating Each Prompt

For each step, please:

1. **Thoroughly analyze the codebase**:
   - Explore the relevant components in `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT`
   - Review existing implementations of similar features
   - Understand the state management approaches used
   - Identify the UI components and patterns

2. **Examine the Supabase database**:
   - Connect to Supabase project ID: `pwwpcjbbxotmiqrisjvf`
   - Analyze relevant tables and relationships
   - Understand the data model for the feature
   - Review any existing Supabase API calls

3. **Create a detailed implementation prompt** with the following structure:

### Step X: [Step Title]

**Context for the Agentic AI Software Engineer**
[Provide background about this step based on your actual analysis of the codebase and database. Explain how it fits into the overall system and what specific challenges it addresses.]

**Objective**
[Clearly state the goals of this implementation step, being specific about what functionality will be created.]

**Pre-requisites**
- [List previous steps that must be completed first]
- [Include specific components or concepts that should be understood]
- [Reference any third-party libraries or tools required]

**Analysis Steps**
1. [Detail specific code files to examine]
2. [Explain key database tables to understand]
3. [Outline UI/UX flows to analyze]
4. [Include any state management considerations]

**Implementation Steps**
1. [Provide specific implementation tasks with file paths based on the actual codebase]
2. [Explain how to integrate with existing components]
3. [Detail necessary database operations with specific table names]
4. [Outline UI component updates needed]
5. [Address error handling and edge cases]

**Testing Steps**
1. [List specific test scenarios based on the actual feature requirements]
2. [Include edge cases informed by the existing codebase patterns]
3. [Detail UI/UX aspects to test]
4. [Specify database integrity tests]

**Verification Checklist**
- [ ] [List specific criteria that indicate successful implementation]
- [ ] [Include UI behaviors to confirm]
- [ ] [Detail database states to verify]
- [ ] [Specify error handling scenarios to check]

**Common Errors and Solutions**
1. [List potential errors based on similar features in the codebase]
   - [Provide troubleshooting steps]
   - [Explain how to fix the issue]
2. [Include additional common errors]
   - [With corresponding solutions]

## Important Notes

- Base all prompts on actual code and database structure, not assumptions
- Reference specific file paths, component names, and database tables that exist in the project
- Identify patterns in error handling, state management, and UI design from the existing codebase
- Focus on guiding an implementation process rather than providing code solutions
- Consider security, performance, and user experience based on the established patterns
- Address database relationships and proper state management throughout
- Save each prompt to `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/.githubignore/development/step{number}_{step_name}.md`
