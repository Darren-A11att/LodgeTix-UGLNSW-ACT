/**
 * DB Naming Schema Adapter
 * 
 * This utility provides conversion functions between the old snake_case naming convention
 * and the new PascalCase (tables) and camelCase (columns) conventions.
 * 
 * These mappings were generated from the table_rename_log and column_rename_log tables
 * in the database and represent the complete mapping between old and new schemas.
 */

// Table mappings (snake_case to PascalCase)
const tableNameMap = {
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
const reverseTableNameMap = Object.fromEntries(
  Object.entries(tableNameMap).map(([key, value]) => [value, key])
);

// Column mappings by table (snake_case to camelCase)
// This is a placeholder - actual values will come from database query results
const columnNameMap = {
  // Example format:
  // 'Events': {
  //   'event_id': 'eventId',
  //   'event_name': 'eventName',
  //   // ... more columns
  // },
  // ... more tables
};

// Reverse column mappings (camelCase to snake_case)
const reverseColumnNameMap = {};
for (const [table, columns] of Object.entries(columnNameMap)) {
  reverseColumnNameMap[table] = Object.fromEntries(
    Object.entries(columns).map(([key, value]) => [value, key])
  );
}

/**
 * Converts a single property from snake_case to camelCase
 * @param {string} snakeStr - The snake_case string
 * @returns {string} The camelCase string
 */
function toCamelCase(snakeStr) {
  return snakeStr.replace(/_([a-z])/g, (match, group) => group.toUpperCase());
}

/**
 * Converts a single property from camelCase to snake_case
 * @param {string} camelStr - The camelCase string
 * @returns {string} The snake_case string
 */
function toSnakeCase(camelStr) {
  return camelStr.replace(/[A-Z]/g, match => `_${match.toLowerCase()}`);
}

/**
 * Converts a database record from old snake_case format to new camelCase format
 * @param {string} tableName - The snake_case table name (old format)
 * @param {Object} data - The data with snake_case properties
 * @returns {Object} The data with camelCase properties
 */
function convertToNewFormat(tableName, data) {
  if (!tableNameMap[tableName]) {
    console.warn(`Unknown table name: ${tableName}`);
    return data;
  }
  
  const newTableName = tableNameMap[tableName];
  const result = {};
  
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
 * @param {string} tableName - The PascalCase table name (new format)
 * @param {Object} data - The data with camelCase properties
 * @returns {Object} The data with snake_case properties
 */
function convertToOldFormat(tableName, data) {
  if (!reverseTableNameMap[tableName]) {
    console.warn(`Unknown table name: ${tableName}`);
    return data;
  }
  
  const oldTableName = reverseTableNameMap[tableName];
  const result = {};
  
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
 * @param {string} tableName - The snake_case table name (old format)
 * @param {Array<Object>} records - Array of data objects with snake_case properties
 * @returns {Array<Object>} Array of data objects with camelCase properties
 */
function convertCollectionToNewFormat(tableName, records) {
  if (!Array.isArray(records)) {
    return convertToNewFormat(tableName, records);
  }
  return records.map(record => convertToNewFormat(tableName, record));
}

/**
 * Converts a collection of database records from new to old format
 * @param {string} tableName - The PascalCase table name (new format)
 * @param {Array<Object>} records - Array of data objects with camelCase properties
 * @returns {Array<Object>} Array of data objects with snake_case properties
 */
function convertCollectionToOldFormat(tableName, records) {
  if (!Array.isArray(records)) {
    return convertToOldFormat(tableName, records);
  }
  return records.map(record => convertToOldFormat(tableName, record));
}

/**
 * Gets the new PascalCase table name for an old snake_case table name
 * @param {string} oldTableName - The snake_case table name
 * @returns {string|null} The PascalCase table name or null if not found
 */
function getNewTableName(oldTableName) {
  return tableNameMap[oldTableName] || null;
}

/**
 * Gets the old snake_case table name for a new PascalCase table name
 * @param {string} newTableName - The PascalCase table name
 * @returns {string|null} The snake_case table name or null if not found
 */
function getOldTableName(newTableName) {
  return reverseTableNameMap[newTableName] || null;
}

/**
 * Gets the new camelCase column name for an old snake_case column name
 * @param {string} tableName - The PascalCase table name
 * @param {string} oldColumnName - The snake_case column name
 * @returns {string|null} The camelCase column name or null if not found
 */
function getNewColumnName(tableName, oldColumnName) {
  const columnMap = columnNameMap[tableName] || {};
  return columnMap[oldColumnName] || toCamelCase(oldColumnName);
}

/**
 * Gets the old snake_case column name for a new camelCase column name
 * @param {string} tableName - The PascalCase table name
 * @param {string} newColumnName - The camelCase column name
 * @returns {string|null} The snake_case column name or null if not found
 */
function getOldColumnName(tableName, newColumnName) {
  const columnMap = reverseColumnNameMap[tableName] || {};
  return columnMap[newColumnName] || toSnakeCase(newColumnName);
}

// Export the utilities
module.exports = {
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
  toSnakeCase
};