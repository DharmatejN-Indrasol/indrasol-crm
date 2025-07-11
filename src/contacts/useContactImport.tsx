import { useCallback, useMemo } from 'react';
import { useDataProvider, useGetIdentity } from 'react-admin';
import type { Company, Tag } from '../types';
import type { DataProvider } from 'react-admin';

export type ContactImportSchema = {
    zoominfo_contact_id?: string;
    last_name: string;
    first_name: string;
    middle_name?: string;
    salutation?: string;
    suffix?: string;
    job_title?: string;
    job_start_date?: string;
    job_function?: string;
    department?: string;
    company_division_name?: string;
    direct_phone_number?: string;
    email_address?: string;
    email_domain?: string;
    mobile_phone?: string;
    highest_level_of_education?: string;
    contact_accuracy_score?: string;
    contact_accuracy_grade?: string;
    zoominfo_contact_profile_url?: string;
    linkedin_contact_profile_url?: string;
    notice_provided_date?: string;
    person_street?: string;
    person_city?: string;
    person_state?: string;
    person_zip_code?: string;
    country?: string;
    zoominfo_company_id?: string;
    company_name: string;
    website?: string;
    founded_year?: number;
    company_hq_phone?: string;
    fax?: string;
    ticker?: string;
    revenue?: string;
    revenue_range?: string;
    employees?: number;
    employee_range?: string;
    sic_codes?: string;
    naics_codes?: string;
    primary_industry?: string;
    primary_sub_industry?: string;
    all_industries?: string;
    all_sub_industries?: string;
    industry_hierarchical_category?: string;
    secondary_industry_hierarchical_category?: string;
    alexa_rank?: number;
    zoominfo_company_profile_url?: string;
    linkedin_company_profile_url?: string;
    facebook_company_profile_url?: string;
    twitter_company_profile_url?: string;
    ownership_type?: string;
    business_model?: string;
    certified_active_company?: string;
    certification_date?: string;
    total_funding_amount?: number;
    recent_funding_amount?: number;
    recent_funding_round?: string;
    recent_funding_date?: string;
    recent_investors?: string;
    all_investors?: string;
    company_street_address?: string;
    company_city?: string;
    company_state?: string;
    company_zip_code?: string;
    company_country?: string;
    full_address?: string;
    query_name?: string;

    // Existing contact fields for backward compatibility
    gender?: string;
    title?: string;
    email_work?: string;
    email_home?: string;
    email_other?: string;
    phone_work?: string;
    phone_home?: string;
    phone_other?: string;
    background?: string;
    avatar?: string;
    first_seen?: string;
    last_seen?: string;
    has_newsletter?: string;
    status?: string;
    tags?: string;
    linkedin_url?: string;
};

export function useContactImport() {
    const today = new Date().toISOString();
    const user = useGetIdentity();
    const dataProvider = useDataProvider();

    // Company cache
    const companiesCache = useMemo(() => new Map<string, Company>(), [dataProvider]);
    const getCompanies = useCallback(
        async (names: string[], zoominfoCompanyIds: string[]) => {
            // You can extend fetchRecordsWithCache to handle external_id
            return fetchRecordsWithCacheExtended<Company>(
                'companies',
                companiesCache,
                names,
                zoominfoCompanyIds,
                (name, extId, index) => ({
                    name,
                    external_id: extId,
                    website: undefined,
                    created_at: new Date().toISOString(),
                    sales_id: user?.identity?.id,
                }),
                dataProvider
            );
        },
        [companiesCache, user?.identity?.id, dataProvider]
    );

    // Tags cache
    const tagsCache = useMemo(() => new Map<string, Tag>(), [dataProvider]);
    const getTags = useCallback(
        async (names: string[]) =>
            fetchRecordsWithCacheExtended<Tag>(
                'tags',
                tagsCache,
                names,
                [],
                name => ({
                    name,
                    color: '#f9f9f9',
                }),
                dataProvider
            ),
        [tagsCache, dataProvider]
    );

    const processBatch = useCallback(
        async (batch: ContactImportSchema[]) => {
            const companyNames = batch
                .map(c => c.company_name?.trim())
                .filter(Boolean) as string[];
            const zoominfoCompanyIds = batch
                .map(c => c.zoominfo_company_id)
                .filter(Boolean) as string[];

            const [companies, tags] = await Promise.all([
                getCompanies(companyNames, zoominfoCompanyIds),
                getTags(batch.flatMap(contact => parseTags(contact.tags))),
            ]);

            await Promise.all(
                batch.map(async contact => {
                    // Map phones
                    const email_jsonb = [
                        { email: contact.email_work ?? contact.email_address, type: 'Work' },
                        { email: contact.email_home, type: 'Home' },
                        { email: contact.email_other, type: 'Other' },
                    ].filter(({ email }) => email);

                    const phone_jsonb = [
                        { number: contact.phone_work ?? contact.direct_phone_number, type: 'Work' },
                        { number: contact.phone_home, type: 'Home' },
                        { number: contact.phone_other, type: 'Other' },
                        { number: contact.mobile_phone, type: 'Mobile' },
                    ].filter(({ number }) => number);

                    const company = contact.company_name?.trim()
                        ? companies.get(contact.company_name.trim())
                        : undefined;

                    const tagList = parseTags(contact.tags)
                        .map(name => tags.get(name))
                        .filter((tag): tag is Tag => !!tag);

                    return dataProvider.create('contacts', {
                        data: {
                            external_id: contact.zoominfo_contact_id,
                            first_name: contact.first_name,
                            last_name: contact.last_name,
                            middle_name: contact.middle_name,
                            salutation: contact.salutation,
                            suffix: contact.suffix,
                            job_title: contact.job_title,
                            job_start_date: contact.job_start_date
                                ? new Date(contact.job_start_date).toISOString()
                                : undefined,
                            department: contact.department,
                            company_division_name: contact.company_division_name,
                            email_jsonb,
                            phone_jsonb,
                            background: contact.background,
                            first_seen: contact.first_seen ? new Date(contact.first_seen).toISOString() : today,
                            last_seen: contact.last_seen ? new Date(contact.last_seen).toISOString() : today,
                            has_newsletter: contact.has_newsletter,
                            status: contact.status,
                            company_id: company?.id,
                            tags: tagList.map(tag => tag.id),
                            sales_id: user?.identity?.id,
                            linkedin_url: contact.linkedin_contact_profile_url || contact.linkedin_url,
                            // Extra address fields
                            street: contact.person_street,
                            city: contact.person_city,
                            state: contact.person_state,
                            postal_code: contact.person_zip_code,
                            country: contact.country,
                            avatar: contact.avatar,
                        },
                    });
                })
            );
        },
        [dataProvider, getCompanies, getTags, user?.identity?.id, today]
    );

    return processBatch;
}

