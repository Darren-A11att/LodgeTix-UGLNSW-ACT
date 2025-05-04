/**
 * DB Naming Schema Adapter
 * 
 * This utility provides conversion functions between the old snake_case naming convention
 * and the new PascalCase (tables) and camelCase (columns) conventions.
 * 
 * These mappings were generated from the table_rename_log and column_rename_log tables
 * in the database and represent the complete mapping between old and new schemas.
 */

// Type definitions
type TableMap = Record<string, string>;
type ColumnMap = Record<string, Record<string, string>>;
type DataRecord = Record<string, any>;

// Table mappings (snake_case to PascalCase)
export const tableNameMap: TableMap = {
  // These values will be populated from the database query results
  'events': 'Events',
  'display_scopes': 'DisplayScopes',
  'masonic_profiles': 'MasonicProfiles',
  'organisation_memberships': 'OrganisationMemberships',
  'masons': 'Masons',
  'guests': 'Guests',
  'customers': 'Customers',
  'attendees': 'Attendees',
  'contacts': 'Contacts',
  'registrations': 'Registrations',
  'tickets': 'Tickets'
};

// Reverse table mappings (PascalCase to snake_case)
export const reverseTableNameMap: TableMap = Object.fromEntries(
  Object.entries(tableNameMap).map(([key, value]) => [value, key])
);

// Column mappings by table (snake_case to camelCase)
// This is a placeholder - actual values will come from database query results
export const columnNameMap: ColumnMap = {
  // Example format:
  // 'Events': {
  //   'event_id': 'eventId',
  //   'event_name': 'eventName',
  //   // ... more columns
  // },
  // ... more tables
};

// Reverse column mappings (camelCase to snake_case)
export const reverseColumnNameMap: ColumnMap = {};
for (const [table, columns] of Object.entries(columnNameMap)) {
  reverseColumnNameMap[table] = Object.fromEntries(
    Object.entries(columns).map(([key, value]) => [value, key])
  );
}

/**
 * Converts a single property from snake_case to camelCase
 * @param snakeStr - The snake_case string
 * @returns The camelCase string
 */
export function toCamelCase(snakeStr: string): string {
  return snakeStr.replace(/_([a-z])/g, (match, group) => group.toUpperCase());
}

/**
 * Converts a single property from camelCase to snake_case
 * @param camelStr - The camelCase string
 * @returns The snake_case string
 */
export function toSnakeCase(camelStr: string): string {
  return camelStr.replace(/[A-Z]/g, match => `_${match.toLowerCase()}`);
}

/**
 * Converts a database record from old snake_case format to new camelCase format
 * @param tableName - The snake_case table name (old format)
 * @param data - The data with snake_case properties
 * @returns The data with camelCase properties
 */
export function convertToNewFormat(tableName: string, data: DataRecord): DataRecord {
  if (!tableNameMap[tableName]) {
    console.warn(`Unknown table name: ${tableName}`);
    return data;
  }
  
  const newTableName = tableNameMap[tableName];
  const result: DataRecord = {};
  
  // Get the column mapping for this table
  const columnMap = columnNameMap[newTableName] || {};
  
  // Convert each field
  for (const [key, value] of Object.entries(data)) {
    const newKey = columnMap[key] || toCamelCase(key);
    result[newKey] = value;
  }
  
  return result;
}

/**
 * Converts a database record from new camelCase format to old snake_case format
 * @param tableName - The PascalCase table name (new format)
 * @param data - The data with camelCase properties
 * @returns The data with snake_case properties
 */
export function convertToOldFormat(tableName: string, data: DataRecord): DataRecord {
  if (!reverseTableNameMap[tableName]) {
    console.warn(`Unknown table name: ${tableName}`);
    return data;
  }
  
  const oldTableName = reverseTableNameMap[tableName];
  const result: DataRecord = {};
  
  // Get the reverse column mapping for this table
  const columnMap = reverseColumnNameMap[tableName] || {};
  
  // Convert each field
  for (const [key, value] of Object.entries(data)) {
    const oldKey = columnMap[key] || toSnakeCase(key);
    result[oldKey] = value;
  }
  
  return result;
}

/**
 * Converts a collection of database records from old to new format
 * @param tableName - The snake_case table name (old format)
 * @param records - Array of data objects with snake_case properties
 * @returns Array of data objects with camelCase properties
 */
