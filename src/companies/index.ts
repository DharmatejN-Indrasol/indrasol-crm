/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import { lazy } from 'react';
import { CompanyList } from './CompanyList';
import { CompanyCreate } from './CompanyCreate';
import { CompanyShow } from './CompanyShow';
import { CompanyEdit } from './CompanyEdit';

const CompanyListLazy = lazy(() => import('./CompanyList').then(m => ({ default: m.CompanyList })));
const CompanyShowLazy = lazy(() => import('./CompanyShow').then(m => ({ default: m.CompanyShow })));
const CompanyEditLazy = lazy(() => import('./CompanyEdit').then(m => ({ default: m.CompanyEdit })));
const CompanyCreateLazy = lazy(() => import('./CompanyCreate').then(m => ({ default: m.CompanyCreate })));

export default {
    list: CompanyListLazy,
    create: CompanyCreateLazy,
    edit: CompanyEditLazy,
    show: CompanyShowLazy,
};
