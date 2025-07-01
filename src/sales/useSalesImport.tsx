import { useCallback } from 'react';
import { useDataProvider } from 'react-admin';
import type { DataProvider } from 'react-admin';

export type SalesImportSchema = {
    first_name: string;
    last_name: string;
    email: string;
    administrator: string;
    disabled: string;
    avatar: string;
};

export function useSalesImport() {
    const dataProvider = useDataProvider();
    const processBatch = useCallback(
        async (batch: SalesImportSchema[]) => {
            await Promise.all(
                batch.map(async (user) => {
                    await dataProvider.create('sales', {
                        data: {
                            ...user,
                            administrator: user.administrator === 'true' || user.administrator === '1',
                            disabled: user.disabled === 'true' || user.disabled === '1',
                        },
                    });
                })
            );
        },
        [dataProvider]
    );
    return processBatch;
} 