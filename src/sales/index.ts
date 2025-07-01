/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
const SalesList = React.lazy(() => import('./SalesList').then(m => ({ default: m.SalesList })));
const SalesCreate = React.lazy(() => import('./SalesCreate').then(m => ({ default: m.SalesCreate })));
const SalesEdit = React.lazy(() => import('./SalesEdit').then(m => ({ default: m.SalesEdit })));
import { Sale } from '../types';

export default {
    list: SalesList,
    create: SalesCreate,
    edit: SalesEdit,
    recordRepresentation: (record: Sale) =>
        `${record.first_name} ${record.last_name}`,
};
