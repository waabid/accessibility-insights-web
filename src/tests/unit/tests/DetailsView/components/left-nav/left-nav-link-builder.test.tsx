// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { isMatch } from 'lodash';
import { IMock, Mock, MockBehavior } from 'typemoq';

import { AssessmentsProviderImpl } from 'assessments/assessments-provider';
import { AssessmentsProvider } from 'assessments/types/assessments-provider';
import { Assessment } from 'assessments/types/iassessment';
import { OverviewSummaryReportModel } from 'reports/assessment-report-model';
import { OutcomeTypeSemantic } from 'reports/components/outcome-type';
import { RequirementOutcomeStats } from 'reports/components/requirement-outcome-type';
import { GetAssessmentSummaryModelFromProviderAndStatusData } from 'reports/get-assessment-summary-model';
import { VisualizationConfiguration } from '../../../../../../common/configs/visualization-configuration';
import {
    ManualTestStatus,
    ManualTestStatusData,
} from '../../../../../../common/types/manual-test-status';
import { VisualizationType } from '../../../../../../common/types/visualization-type';
import {
    BaseLeftNavLink,
    onBaseLeftNavItemClick,
} from '../../../../../../DetailsView/components/base-left-nav';
import {
    LeftNavLinkBuilder,
    LeftNavLinkBuilderDeps,
} from '../../../../../../DetailsView/components/left-nav/left-nav-link-builder';
import { DictionaryStringTo } from '../../../../../../types/common-types';

