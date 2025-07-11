import { useCallback } from 'react';
import { useDataProvider, useGetIdentity } from 'react-admin';
import type { DataProvider } from 'react-admin';

export type DealImportSchema = {
    name: string;
    company_id: string;
    contact_ids: string;
    category: string;
    stage: string;
    description: string;
    amount: string;
    expected_closing_date: string;
    index: string;
};

function toISODate(dateStr: string) {
    // If already in YYYY-MM-DD, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // If in DD-MM-YYYY, convert
    const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (match) {
        return `${match[3]}-${match[2]}-${match[1]}`;
    }
    return dateStr; // fallback
}

export function useDealImport() {
    const user = useGetIdentity();
    const dataProvider = useDataProvider();
    const processBatch = useCallback(
        async (batch: DealImportSchema[]) => {
            const skipped: { deal: DealImportSchema; reason: string }[] = [];
            await Promise.all(
                batch.map(async (deal) => {
                    // Parse contact_ids as array if present
                    let contactIds: string[] = [];
                    if (typeof deal.contact_ids === 'string' && deal.contact_ids.length > 0) {
                        contactIds = deal.contact_ids.split(',').map(id => id.trim()).filter(Boolean);
                    }

                    let companyId = deal.company_id;
                    // If company_id is not a valid UUID, treat as name and look up
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (!uuidRegex.test(companyId)) {
                        // Try to find company by name
                        try {
                            const res = await dataProvider.getList('companies', {
                                filter: { name: companyId },
                                pagination: { page: 1, perPage: 1 },
                                sort: { field: 'id', order: 'ASC' },
                            });
                            if (res.data && res.data.length > 0) {
                                companyId = res.data[0].id;
                            } else {
                                // Company not found, create it
                                try {
                                    const createRes = await dataProvider.create('companies', {
                                        data: { name: companyId },
                                    });
                                    companyId = createRes.data.id;
                                } catch (createErr) {
                                    skipped.push({ deal, reason: `Failed to create company: ${companyId}` });
                                    return;
                                }
                            }
                        } catch (err) {
                            skipped.push({ deal, reason: `Error looking up or creating company: ${companyId}` });
                            return;
                        }
                    }

                    try {
                        await dataProvider.create('deals', {
                            data: {
                                ...deal,
                                company_id: companyId,
                                contact_ids: contactIds,
                                amount: Number(deal.amount),
                                index: Number(deal.index),
                                expected_closing_date: toISODate(deal.expected_closing_date),
                                sales_id: user?.identity?.id,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                            },
                        });
                    } catch (err) {
                        skipped.push({ deal, reason: `Error creating deal: ${err}` });
                    }
                })
            );
            if (skipped.length > 0) {
                // Log skipped deals for debugging
                // eslint-disable-next-line no-console
                console.warn('Some deals were skipped during import:', skipped);
                alert(`Some deals were skipped during import. Check the console for details.`);
            }
        },
        [dataProvider, user?.identity?.id]
    );
    return processBatch;
} 