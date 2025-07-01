import { useCallback } from 'react';
import { useDataProvider, useGetIdentity } from 'react-admin';
import type { DataProvider } from 'react-admin';

export type CompanyImportSchema = {
    name: string;
    logo: string;
    sector: string;
    size: string;
    linkedin_url: string;
    website: string;
    phone_number: string;
    address: string;
    zipcode: string;
    city: string;
    stateAbbr: string;
    description: string;
    revenue: string;
    tax_identifier: string;
    country: string;
    context_links: string;
};

export function useCompanyImport() {
    const user = useGetIdentity();
    const dataProvider = useDataProvider();
    const processBatch = useCallback(
        async (batch: CompanyImportSchema[]) => {
            await Promise.all(
                batch.map(async (company) => {
                    // Parse context_links as array if present
                    let contextLinks: string[] = [];
                    if (company.context_links) {
                        contextLinks = company.context_links.split(',').map(link => link.trim()).filter(Boolean);
                    }
                    await dataProvider.create('companies', {
                        data: {
                            ...company,
                            context_links: contextLinks,
                            sales_id: user?.identity?.id,
                            created_at: new Date().toISOString(),
                        },
                    });
                })
            );
        },
        [dataProvider, user?.identity?.id]
    );
    return processBatch;
} 