describe('LeftNavBuilder', () => {
    let deps: LeftNavLinkBuilderDeps;
    let onLinkClickMock: IMock<onBaseLeftNavItemClick>;
    let assessmentProviderMock: IMock<AssessmentsProvider>;
    let assessmentsDataStub: DictionaryStringTo<ManualTestStatusData>;
    let testSubject: LeftNavLinkBuilder;
    let getAssessmentSummaryModelFromProviderAndStatusDataMock: IMock<GetAssessmentSummaryModelFromProviderAndStatusData>;
    let renderIconStub: (link: BaseLeftNavLink) => JSX.Element;
    let getStatusForTestMock: IMock<(stats: RequirementOutcomeStats) => ManualTestStatus>;
    let outcomeTypeFromTestStatusMock: IMock<(testStatus: ManualTestStatus) => OutcomeTypeSemantic>;
    let outcomeStatsFromManualTestStatusMock: IMock<(
        testStepStatus: ManualTestStatusData,
    ) => RequirementOutcomeStats>;

    beforeEach(() => {
        onLinkClickMock = Mock.ofInstance((e, item) => null, MockBehavior.Strict);
        getStatusForTestMock = Mock.ofInstance(_ => null, MockBehavior.Strict);
        outcomeTypeFromTestStatusMock = Mock.ofInstance(_ => null, MockBehavior.Strict);
        outcomeStatsFromManualTestStatusMock = Mock.ofInstance(_ => null, MockBehavior.Strict);
        assessmentProviderMock = Mock.ofType(AssessmentsProviderImpl, MockBehavior.Strict);
        getAssessmentSummaryModelFromProviderAndStatusDataMock = Mock.ofInstance(
            (provider, statusData) => null,
            MockBehavior.Strict,
        );
        assessmentsDataStub = {};
        renderIconStub = _ => null;

        deps = {
            getStatusForTest: getStatusForTestMock.object,
            outcomeStatsFromManualTestStatus: outcomeStatsFromManualTestStatusMock.object,
            outcomeTypeSemanticsFromTestStatus: outcomeTypeFromTestStatusMock.object,
            getAssessmentSummaryModelFromProviderAndStatusData:
                getAssessmentSummaryModelFromProviderAndStatusDataMock.object,
        } as LeftNavLinkBuilderDeps;

        testSubject = new LeftNavLinkBuilder();
    });

    describe('buildOverviewLink', () => {
        it('should build overview link', () => {
            const index = -1;
            const incomplete = 25;
            const expectedPercentComplete = 100 - incomplete;
            const expectedTitle = `Overview ${expectedPercentComplete}% Completed`;
            const reportModelStub = {
                byPercentage: {
                    incomplete,
                },
            } as OverviewSummaryReportModel;

            getAssessmentSummaryModelFromProviderAndStatusDataMock
                .setup(mock => mock(assessmentProviderMock.object, assessmentsDataStub))
                .returns(() => reportModelStub);

            const actual = testSubject.buildOverviewLink(
                deps,
                onLinkClickMock.object,
                assessmentProviderMock.object,
                assessmentsDataStub,
                index,
            );

            const expected = {
                name: 'Overview',
                key: 'Overview',
                forceAnchor: true,
                url: '',
                index,
                iconProps: {
                    className: 'hidden',
                },
                onClickNavLink: onLinkClickMock.object,
                title: expectedTitle,
                percentComplete: expectedPercentComplete,
            };

            expect(isMatch(actual, expected)).toBeTruthy();
            expect(actual.onRenderNavLink(actual, renderIconStub)).toMatchSnapshot();
        });
    });

    describe('buildVisualizationConfigurationLink', () => {
        it('should build link using configuration', () => {
            const index = -1;
            const visualizationTypeStub = 1;
            const titleStub = 'some title';
            const configStub = {
                displayableData: {
                    title: titleStub,
                },
            } as VisualizationConfiguration;

            const actual = testSubject.buildVisualizationConfigurationLink(
                configStub,
                onLinkClickMock.object,
                visualizationTypeStub,
                index,
            );

            const expected = {
                name: titleStub,
                key: VisualizationType[visualizationTypeStub],
                forceAnchor: true,
                url: '',
                index,
                iconProps: {
                    className: 'hidden',
                },
                onClickNavLink: onLinkClickMock.object,
            };

            expect(isMatch(actual, expected)).toBeTruthy();
            expect(actual.onRenderNavLink(actual, renderIconStub)).toMatchSnapshot();
        });
    });

    describe('buildAssessmentTestLinks', () => {
        it('should build links for assessments', () => {
            const startingIndexStub = -1;
            const assessmentStub = {
                key: 'some key',
                title: 'some title',
                visualizationType: 1,
            } as Assessment;
            const assessmentsStub = [assessmentStub, assessmentStub];
            const stepStatusStub: ManualTestStatusData = {};
            const outcomeStatsStub = {} as RequirementOutcomeStats;
            const testStatusStub = -2 as ManualTestStatus;
            const narratorStatusStub = { pastTense: 'passed' } as OutcomeTypeSemantic;

            assessmentsDataStub = {
                [assessmentStub.key]: stepStatusStub,
            };

            assessmentProviderMock.setup(apm => apm.all()).returns(() => assessmentsStub);

            outcomeStatsFromManualTestStatusMock
                .setup(mock => mock(stepStatusStub))
                .returns(() => outcomeStatsStub);

            getStatusForTestMock
                .setup(mock => mock(outcomeStatsStub))
                .returns(() => testStatusStub);

            outcomeTypeFromTestStatusMock
                .setup(mock => mock(testStatusStub))
                .returns(() => narratorStatusStub);

            const links = testSubject.buildAssessmentTestLinks(
                deps,
                onLinkClickMock.object,
                assessmentProviderMock.object,
                assessmentsDataStub,
                startingIndexStub,
            );

            links.forEach((actual, linkIndex) => {
                const expected = {
                    name: assessmentStub.title,
                    key: VisualizationType[assessmentStub.visualizationType],
                    forceAnchor: true,
                    url: '',
                    index: startingIndexStub + linkIndex,
                    iconProps: {
                        className: 'hidden',
                    },
                    onClickNavLink: onLinkClickMock.object,
                    status: testStatusStub,
                    title: `${startingIndexStub + linkIndex}: ${assessmentStub.title} (${
                        narratorStatusStub.pastTense
                    })`,
                };
                expect(isMatch(actual, expected)).toBeTruthy();
                expect(actual).toMatchObject(expected);
                expect(actual.onRenderNavLink(actual, renderIconStub)).toMatchSnapshot();
            });
        });
    });
});
