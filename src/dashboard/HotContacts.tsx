import * as React from 'react';
import { useState } from 'react';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ContactsIcon from '@mui/icons-material/Contacts';
import ControlPointIcon from '@mui/icons-material/ControlPoint';
import { SimpleList, useGetIdentity, useGetList } from 'react-admin';
import { Avatar } from '../contacts/Avatar';
import { Contact } from '../types';
import {
    IconButton,
    Tooltip,
} from '@mui/material';
import { Link } from 'react-router-dom';

export const HotContacts = () => {
    const { identity } = useGetIdentity();
    const {
        data: contactData,
        total: contactTotal,
        isPending: contactsLoading,
    } = useGetList<Contact>(
        'contacts',
        {
            pagination: { page: 1, perPage: 10 },
            sort: { field: 'last_seen', order: 'DESC' },
            filter: { status: 'hot', sales_id: identity?.id },
        },
        { enabled: Number.isInteger(identity?.id) }
    );

    return (
        <Card sx={{ p: 2, boxShadow: 2, borderRadius: 3, '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s', mb: 2 }}>
            <Stack>
                <Box display="flex" alignItems="center" mb={1}>
                    <Box mr={1} display="flex">
                        <ContactsIcon color="disabled" fontSize="medium" aria-label="Hot Contacts" />
                    </Box>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.2, fontSize: '1.1rem' }}>
                        Hot Contacts
                    </Typography>
                    <Tooltip title="Create contact">
                        <IconButton
                            size="small"
                            sx={{ color: 'text.secondary', ml: 'auto' }}
                            component={Link}
                            to="/contacts/create"
                            aria-label="Create contact"
                        >
                            <ControlPointIcon fontSize="inherit" color="primary" />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Box
                    // sx={{
                    //     '& .MuiCardContent-root': { padding: '16px !important' },
                    //     boxShadow: 2,
                    //     borderRadius: 3,
                    //     '&:hover': { boxShadow: 4 },
                    //     transition: 'box-shadow 0.2s',
                    //     p: 2,
                    // }}
                >
                    <SimpleList<Contact>
                        linkType="show"
                        data={contactData}
                        total={contactTotal}
                        isPending={contactsLoading}
                        resource="contacts"
                        primaryText={contact =>
                            `${contact.first_name} ${contact.last_name}`
                        }
                        secondaryText={contact => (
                            <>
                                {contact.title} at {contact.company_name}
                            </>
                        )}
                        leftAvatar={contact => <Avatar record={contact} />}
                        dense
                        empty={
                            <Box p={2}>
                                <Typography variant="body2" gutterBottom>
                                    Contacts with a "hot" status will appear here.
                                </Typography>
                                <Typography variant="body2">
                                    Change the status of a contact by adding a note
                                    to that contact and clicking on "show options".
                                </Typography>
                            </Box>
                        }
                    />
                </Box>
            </Stack>
        </Card>
    );
};
