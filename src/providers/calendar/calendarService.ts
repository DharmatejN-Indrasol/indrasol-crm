import { DataProvider } from 'react-admin';
import type { CalendarIntegration } from './calendar';

const REFRESH_TOKEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`;

export class CalendarService {
    constructor(
        private dataProvider: DataProvider,
        private integration: CalendarIntegration
    ) {}

    private async refreshAccessToken(): Promise<string> {
        if (new Date(this.integration.expires_at) > new Date()) {
            return this.integration.access_token;
        }

        // Token is expired, refresh it
        const response = await fetch(REFRESH_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: this.integration.refresh_token }),
        });

        if (!response.ok) {
            throw new Error('Failed to refresh access token.');
        }

        const { access_token, refresh_token, expires_at } = await response.json();

        // Update the integration in the database
        const updatedIntegration = await this.dataProvider.update<CalendarIntegration>(
            'calendar_integrations',
            {
                id: this.integration.id,
                data: {
                    ...this.integration,
                    access_token,
                    refresh_token, // a new refresh token might be returned
                    expires_at: new Date(expires_at * 1000).toISOString(),
                },
                previousData: this.integration,
            }
        );

        this.integration = updatedIntegration.data;
        return this.integration.access_token;
    }

    private getApiUrl(path: string): string {
        if (this.integration.provider === 'google') {
            return `https://www.googleapis.com/calendar/v3${path}`;
        }
        if (this.integration.provider === 'outlook') {
            return `https://graph.microsoft.com/v1.0/me${path}`;
        }
        throw new Error('Unsupported provider');
    }

    public async listCalendars() {
        const accessToken = await this.refreshAccessToken();
        const url = this.getApiUrl('/users/me/calendarList');

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            throw new Error('Failed to list calendars.');
        }

        const data = await response.json();
        return data.items; // Google format
    }

    public async createEvent(calendarId: string, event: any) {
        const accessToken = await this.refreshAccessToken();
        const url = this.getApiUrl(`/calendars/${calendarId}/events`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(event),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Failed to create event:', error);
            throw new Error('Failed to create event.');
        }

        return response.json();
    }

    // Methods for calendar actions will go here
    // e.g., createEvent, listEvents, etc.
} 