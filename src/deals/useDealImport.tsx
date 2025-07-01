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

export function useDealImport() {
    const user = useGetIdentity();
    const dataProvider = useDataProvider();
    const processBatch = useCallback(
        async (batch: DealImportSchema[]) => {
            await Promise.all(
                batch.map(async (deal) => {
                    // Parse contact_ids as array if present
                    let contactIds: string[] = [];
                    if (deal.contact_ids) {
                        contactIds = deal.contact_ids.split(',').map(id => id.trim()).filter(Boolean);
                    }
                    await dataProvider.create('deals', {
                        data: {
                            ...deal,
                            contact_ids: contactIds,
                            amount: Number(deal.amount),
                            index: Number(deal.index),
                            sales_id: user?.identity?.id,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        },
                    });
                })
            );
        },
        [dataProvider, user?.identity?.id]
    );
    return processBatch;
} 