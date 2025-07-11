import { ContactImportSchema } from "./useContactImport";

export const mapZoomInfoCsvRowToContact = (row: any): ContactImportSchema & Record<string, any> => {
    if (!row || typeof row !== 'object') return {} as ContactImportSchema;
  
    const safeParseDate = (dateStr: string | undefined): string => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '' : d.toISOString();
    };
  
    const trimmedRow: Record<string, any> = {};
    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        const value = row[key];
        trimmedRow[key] = typeof value === 'string' ? value.trim() : value;
      }
    }
  
    return {
      first_name: trimmedRow['First Name'] || trimmedRow['first_name'] || '',
      last_name: trimmedRow['Last Name'] || trimmedRow['last_name'] || '',
      gender: trimmedRow['gender'] || '',
  
      title: trimmedRow['Job Title'] || trimmedRow['title'] || '',
      company_name: trimmedRow['Company Name'] || trimmedRow['company_name'] || '',
      management_level: trimmedRow['Management Level'] || trimmedRow['management_level'] || '',
  
      email_work: trimmedRow['Email Address'] || trimmedRow['email_work'] || '',
      email_home: trimmedRow['email_home'] || '',
      email_other: trimmedRow['email_other'] || '',
  
      phone_work: trimmedRow['Direct Phone Number'] || trimmedRow['phone_work'] || '',
      phone_home: trimmedRow['phone_home'] || '',
      phone_other: trimmedRow['Mobile phone'] || trimmedRow['phone_other'] || '',
  
      address_street: trimmedRow['Person Street'] || trimmedRow['address_street'] || '',
      address_city: trimmedRow['Person City'] || trimmedRow['address_city'] || '',
      address_state: trimmedRow['Person State'] || trimmedRow['address_state'] || '',
      address_zip: trimmedRow['Person Zip Code'] || trimmedRow['address_zip'] || '',
      address_country: trimmedRow['Country'] || trimmedRow['address_country'] || '',
  
      background: [
        `Management Level: ${trimmedRow['Management Level']}`,
        `Function: ${trimmedRow['Job Function']}`,
        `Department: ${trimmedRow['Department']}`,
        `Education: ${trimmedRow['Highest Level of Education']}`,
        `Contact Accuracy Score: ${trimmedRow['Contact Accuracy Score']} (${trimmedRow['Contact Accuracy Grade']})`,
        `Address: ${trimmedRow['Person Street']}, ${trimmedRow['Person City']}, ${trimmedRow['Person State']} ${trimmedRow['Person Zip Code']}, ${trimmedRow['Country']}`,
        `ZoomInfo Contact ID: ${trimmedRow['ZoomInfo Contact ID']}`,
        `Notice Provided: ${trimmedRow['Notice Provided Date']}`,
      ].filter(Boolean).join(' | '),
  
      avatar: trimmedRow['avatar'] || '',
  
      first_seen: safeParseDate(trimmedRow['Job Start Date']) || (typeof trimmedRow['first_seen'] === 'string' ? trimmedRow['first_seen'] : ''),
      last_seen: safeParseDate(trimmedRow['Notice Provided Date']) || (typeof trimmedRow['last_seen'] === 'string' ? trimmedRow['last_seen'] : ''),
  
      has_newsletter: trimmedRow['Certified Active Company'] === 'Yes' ? 'true' : (trimmedRow['has_newsletter'] || 'false'),
  
      status: trimmedRow['Ownership Type'] || trimmedRow['status'] || 'Active',
  
      tags: [
        trimmedRow['Primary Industry'],
        trimmedRow['Primary Sub-Industry'],
        trimmedRow['Business Model'],
        trimmedRow['Employee Range'],
      ].filter(Boolean).join(', ') || trimmedRow['tags'] || '',
  
      linkedin_url: trimmedRow['LinkedIn Contact Profile URL'] || trimmedRow['linkedin_url'] || '',
  
      ...trimmedRow,
    };
  };
  
