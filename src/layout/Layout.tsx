import { Container, CssBaseline } from '@mui/material';
import { Error, Loading, CheckForApplicationUpdate, Notification } from 'react-admin';
import { ErrorBoundary } from 'react-error-boundary';
import Header from './Header';
import { useLocation } from 'react-router-dom';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { Suspense, ReactNode, useEffect } from 'react';

function MyErrorFallback({ error }: { error: Error }) {
    console.error('ErrorBoundary caught:', error);
    useEffect(() => { NProgress.done(); }, []);
    return <div>Something went wrong: {error.message}</div>;
}

export const Layout = ({ children }: { children: ReactNode }) => {
    // const location = useLocation();

    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         NProgress.start();
    //     }, 150);

    //     return () => {
    //         clearTimeout(timer);
    //         NProgress.done();
    //     };
    // }, [location.pathname]);

    return (
        <>
            <CssBaseline />
            <Header />
            <Container maxWidth={false} disableGutters sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 2, md: 3, lg: 4 }, py:1 }}>
                <main id="main-content">
                    <ErrorBoundary FallbackComponent={MyErrorFallback}>
                        {/* Only the top-level Suspense in CRM.tsx should show a global loading bar */}
                        <Suspense fallback={null}>{children}</Suspense>
                    </ErrorBoundary>
                </main>
            </Container>
            <CheckForApplicationUpdate interval={30 * 1000} />
            <Notification />
        </>
    );
};
