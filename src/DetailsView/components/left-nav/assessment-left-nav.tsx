// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { AssessmentsProvider } from 'assessments/types/assessments-provider';
import { VisualizationType } from 'common/types/visualization-type';
import * as React from 'react';
import { NamedFC } from '../../../common/react/named-fc';
import { ManualTestStatus, ManualTestStatusData } from '../../../common/types/manual-test-status';
import { DictionaryStringTo } from '../../../types/common-types';
import { BaseLeftNav, BaseLeftNavLink } from '../base-left-nav';
import { LeftNavIndexIcon, LeftNavStatusIcon } from './left-nav-icon';
import {
    AssessmentLinkBuilderDeps,
    LeftNavLinkBuilder,
    OverviewLinkBuilderDeps,
} from './left-nav-link-builder';
import { NavLinkHandler } from './nav-link-handler';

export type AssessmentLeftNavDeps = {
    leftNavLinkBuilder: LeftNavLinkBuilder;
    navLinkHandler: NavLinkHandler;
} & OverviewLinkBuilderDeps &
    AssessmentLinkBuilderDeps;

export type AssessmentLeftNavProps = {
    deps: AssessmentLeftNavDeps;
    selectedKey: string;
    assessmentsProvider: AssessmentsProvider;
    assessmentsData: DictionaryStringTo<ManualTestStatusData>;
};

export type AssessmentLeftNavLink = {
    status: ManualTestStatus;
} & BaseLeftNavLink;

export type TestRequirementLeftNavLink = {
    displayedIndex: string;
    testType: VisualizationType;
} & AssessmentLeftNavLink;

export const AssessmentLeftNav = NamedFC<AssessmentLeftNavProps>('AssessmentLeftNav', props => {
    const { deps, selectedKey, assessmentsProvider, assessmentsData } = props;

    const { navLinkHandler, leftNavLinkBuilder } = deps;

    const renderAssessmentIcon = (link: AssessmentLeftNavLink) => {
        if (link.status === ManualTestStatus.UNKNOWN) {
            return <LeftNavIndexIcon item={link} />;
        }

        return <LeftNavStatusIcon item={link} />;
    };

    let links = [];
    links.push(
        leftNavLinkBuilder.buildOverviewLink(
            deps,
            navLinkHandler.onOverviewClick,
            assessmentsProvider,
            assessmentsData,
            0,
        ),
    );
    links = links.concat(
        leftNavLinkBuilder.buildNewAssessmentTestLinks(
            deps,
            navLinkHandler.onAssessmentTestClick,
            assessmentsProvider,
            assessmentsData,
            1,
            navLinkHandler.onRequirementClick,
        ),
    );

    return (
        <BaseLeftNav renderIcon={renderAssessmentIcon} selectedKey={selectedKey} links={links} />
    );
});