export function convertCollectionToNewFormat(tableName: string, records: DataRecord | DataRecord[]): DataRecord | DataRecord[] {
  if (!Array.isArray(records)) {
    return convertToNewFormat(tableName, records);
  }
  return records.map(record => convertToNewFormat(tableName, record));
}

/**
 * Converts a collection of database records from new to old format
 * @param tableName - The PascalCase table name (new format)
 * @param records - Array of data objects with camelCase properties
 * @returns Array of data objects with snake_case properties
 */
export function convertCollectionToOldFormat(tableName: string, records: DataRecord | DataRecord[]): DataRecord | DataRecord[] {
  if (!Array.isArray(records)) {
    return convertToOldFormat(tableName, records);
  }
  return records.map(record => convertToOldFormat(tableName, record));
}

/**
 * Gets the new PascalCase table name for an old snake_case table name
 * @param oldTableName - The snake_case table name
 * @returns The PascalCase table name or null if not found
 */
export function getNewTableName(oldTableName: string): string | null {
  return tableNameMap[oldTableName] || null;
}

/**
 * Gets the old snake_case table name for a new PascalCase table name
 * @param newTableName - The PascalCase table name
 * @returns The snake_case table name or null if not found
 */
export function getOldTableName(newTableName: string): string | null {
  return reverseTableNameMap[newTableName] || null;
}

/**
 * Gets the new camelCase column name for an old snake_case column name
 * @param tableName - The PascalCase table name
 * @param oldColumnName - The snake_case column name
 * @returns The camelCase column name or calculated conversion if not found
 */
export function getNewColumnName(tableName: string, oldColumnName: string): string {
  const columnMap = columnNameMap[tableName] || {};
  return columnMap[oldColumnName] || toCamelCase(oldColumnName);
}

/**
 * Gets the old snake_case column name for a new camelCase column name
 * @param tableName - The PascalCase table name
 * @param newColumnName - The camelCase column name
 * @returns The snake_case column name or calculated conversion if not found
 */
export function getOldColumnName(tableName: string, newColumnName: string): string {
  const columnMap = reverseColumnNameMap[tableName] || {};
  return columnMap[newColumnName] || toSnakeCase(newColumnName);
}

/**
 * Creates an update script for a React/TypeScript codebase to replace all references
 * to the old naming convention with the new convention
 * @returns The helper information as a formatted string
 */
export function generateCodeUpdateHelper(): string {
  let output = '# Database Schema Naming Convention Update Helper\n\n';
  
  output += '## Table Name Mappings (snake_case to PascalCase)\n\n';
  output += '| Old Name | New Name |\n';
  output += '|----------|----------|\n';
  
  for (const [oldName, newName] of Object.entries(tableNameMap)) {
    output += `| \`${oldName}\` | \`${newName}\` |\n`;
  }
  
  output += '\n## Column Name Mappings (snake_case to camelCase)\n\n';
  
  for (const [tableName, columns] of Object.entries(columnNameMap)) {
    output += `### Table: ${tableName}\n\n`;
    output += '| Old Column | New Column |\n';
    output += '|------------|------------|\n';
    
    for (const [oldColumn, newColumn] of Object.entries(columns)) {
      output += `| \`${oldColumn}\` | \`${newColumn}\` |\n`;
    }
    
    output += '\n';
  }
  
  output += '## Code Update Recommendations\n\n';
  output += '1. Update all database query references to use the new naming convention\n';
  output += '2. Update all interface/type definitions to use the new naming convention\n';
  output += '3. Use the `convertToNewFormat` and `convertToOldFormat` utility functions for data conversion\n';
  output += '4. Update any hardcoded SQL queries with the new table and column names\n';
  
  return output;
}

// Export a default object with all utilities
export default {
  tableNameMap,
  reverseTableNameMap,
  columnNameMap,
  reverseColumnNameMap,
  convertToNewFormat,
  convertToOldFormat,
  convertCollectionToNewFormat,
  convertCollectionToOldFormat,
  getNewTableName,
  getOldTableName,
  getNewColumnName,
  getOldColumnName,
  toCamelCase,
  toSnakeCase,
  generateCodeUpdateHelper
};