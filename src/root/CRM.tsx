import { LinearProgress } from '@mui/material';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import type { AdminProps, AuthProvider, DataProvider } from 'react-admin';
import {
    Admin,
    CustomRoutes,
    ListGuesser,
    localStorageStore,
    RaThemeOptions,
    Resource
} from 'react-admin';
import { Route } from 'react-router-dom';

import companies from '../companies';
import contacts from '../contacts';
import deals from '../deals';
import { Layout } from '../layout/Layout';
import { LoginPage } from '../login/LoginPage';
import { i18nProvider } from './i18nProvider';
import {
    authProvider as defaultAuthProvider,
    dataProvider as defaultDataProvider,
} from '../providers/supabase';
// import {
//     authProvider as defaultAuthProvider,
//     dataProvider as defaultDataProvider,
// } from '../providers/fakerest';
import sales from '../sales';
import {
    ConfigurationContextValue,
    ConfigurationProvider,
} from './ConfigurationContext';
import {
    defaultCompanySectors,
    defaultContactGender,
    defaultDealCategories,
    defaultDealPipelineStatuses,
    defaultDealStages,
    defaultLogo,
    defaultNoteStatuses,
    defaultTaskTypes,
    defaultTitle,
} from './defaultConfiguration';
import leads from '../leads';
// import { lightTheme, darkTheme } from '../misc/theme';
// import  { houseLightTheme as lightTheme, houseDarkTheme as darkTheme } from 'react-admin';
// import  { bwLightTheme as lightTheme, bwDarkTheme as darkTheme } from 'react-admin';
// import  { nanoLightTheme as lightTheme, nanoDarkTheme as darkTheme } from 'react-admin';
// import { radiantLightTheme as lightTheme, radiantDarkTheme as darkTheme } from 'react-admin';

// Define the interface for the CRM component props
export type CRMProps = {
    dataProvider?: DataProvider;
    authProvider?: AuthProvider;
    lightTheme?: RaThemeOptions;
    darkTheme?: RaThemeOptions;
    themeMode?: 'light' | 'dark';
} & Partial<ConfigurationContextValue> &
    Partial<AdminProps>;

// const defaultLightTheme = lightTheme;
// const defaultDarkTheme = darkTheme;

