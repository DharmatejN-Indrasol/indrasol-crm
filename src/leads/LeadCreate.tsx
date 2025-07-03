import * as React from 'react';
import { Card, CardContent, Box } from '@mui/material';
import { CreateBase, Form, Toolbar } from 'react-admin';
import { LeadInputs } from './LeadInputs';
import Breadcrumbs from '../misc/Breadcrumbs';
import PeopleIcon from '@mui/icons-material/People';

const LeadCreate = () => {
    const [formKey, setFormKey] = React.useState(0);

    return (
        <CreateBase
            redirect={false}
            mutationOptions={{
                onSuccess: () => setFormKey(k => k + 1)
            }}
        >
            <Box mt={2} display="flex">
                <Box flex="1">
                    <Breadcrumbs
                        items={[
                            { label: 'Leads', href: '/leads', icon: <PeopleIcon fontSize="small" /> },
                            { label: 'New Lead' }
                        ]}
                    />
                    <Form key={formKey}>
                        <Card>
                            <CardContent>
                                <LeadInputs />
                            </CardContent>
                            <Toolbar />
                        </Card>
                    </Form>
                </Box>
            </Box>
        </CreateBase>
    );
};

export default LeadCreate; 