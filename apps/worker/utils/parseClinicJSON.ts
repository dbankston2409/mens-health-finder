import * as fs from 'fs';
import { RawClinic } from '../types/clinic';

export async function parseClinicJSON(input: string): Promise<RawClinic[]> {
  let jsonContent: string;
  
  // Check if input is a file path or raw JSON string
  if (input.trim().startsWith('[') || input.trim().startsWith('{')) {
    jsonContent = input;
  } else {
    // Assume it's a file path
    try {
      jsonContent = fs.readFileSync(input, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read JSON file: ${input}. Error: ${error}`);
    }
  }

  try {
    const data = JSON.parse(jsonContent);
    
    // Handle both single object and array formats
    const records = Array.isArray(data) ? data : [data];
    
    // Normalize the records
    const normalizedRecords: RawClinic[] = records.map((record: any) => {
      const normalized: RawClinic = {};
      
      Object.keys(record).forEach(key => {
        const normalizedKey = normalizeKey(key);
        const value = record[key];
        
        // Convert to string and handle empty values
        if (value !== null && value !== undefined && value !== '') {
          normalized[normalizedKey] = String(value).trim();
        }
      });

      return normalized;
    });

    console.log(`✅ Parsed ${normalizedRecords.length} records from JSON`);
    return normalizedRecords;
    
  } catch (error) {
    throw new Error(`Failed to parse JSON content: ${error}`);
  }
}

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
    .replace(/address1?/i, 'address')
    .replace(/phonenumber/i, 'phone')
    .replace(/zipcode/i, 'zip')
    .replace(/clinicname/i, 'name')
    .replace(/websiteurl/i, 'website');
}