const LazyDashboard = lazy(() => import('../dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const LazySettingsPage = lazy(() => import('../settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const LazySignupPage = lazy(() => import('../login/SignupPage').then(m => ({ default: m.SignupPage })));
const LazySetPasswordPage = lazy(() => import('ra-supabase').then(m => ({ default: m.SetPasswordPage })));
const LazyForgotPasswordPage = lazy(() => import('ra-supabase').then(m => ({ default: m.ForgotPasswordPage })));

const LazyCampaignList = lazy(() => import('../leads/automation/CampaignList'));
const LazySequenceList = lazy(() => import('../leads/automation/SequenceList'));
const LazyTemplateList = lazy(() => import('../leads/automation/TemplateList'));
const LazyCalendarIntegrationPage = lazy(() => import('../settings/CalendarIntegrationPage'));

/**
 * CRM Component
 *
 * This component sets up and renders the main CRM application using `react-admin`. It provides
 * default configurations and themes but allows for customization through props. The component
 * wraps the application with a `ConfigurationProvider` to provide configuration values via context.
 *
 * @param {Array<ContactGender>} contactGender - The gender options for contacts used in the application.
 * @param {string[]} companySectors - The list of company sectors used in the application.
 * @param {RaThemeOptions} darkTheme - The theme to use when the application is in dark mode.
 * @param {string[]} dealCategories - The categories of deals used in the application.
 * @param {string[]} dealPipelineStatuses - The statuses of deals in the pipeline used in the application.
 * @param {DealStage[]} dealStages - The stages of deals used in the application.
 * @param {RaThemeOptions} lightTheme - The theme to use when the application is in light mode.
 * @param {string} logo - The logo used in the CRM application.
 * @param {NoteStatus[]} noteStatuses - The statuses of notes used in the application.
 * @param {string[]} taskTypes - The types of tasks used in the application.
 * @param {string} title - The title of the CRM application.
 *
 * @returns {JSX.Element} The rendered CRM application.
 *
 * @example
 * // Basic usage of the CRM component
 * import { CRM } from './CRM';
 *
 * const App = () => (
 *     <CRM
 *         logo="/path/to/logo.png"
 *         title="My Custom CRM"
 *         lightTheme={{
 *             ...defaultTheme,
 *             palette: {
 *                 primary: { main: '#0000ff' },
 *             },
 *         }}
 *     />
 * );
 *
 * export default App;
 */
export const CRM = ({
    contactGender = defaultContactGender,
    companySectors = defaultCompanySectors,
    darkTheme,
    dealCategories = defaultDealCategories,
    dealPipelineStatuses = defaultDealPipelineStatuses,
    dealStages = defaultDealStages,
    lightTheme,
    logo = defaultLogo,
    noteStatuses = defaultNoteStatuses,
    taskTypes = defaultTaskTypes,
    title = defaultTitle,
    dataProvider = defaultDataProvider,
    authProvider = defaultAuthProvider,
    disableTelemetry,
    themeMode,
    ...rest
}: CRMProps) => {
    useEffect(() => {
        if (
            disableTelemetry ||
            process.env.NODE_ENV !== 'production' ||
            typeof window === 'undefined' ||
            typeof window.location === 'undefined' ||
            typeof Image === 'undefined'
        ) {
            return;
        }
        const img = new Image();
        img.src = `https://indrasol-crm-telemetry.Indrasollab.com/indrasol-crm-telemetry?domain=${window.location.hostname}`;
    }, [disableTelemetry]);

    const [loading, setLoading] = useState(false);
    // Show progress bar on suspense fallback
    const SuspenseWithProgress = ({ children }: { children: React.ReactNode }) => (
        <Suspense fallback={<LinearProgress sx={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 2000 }} />}>
            {children}
        </Suspense>
    );

    return (
        <ConfigurationProvider
            contactGender={contactGender}
            companySectors={companySectors}
            dealCategories={dealCategories}
            dealPipelineStatuses={dealPipelineStatuses}
            dealStages={dealStages}
            logo={logo}
            noteStatuses={noteStatuses}
            taskTypes={taskTypes}
            title={title}
        >
            <Admin
                dataProvider={dataProvider}
                authProvider={authProvider}
                store={localStorageStore(undefined, 'CRM')}
                layout={Layout}
                loginPage={LoginPage}
                dashboard={() => (
                    <SuspenseWithProgress>
                        <LazyDashboard />
                    </SuspenseWithProgress>
                )}
                lightTheme={lightTheme}
                darkTheme={darkTheme}
                defaultTheme={themeMode}
                i18nProvider={i18nProvider}
                requireAuth
                disableTelemetry
                {...rest}
            >
                <CustomRoutes noLayout>
                    <Route path="/signup" element={<SuspenseWithProgress><LazySignupPage /></SuspenseWithProgress>} />
                    <Route path="/set-password" element={<SuspenseWithProgress><LazySetPasswordPage /></SuspenseWithProgress>} />
                    <Route path="/forgot-password" element={<SuspenseWithProgress><LazyForgotPasswordPage /></SuspenseWithProgress>} />
                </CustomRoutes>

                <CustomRoutes>
                    <Route
                        path="/settings"
                        element={<SuspenseWithProgress><LazySettingsPage /></SuspenseWithProgress>}
                    />
                    <Route
                        path="/settings/calendar"
                        element={<SuspenseWithProgress><LazyCalendarIntegrationPage /></SuspenseWithProgress>}
                    />
                    <Route path="/campaigns" element={<SuspenseWithProgress><LazyCampaignList /></SuspenseWithProgress>} />
                    <Route path="/sequences" element={<SuspenseWithProgress><LazySequenceList /></SuspenseWithProgress>} />
                    <Route path="/templates" element={<SuspenseWithProgress><LazyTemplateList /></SuspenseWithProgress>} />
                </CustomRoutes>
                <Resource name="deals" {...deals} />
                <Resource name="contacts" {...contacts} />
                <Resource name="companies" {...companies} />
                <Resource name="contactNotes" />
                <Resource name="dealNotes" />
                <Resource name="tasks" list={ListGuesser} />
                <Resource name="sales" {...sales} />
                <Resource name="tags" list={ListGuesser} />
                <Resource name="leads" {...leads} />
            </Admin>
        </ConfigurationProvider>
    );
};
