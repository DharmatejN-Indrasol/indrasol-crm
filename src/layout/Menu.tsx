import {
    useTranslate,
    MenuItemLink,
} from 'react-admin';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SettingsIcon from '@mui/icons-material/Settings';
import CampaignIcon from '@mui/icons-material/Campaign';
import SendIcon from '@mui/icons-material/Send';
import DescriptionIcon from '@mui/icons-material/Description';
// import { SubMenu } from './SubMenu';
import { useLocation } from 'react-router-dom';

export const Menu = () => {
    const translate = useTranslate();
    const location = useLocation();

    return (
        <div>
            <MenuItemLink
                to="/"
                primaryText={'Dashboard'}
                leftIcon={<PeopleIcon />}
            />
            <MenuItemLink
                to="/leads"
                primaryText={'Leads'}
                leftIcon={<PeopleIcon />}
            />
            <MenuItemLink
                to="/contacts"
                primaryText={'Contacts'}
                leftIcon={<PeopleIcon />}
            />
            <MenuItemLink
                to="/companies"
                primaryText={'Companies'}
                leftIcon={<BusinessIcon />}
            />
            <MenuItemLink
                to="/deals"
                primaryText={translate(`pos.menu.deals`)}
                leftIcon={<MonetizationOnIcon />}
            />

            {/* 
            <SubMenu
                name="Automation"
                icon={<CampaignIcon />}
            >
                <MenuItemLink
                    to="/campaigns"
                    primaryText="Campaigns"
                    leftIcon={<CampaignIcon />}
                />
                <MenuItemLink
                    to="/sequences"
                    primaryText="Sequences"
                    leftIcon={<SendIcon />}
                />
                <MenuItemLink
                    to="/templates"
                    primaryText="Templates"
                    leftIcon={<DescriptionIcon />}
                />
            </SubMenu> */}

            <MenuItemLink
                to="/settings"
                primaryText={translate('pos.menu.settings')}
                leftIcon={<SettingsIcon />}
            />
        </div>
    );
}; 