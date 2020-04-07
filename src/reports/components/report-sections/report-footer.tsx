// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { NamedFC } from 'common/react/named-fc';
import * as React from 'react';
import {
    reportFooter,
    reportFooterContainer,
} from 'reports/components/report-sections/footer-section.scss';

export const ReportFooter = NamedFC('ReportFooter', ({ children }) => {
    return (
        <div className={reportFooterContainer}>
            <div className={reportFooter} role="contentinfo">
                {children}
            </div>
        </div>
    );
});
