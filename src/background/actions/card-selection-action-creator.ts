// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { StoreNames } from 'common/stores/store-names';

import * as TelemetryEvents from '../../common/extension-telemetry-events';
import { getStoreStateMessage, Messages } from '../../common/messages';
import { CardSelectionActions } from '../actions/card-selection-actions';
import { Interpreter } from '../interpreter';
import { TelemetryEventHandler } from '../telemetry/telemetry-event-handler';
import { BaseActionPayload, CardSelectionPayload, RuleExpandCollapsePayload } from './action-payloads';

export class CardSelectionActionCreator {
    constructor(
        private readonly interpreter: Interpreter,
        private readonly cardSelectionActions: CardSelectionActions,
        private readonly telemetryEventHandler: TelemetryEventHandler,
    ) {}

    public registerCallbacks(): void {
        this.interpreter.registerTypeToPayloadCallback(Messages.CardSelection.CardSelectionToggled, this.onCardSelectionToggle);
        this.interpreter.registerTypeToPayloadCallback(Messages.CardSelection.RuleExpansionToggled, this.onRuleExpansionToggle);
        this.interpreter.registerTypeToPayloadCallback(getStoreStateMessage(StoreNames.CardSelectionStore), this.onGetCurrentState);
    }

    private onGetCurrentState = (): void => {
        this.cardSelectionActions.getCurrentState.invoke(null);
    };

    private onCardSelectionToggle = (payload: CardSelectionPayload): void => {
        this.cardSelectionActions.toggleCardSelection.invoke(payload);
        this.telemetryEventHandler.publishTelemetry(TelemetryEvents.CARD_SELECTION_TOGGLED, payload);
    };

    private onRuleExpansionToggle = (payload: RuleExpandCollapsePayload): void => {
        this.cardSelectionActions.toggleRuleExpandCollapse.invoke(payload);
        this.telemetryEventHandler.publishTelemetry(TelemetryEvents.RULE_EXPANSION_TOGGLED, payload);
    };

    private onToggleVisualHelper = (payload: BaseActionPayload): void => {
        this.cardSelectionActions.toggleVisualHelper.invoke(null);
        this.telemetryEventHandler.publishTelemetry(TelemetryEvents.CARDS_VISUAL_HELPER_TOGGLED, payload);
    };
}
