# Creating Implementation Prompts for Remaining LodgeTix-Supabase Integration

I need you to create detailed implementation prompts for the remaining steps in our LodgeTix project, a ticketing and event management system for Masonic events.

## Important: Using MCP Tools for Analysis

You have access to the codebase and Supabase database through MCP tools. **Before creating each implementation prompt, you must use these tools to thoroughly analyze the existing code and database structure.**

- The codebase is located at: `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT`
- The Supabase project ID is: `pwwpcjbbxotmiqrisjvf`
- Save all created prompts to: `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/.githubignore/development/`

## How to Analyze Using MCP Tools

For each step, perform the following analysis:

1. **Explore the codebase structure**:
   ```
   list_directory "/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src"
   list_directory "/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/components"
   ```

2. **Examine relevant component files**:
   ```
   read_file "/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/components/[RELEVANT_COMPONENT].tsx"
   ```

3. **Review state management and context providers**:
   ```
   read_file "/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/context/[RELEVANT_CONTEXT].tsx"
   ```

4. **Explore database tables and structure**:
   ```
   list_tables project_id="pwwpcjbbxotmiqrisjvf"
   ```

5. **Examine specific database tables**:
   ```
   execute_sql project_id="pwwpcjbbxotmiqrisjvf" query="SELECT * FROM [TABLE_NAME] LIMIT 5"
   ```

Use these tools to understand the existing patterns, naming conventions, and data structures before writing each prompt.

## Remaining Steps to Create Prompts For:

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

## Required Prompt Format

After analyzing the codebase and database for each step, create a detailed prompt with this structure:

### Step X: [Step Title]

**Context for the Agentic AI Software Engineer**
[Provide background about this step based on your analysis of the actual codebase and database. Explain how it fits into the overall system and what specific challenges it addresses.]

**Objective**
[Clearly state the goals of this implementation step, being specific about what functionality will be created.]

**Pre-requisites**
- [List previous steps that must be completed first]
- [Include specific components or concepts that should be understood]
- [Reference any third-party libraries or tools required]

**Analysis Steps**
1. [Detail specific code files to examine - include actual file paths from the codebase]
2. [Explain key database tables to understand - reference actual tables from Supabase]
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

- Base all prompts on the actual code and database structure, not assumptions
- Reference specific file paths, component names, and database tables that exist in the project
- Identify patterns in error handling, state management, and UI design from the existing codebase
- Focus on guiding an implementation process rather than providing code solutions
- Ensure your prompts account for different types of users and their needs
- Address database relationships, proper state management, and security considerations
- Save each prompt to `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/.githubignore/development/step{number}_{step_name}.md`

Please create one prompt at a time, starting with Step 14, and show your analysis process before presenting the final prompt for each step.
