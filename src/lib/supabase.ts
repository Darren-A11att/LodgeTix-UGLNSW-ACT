import { mockAuth } from '../mock/auth';

// Mock the Supabase client with our in-memory implementation
export const supabase = {
  auth: mockAuth,
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      eq: (column: string, value: any) => ({
        is: (column: string, value: any) => ({
          maybeSingle: async () => {
            return { data: null, error: null };
          }
        }),
        maybeSingle: async () => {
          return { data: null, error: null };
        },
        order: (column: string, { ascending = true }) => ({
          async then() {
            return { data: [], error: null };
          }
        })
      }),
      order: (column: string, { ascending = true }) => ({
        async then() {
          return { data: [], error: null };
        }
      }),
      async maybeSingle() {
        return { data: null, error: null };
      }
    }),
    insert: (data: any) => ({
      async then() {
        return { data: null, error: null };
      }
    }),
    upsert: (data: any, options: any) => ({
      async then() {
        return { data: null, error: null };
      }
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        async then() {
          return { data: null, error: null };
        }
      })
    })
  })
};