// Extended fetchRecordsWithCache to support external_id for companies
async function fetchRecordsWithCacheExtended<T>(
    resource: string,
    cache: Map<string, T>,
    names: string[],
    externalIds: string[],
    getCreateData: (name: string, externalId: string, idx: number) => Partial<T>,
    dataProvider: DataProvider
) {
    const trimmedNames = [...new Set(names.map(name => name.trim()))];
    const uncachedRecordNames = trimmedNames.filter(name => !cache.has(name));

    // Query filter for names or external_ids (assuming exact match)
    // Here we just fetch by name; you can extend as needed
    if (uncachedRecordNames.length > 0) {
        const response = await dataProvider.getList(resource, {
            filter: {
                'name@in': `(${uncachedRecordNames.map(name => `"${name}"`).join(',')})`,
            },
            pagination: { page: 1, perPage: trimmedNames.length },
            sort: { field: 'id', order: 'ASC' },
        });
        for (const record of response.data) {
            cache.set(record.name.trim(), record);
        }
    }

    // Create missing records
    await Promise.all(
        uncachedRecordNames.map(async (name, idx) => {
            if (cache.has(name)) return;
            const response = await dataProvider.create(resource, {
                data: getCreateData(name, externalIds[idx] || '', idx),
            });
            cache.set(name, response.data);
        })
    );

    return trimmedNames.reduce((acc, name) => {
        acc.set(name, cache.get(name) as T);
        return acc;
    }, new Map<string, T>());
}

// const fetchRecordsWithCache = async function <T>(
//     resource: string,
//     cache: Map<string, T>,
//     names: string[],
//     getCreateData: (name: string) => Partial<T>,
//     dataProvider: DataProvider
// ) {
//     const trimmedNames = [...new Set(names.map(name => name.trim()))];
//     const uncachedRecordNames = trimmedNames.filter(name => !cache.has(name));

//     // check the backend for existing records
//     if (uncachedRecordNames.length > 0) {
//         const response = await dataProvider.getList(resource, {
//             filter: {
//                 'name@in': (${uncachedRecordNames.map(name => "${name}").join(',')}),
//             },
//             pagination: { page: 1, perPage: trimmedNames.length },
//             sort: { field: 'id', order: 'ASC' },
//         });
//         for (const record of response.data) {
//             cache.set(record.name.trim(), record);
//         }
//     }

//     // create missing records in parallel
//     await Promise.all(
//         uncachedRecordNames.map(async name => {
//             if (cache.has(name)) return;
//             const response = await dataProvider.create(resource, {
//                 data: getCreateData(name),
//             });
//             cache.set(name, response.data);
//         })
//     );

//     // now all records are in cache, return a map of all records
//     return trimmedNames.reduce((acc, name) => {
//         acc.set(name, cache.get(name) as T);
//         return acc;
//     }, new Map<string, T>());
// };

const parseTags = (tags?: string) =>
    tags
        ?.split(',')
        ?.map(tag => tag.trim())
        ?.filter(tag => tag) ?? [];
