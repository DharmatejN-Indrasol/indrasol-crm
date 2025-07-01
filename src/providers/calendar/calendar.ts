import { Identifier, RaRecord } from 'react-admin';

export type CalendarIntegration = {
    id: string;
    user_id: string;
    provider: 'google' | 'outlook';
    refresh_token: string;
    access_token: string;
    expires_at: string;
    scopes: string[];
    profile_info: {
        email?: string;
        name?: string;
        picture?: string;
    };
    created_at: string;
    updated_at: string;
}; 