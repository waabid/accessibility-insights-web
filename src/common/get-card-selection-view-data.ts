// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { HighlightState } from 'common/components/cards/instance-details-footer';
import {
    PlatformData,
    UnifiedResult,
    ViewPortProperties,
    UnifiedScanResultStoreData,
} from 'common/types/store-data/unified-data-interface';
import { BoundingRectangle } from 'electron/platform/android/scan-results';
import { flatMap, forOwn, includes, keys } from 'lodash';

import {
    CardSelectionStoreData,
    RuleExpandCollapseData,
    RuleExpandCollapseDataDictionary,
} from './types/store-data/card-selection-store-data';

export interface CardSelectionViewData {
    highlightedResultUids: string[]; // page elements to highlight
    selectedResultUids: string[]; // indicates selected cards
    expandedRuleIds: string[];
    visualHelperEnabled: boolean;
    resultHighlightStatus: { [resultId: string]: HighlightState };
}

export type GetCardSelectionViewData = (
    storeData: CardSelectionStoreData,
    unifiedScanResultStoreData: UnifiedScanResultStoreData,
) => CardSelectionViewData;

export const getCardSelectionViewData: GetCardSelectionViewData = (
    cardSelectionStoreData: CardSelectionStoreData,
    unifiedScanResultStoreData: UnifiedScanResultStoreData,
): CardSelectionViewData => {
    const viewData = getEmptyViewData();

    if (!cardSelectionStoreData) {
        return viewData;
    }

    viewData.visualHelperEnabled = cardSelectionStoreData.visualHelperEnabled || false;

    viewData.expandedRuleIds = getRuleIdsOfExpandedRules(cardSelectionStoreData.rules);

    if (!cardSelectionStoreData.visualHelperEnabled) {
        // no selected cards; no highlighted instances
        return viewData;
    }

    if (viewData.expandedRuleIds.length === 0) {
        viewData.highlightedResultUids = getAllResultUids(cardSelectionStoreData.rules);
        return viewData;
    }

    viewData.selectedResultUids = getOnlyResultUidsFromSelectedCards(
        cardSelectionStoreData.rules,
        viewData.expandedRuleIds,
    );

    viewData.highlightedResultUids = viewData.selectedResultUids.length
        ? viewData.selectedResultUids
        : getAllResultUidsFromRuleIdArray(cardSelectionStoreData.rules, viewData.expandedRuleIds);

    return viewData;
};

function getEmptyViewData(): CardSelectionViewData {
    const viewData: CardSelectionViewData = {
        highlightedResultUids: [],
        selectedResultUids: [],
        expandedRuleIds: [],
        visualHelperEnabled: false,
        resultHighlightStatus: {},
    };

    return viewData;
}

const getHighlightStatus = (
    highlightedResultUids: string[],
    resultUid: string,
    result: UnifiedResult,
    platformInfo: PlatformData,
) => {
    if (
        !hasValidBoundingRectangle(result.descriptors.boundingRectangle, platformInfo.viewPortInfo)
    ) {
        return 'unavailable';
    }

    if (includes(highlightedResultUids, resultUid)) {
        return 'visible';
    }

    return 'hidden';
};

function hasValidBoundingRectangle(
    boundingRectangle: BoundingRectangle,
    viewPort: ViewPortProperties,
): boolean {
    return (
        boundingRectangle != null &&
        !(boundingRectangle.left > viewPort.width || boundingRectangle.top > viewPort.height)
    );
}

function getRuleIdsOfExpandedRules(ruleDictionary: RuleExpandCollapseDataDictionary): string[] {
    if (!ruleDictionary) {
        return [];
    }

    const expandedRuleIds: string[] = [];

    forOwn(ruleDictionary, (rule, ruleId) => {
        if (rule.isExpanded) {
            expandedRuleIds.push(ruleId);
        }
    });

    return expandedRuleIds;
}

function getAllResultUids(ruleDictionary: RuleExpandCollapseDataDictionary): string[] {
    return getAllResultUidsFromRuleIdArray(ruleDictionary, keys(ruleDictionary));
}

function getAllResultUidsFromRuleIdArray(
    ruleDictionary: RuleExpandCollapseDataDictionary,
    ruleIds: string[],
): string[] {
    return flatMap(ruleIds, key => getAllResultUidsFromRule(ruleDictionary[key]));
}

function getAllResultUidsFromRule(rule: RuleExpandCollapseData): string[] {
    return keys(rule.cards);
}

function getOnlyResultUidsFromSelectedCards(
    ruleDictionary: RuleExpandCollapseDataDictionary,
    ruleIds: string[],
): string[] {
    return flatMap(ruleIds, key => getResultUidsFromSelectedCards(ruleDictionary[key]));
}

function getResultUidsFromSelectedCards(rule: RuleExpandCollapseData): string[] {
    const results: string[] = [];

    forOwn(rule.cards, (value, key) => {
        if (value) {
            results.push(key);
        }
    });

    return results;
}
