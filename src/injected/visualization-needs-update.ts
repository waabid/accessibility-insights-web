// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { VisualizationType } from 'common/types/visualization-type';
import { AssessmentVisualizationInstance } from 'injected/frameCommunicators/html-element-axe-results-helper';
import { VisualizationSelectorMapContainer } from 'injected/target-page-visualization-updater';
import { isEqual } from 'lodash';
import { DictionaryStringTo } from 'types/common-types';

export type VisualizationNeedsUpdateCallback = (
    visualizationType: VisualizationType,
    id: string,
    newVisualizationEnabledState: boolean,
    newSelectorMapState: DictionaryStringTo<AssessmentVisualizationInstance>,
    previousVisualizationStates: DictionaryStringTo<boolean>,
    previousVisualizationSelectorMapData: VisualizationSelectorMapContainer,
) => boolean;

export const visualizationNeedsUpdate: VisualizationNeedsUpdateCallback = (
    visualizationType,
    id,
    newVisualizationEnabledState,
    newSelectorMapState,
    previousVisualizationStates,
    previousVisualizationSelectorMapData,
) => {
    if (id in previousVisualizationStates === false) {
        return newVisualizationEnabledState;
    }

    return (
        previousVisualizationStates[id] !== newVisualizationEnabledState ||
        !isEqual(newSelectorMapState, previousVisualizationSelectorMapData[visualizationType])
    );
};
