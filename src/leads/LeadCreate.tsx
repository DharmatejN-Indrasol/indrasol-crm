import * as React from 'react';
import { Card, CardContent, Box, Button as MuiButton } from '@mui/material';
import { CreateBase, Form, Toolbar, useGetIdentity } from 'react-admin';
import { LeadInputs } from './LeadInputs';
import { Contact } from '../types';
import Breadcrumbs from '../misc/Breadcrumbs';
import PeopleIcon from '@mui/icons-material/People';

const LeadCreate = () => {
    const { identity } = useGetIdentity();
    return (
        <CreateBase
            redirect="show"
            transform={(data: Contact) => ({
                ...data,
                first_seen: new Date().toISOString(),
                last_seen: new Date().toISOString(),
                tags: [],
            })}
        >
            <Box mt={2} display="flex">
                <Box flex="1">
                    <Breadcrumbs
                      items={[
                        { label: 'Leads', href: '/leads', icon: <PeopleIcon fontSize="small" /> },
                        { label: 'New Lead' }
                      ]}
                    />
                    <Form defaultValues={{ sales_id: identity?.id }}>
                        <Card>
                            <CardContent>
                                <LeadInputs />
                            </CardContent>
                            <Toolbar>
                                <MuiButton
                                    onClick={() => window.history.back()}
                                    color="primary"
                                    sx={{ mr: 2 }}
                                >
                                    Cancel
                                </MuiButton>
                            </Toolbar>
                        </Card>
                    </Form>
                </Box>
            </Box>
        </CreateBase>
    );
};

export default LeadCreate; 