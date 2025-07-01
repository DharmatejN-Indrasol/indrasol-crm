import { describe, it, expect } from 'vitest';
import { mapCsvRowToLead } from './UnifiedImportDialog'; // Assuming the function is exported

describe('mapCsvRowToLead', () => {
    it('should map a CSV row to a lead object', () => {
        const row = {
            'First Name': 'John',
            'Last Name': 'Doe',
            'Company Name': 'Acme Inc.',
            'Email': 'john.doe@acme.com',
            'Phone': '555-555-5555',
            'Status': 'Contacted',
            'source': 'Website',
        };

        const lead = mapCsvRowToLead(row);

        expect(lead.first_name).toBe('John');
        expect(lead.last_name).toBe('Doe');
        expect(lead.company_name).toBe('Acme Inc.');
        expect(lead.email_work).toBe('john.doe@acme.com');
        expect(lead.phone_work).toBe('555-555-5555');
        expect(lead.status).toBe('Contacted');
        expect(lead.source).toBe('Website');
    });

    it('should use default status if none is provided', () => {
        const row = {
            'First Name': 'Jane',
            'Last Name': 'Doe',
        };

        const lead = mapCsvRowToLead(row);

        expect(lead.status).toBe('New');
    });
}); 