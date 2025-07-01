/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
const DealList = React.lazy(() => import('./DealList').then(m => ({ default: m.default })));

export default {
    list: DealList,
};
