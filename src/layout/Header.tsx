import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CampaignIcon from '@mui/icons-material/Campaign';
import SendIcon from '@mui/icons-material/Send';
import DescriptionIcon from '@mui/icons-material/Description';
import {
    AppBar,
    Box,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Tab,
    Tabs,
    Toolbar,
    Typography,
    IconButton,
    Tooltip,
    InputBase,
    Paper,
    Popover,
    List,
    ListItem,
    CircularProgress,
    Menu as MuiMenu,
} from '@mui/material';
import {
    CanAccess,
    LoadingIndicator,
    Logout,
    UserMenu,
    useUserMenu,
    useTheme,
} from 'react-admin';
import { Link, useLocation } from 'react-router-dom';
import { useConfigurationContext } from '../root/ConfigurationContext';
import React, { useState } from 'react';
import { mockConversationalSearch } from '../misc/conversationalSearch';

const Header = () => {
    const { logo, title } = useConfigurationContext();
    const location = useLocation();
    const [themeMode, setThemeMode] = useTheme();
    const [searchAnchor, setSearchAnchor] = useState<null | HTMLElement>(null);
    const [searchValue, setSearchValue] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);

    const currentPath = location.pathname;

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setSearchLoading(true);
        setSearchError('');
        setSearchResults([]);
        try {
            const results = await mockConversationalSearch(searchValue);
            setSearchResults(results);
        } catch (err: any) {
            setSearchError('Failed to search.');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMoreMenuAnchor(event.currentTarget);
    };

    const handleMoreMenuClose = () => {
        setMoreMenuAnchor(null);
    };

    return (
        <Box component="nav" sx={{ flexGrow: 1 }}>
            <AppBar position="static" color="primary" elevation={0} sx={{ boxShadow: '0 2px 8px 0 rgba(37,99,235,0.08)', borderBottom: '1px solid #e0e7ef' }}>
                <Toolbar variant="dense" sx={{ minHeight: 60, py: 1.5 }}>
                    <Box flex={1} display="flex" justifyContent="space-between" alignItems="center">
                        <Box
                            display="flex"
                            alignItems="center"
                            component={Link}
                            to="/"
                            sx={{
                                color: 'inherit',
                                textDecoration: 'inherit',
                                gap: 2,
                            }}
                        >
                            <Box
                                component="img"
                                sx={{ height: 28 }}
                                src={logo}
                                alt={title}
                            />
                            {/* <Typography component="span" variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}>
                                {title}
                            </Typography> */}
                        </Box>
                        <Box>
                            <Tabs
                                value={currentPath.startsWith('/contacts') ? '/contacts' : currentPath.startsWith('/companies') ? '/companies' : currentPath.startsWith('/deals') ? '/deals' : currentPath.startsWith('/leads') ? '/leads' : '/'}
                                aria-label="Navigation Tabs"
                                indicatorColor="secondary"
                                textColor="inherit"
                                sx={{ minHeight: 48, '.MuiTab-root': { minWidth: 110, fontWeight: 600, fontSize: '1rem', px: 2 } }}
                            >
                                <Tab
                                    label={'Dashboard'}
                                    component={Link}
                                    to="/"
                                    value="/"
                                />
                                <Tab
                                    label={'Leads'}
                                    component={Link}
                                    to="/leads"
                                    value="/leads"
                                />
                                <Tab
                                    label={'Contacts'}
                                    component={Link}
                                    to="/contacts"
                                    value="/contacts"
                                />
                                <Tab
                                    label={'Companies'}
                                    component={Link}
                                    to="/companies"
                                    value="/companies"
                                />
                                <Tab
                                    label={'Deals'}
                                    component={Link}
                                    to="/deals"
                                    value="/deals"
                                />
                            </Tabs>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Paper component="form" onSubmit={handleSearch} sx={{ display: 'flex', alignItems: 'center', mr: 2, boxShadow: 0, bgcolor: 'background.paper', borderRadius: 3, pl: 1.5, pr: 1, py: 0.5, minWidth: 200, border: '1px solid #e0e7ef', position: 'relative' }}>
                                <Box sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <SearchIcon fontSize="small" />
                                    <Box sx={{ bgcolor: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 1, px: 0.5, ml: 0.5, letterSpacing: 0.5 }}>AI</Box>
                                </Box>
                                <InputBase
                                    sx={{ ml: 8, flex: 1, minWidth: 180, fontWeight: 500, fontSize: '1rem' }}
                                    placeholder="Ask anything…"
                                    inputProps={{ 'aria-label': 'conversational search' }}
                                    value={searchValue}
                                    onChange={e => setSearchValue(e.target.value)}
                                    onFocus={e => setSearchAnchor(e.currentTarget)}
                                />
                            </Paper>
                            <Popover
                                open={!!searchAnchor && (searchLoading || searchResults.length > 0 || !!searchError)}
                                anchorEl={searchAnchor}
                                onClose={() => setSearchAnchor(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                PaperProps={{ sx: { minWidth: 320, maxWidth: 420, p: 1 } }}
                            >
                                {searchLoading && <Box p={2} display="flex" alignItems="center"><CircularProgress size={20} sx={{ mr: 1 }} /> Searching…</Box>}
                                {searchError && <Box p={2}><Typography color="error">{searchError}</Typography></Box>}
                                {!searchLoading && !searchError && searchResults.length === 0 && <Box p={2}><Typography color="text.secondary">No results found.</Typography></Box>}
                                <List dense>
                                    {searchResults.map((result, idx) => (
                                        <ListItem button key={idx} onClick={() => window.location.href = result.url}>
                                            <ListItemText primary={result.title} secondary={result.type} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Popover>
                            <Tooltip title="More">
                                <IconButton color="inherit" onClick={handleMoreMenuOpen}>
                                    <MoreVertIcon />
                                </IconButton>
                            </Tooltip>
                            <MuiMenu
                                anchorEl={moreMenuAnchor}
                                open={Boolean(moreMenuAnchor)}
                                onClose={handleMoreMenuClose}
                            >
                                <MenuItem component={Link} to="/campaigns" onClick={handleMoreMenuClose}>
                                    <ListItemIcon><CampaignIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText>Campaigns</ListItemText>
                                </MenuItem>
                                <MenuItem component={Link} to="/sequences" onClick={handleMoreMenuClose}>
                                    <ListItemIcon><SendIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText>Sequences</ListItemText>
                                </MenuItem>
                                <MenuItem component={Link} to="/templates" onClick={handleMoreMenuClose}>
                                    <ListItemIcon><DescriptionIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText>Templates</ListItemText>
                                </MenuItem>
                            </MuiMenu>
                            <Tooltip title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                                <IconButton
                                    color="inherit"
                                    onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                                    sx={{ mr: 1, borderRadius: 2, border: '1.5px solid transparent', transition: 'border 0.2s', '&:focus-visible': { border: '1.5px solid #2563eb' } }}
                                    size="large"
                                >
                                    {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                                </IconButton>
                            </Tooltip>
                            <LoadingIndicator />
                            <UserMenu>
                                <ConfigurationMenu />
                                <CanAccess resource="sales" action="list">
                                    <UsersMenu />
                                </CanAccess>
                                <Logout />
                            </UserMenu>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>
        </Box>
    );
};

const UsersMenu = () => {
    const { onClose } = useUserMenu() ?? {};
    return (
        <MenuItem component={Link} to="/sales" onClick={onClose}>
            <ListItemIcon>
                <PeopleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Users</ListItemText>
        </MenuItem>
    );
};

const ConfigurationMenu = () => {
    const { onClose } = useUserMenu() ?? {};
    return (
        <MenuItem component={Link} to="/settings" onClick={onClose}>
            <ListItemIcon>
                <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>My info</ListItemText>
        </MenuItem>
    );
};
export default Header;
