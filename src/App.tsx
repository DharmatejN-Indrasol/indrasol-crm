import { CRM } from './root/CRM';
import { useState, useEffect } from 'react';
// import { lightTheme, darkTheme } from '../misc/theme';
// import  { houseLightTheme as lightTheme, houseDarkTheme as darkTheme } from 'react-admin';
// import  { bwLightTheme as lightTheme, bwDarkTheme as darkTheme } from 'react-admin';
// import  { nanoLightTheme as lightTheme, nanoDarkTheme as darkTheme } from 'react-admin';
import { radiantLightTheme as lightTheme, radiantDarkTheme as darkTheme } from 'react-admin';
import { SettingsPage } from './settings/SettingsPage';
import CalendarIntegrationPage from './settings/CalendarIntegrationPage';
import { i18nProvider } from './root/i18nProvider';


/**
 * Application entry point
 *
 * Customize Indrasol CRM by passing props to the CRM component:
 *  - contactGender
 *  - companySectors
 *  - darkTheme
 *  - dealCategories
 *  - dealPipelineStatuses
 *  - dealStages
 *  - lightTheme
 *  - logo
 *  - noteStatuses
 *  - taskTypes
 *  - title
 * ... as well as all the props accepted by react-admin's <Admin> component.
 *
 * @example
 * const App = () => (
 *    <CRM
 *       logo="./img/logo.png"
 *       title="Acme CRM"
 *    />
 * );
 */
const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('themeMode');
    if (stored === 'light' || stored === 'dark') return stored;
  }
  return 'light';
};

const App = () => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(getInitialTheme());

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  return (
    <CRM
      lightTheme={lightTheme}
      darkTheme={darkTheme}
      themeMode={themeMode}
    >
    </CRM>
  );
};

export default App;
