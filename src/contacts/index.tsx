/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import { Contact } from '../types';
const ContactShow = React.lazy(() => import('./ContactShow').then(m => ({ default: m.ContactShow })));
const ContactList = React.lazy(() => import('./ContactList').then(m => ({ default: m.ContactList })));
const ContactEdit = React.lazy(() => import('./ContactEdit').then(m => ({ default: m.ContactEdit })));
const ContactCreate = React.lazy(() => import('./ContactCreate').then(m => ({ default: m.ContactCreate })));

export default {
    list: ContactList,
    show: ContactShow,
    edit: ContactEdit,
    create: ContactCreate,
    recordRepresentation: (record: Contact) =>
        record?.first_name + ' ' + record?.last_name,
};
