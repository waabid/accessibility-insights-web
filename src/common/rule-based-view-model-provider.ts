// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { HighlightState } from 'common/components/cards/instance-details-footer';
import { CardSelectionViewData } from 'common/get-card-selection-view-data';
import { includes } from 'lodash';
import {
    AllRuleResultStatuses,
    CardResult,
    CardRuleResult,
    CardRuleResultsByStatus,
    CardRuleResultStatus,
    CardsViewModel,
} from './types/store-data/card-view-model';
import { UnifiedResult, UnifiedRule } from './types/store-data/unified-data-interface';

export type GetCardViewData = (
    rules: UnifiedRule[],
    results: UnifiedResult[],
    cardSelectionViewData: CardSelectionViewData,
) => CardsViewModel;

export const getCardViewData: GetCardViewData = (
    rules: UnifiedRule[],
    results: UnifiedResult[],
    cardSelectionViewData: CardSelectionViewData,
): CardsViewModel => {
    if (results == null || rules == null || cardSelectionViewData == null) {
        return null;
    }

    const statusResults = getEmptyStatusResults();
    const ruleIdsWithResultNodes: Set<string> = new Set();

    for (const result of results) {
        const ruleResults = statusResults[result.status];
        const isFailedInstance = result.status === 'fail';
        let ruleResult = getExistingRuleFromResults(result.ruleId, ruleResults);

        if (!ruleResult) {
            const rule = getUnifiedRule(result.ruleId, rules);
            if (!rule) {
                continue;
            }

            const isExpanded = isFailedInstance
                ? includes(cardSelectionViewData.expandedRuleIds, rule.id)
                : false;

            ruleResult = createCardRuleResult(result.status, rule, isExpanded);
            ruleResults.push(ruleResult);
        }

        const isSelected = isFailedInstance
            ? includes(cardSelectionViewData.selectedResultUids, result.uid)
            : false;
        const highlightStatus = cardSelectionViewData.resultHighlightStatus[result.uid];

        ruleResult.nodes.push(createCardResult(result, isSelected, highlightStatus));

        ruleIdsWithResultNodes.add(result.ruleId);
    }

    for (const rule of rules) {
        if (!ruleIdsWithResultNodes.has(rule.id)) {
            statusResults.inapplicable.push(createRuleResultWithoutNodes('inapplicable', rule));
        }
    }

    return {
        cards: statusResults,
        visualHelperEnabled: cardSelectionViewData.visualHelperEnabled,
        allCardsCollapsed: cardSelectionViewData.expandedRuleIds.length === 0,
    };
};

const getExistingRuleFromResults = (
    ruleId: string,
    ruleResults: CardRuleResult[],
): CardRuleResult => {
    const ruleResultIndex: number = getRuleResultIndex(ruleId, ruleResults);

    return ruleResultIndex !== -1 ? ruleResults[ruleResultIndex] : null;
};

const getEmptyStatusResults = (): CardRuleResultsByStatus => {
    const statusResults = {};

    AllRuleResultStatuses.forEach(status => {
        statusResults[status] = [];
    });

    return statusResults as CardRuleResultsByStatus;
};

const getHighlightStatus = (
    isFailedInstance: boolean,
    highlightedResultUids: string[],
    resultUid: string,
) => {
    if (!isFailedInstance) {
        return 'unavailable';
    }

    if (includes(highlightedResultUids, resultUid)) {
        return 'visible';
    }

    return 'hidden';
};

const createCardRuleResult = (
    status: string,
    rule: UnifiedRule,
    isExpanded: boolean,
): CardRuleResult => ({
    id: rule.id,
    status: status,
    nodes: [],
    description: rule.description,
    url: rule.url,
    guidance: rule.guidance,
    isExpanded: isExpanded,
});

const createRuleResultWithoutNodes = (
    status: CardRuleResultStatus,
    rule: UnifiedRule,
): CardRuleResult => ({
    id: rule.id,
    status: status,
    nodes: [],
    description: rule.description,
    url: rule.url,
    guidance: rule.guidance,
    isExpanded: false,
});

const createCardResult = (
    unifiedResult: UnifiedResult,
    isSelected: boolean,
    highlightStatus: HighlightState,
): CardResult => {
    return {
        ...unifiedResult,
        isSelected,
        highlightStatus,
    };
};

const getUnifiedRule = (id: string, rules: UnifiedRule[]): UnifiedRule =>
    rules.find(rule => rule.id === id);

const getRuleResultIndex = (ruleId: string, ruleResults: CardRuleResult[]): number =>
    ruleResults.findIndex(result => result.id === ruleId);
