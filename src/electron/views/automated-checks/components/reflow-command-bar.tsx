// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { InsightsCommandButton } from 'common/components/controls/insights-command-button';
import { FastPassLeftNavHamburgerButton } from 'common/components/expand-collapse-left-nav-hamburger-button';
import { FlaggedComponent } from 'common/components/flagged-component';
import { DropdownClickHandler } from 'common/dropdown-click-handler';
import { NamedFC } from 'common/react/named-fc';
import { CardsViewModel } from 'common/types/store-data/card-view-model';
import { FeatureFlagStoreData } from 'common/types/store-data/feature-flag-store-data';
import { ScanMetadata } from 'common/types/store-data/unified-data-interface';
import { CommandBarButtonsMenu } from 'DetailsView/components/command-bar-buttons-menu';
import { NarrowModeStatus } from 'DetailsView/components/narrow-mode-detector';
import {
    ReportExportComponent,
    ReportExportComponentDeps,
} from 'DetailsView/components/report-export-component';
import { UnifiedFeatureFlags } from 'electron/common/unified-feature-flags';
import { ScanActionCreator } from 'electron/flux/action-creator/scan-action-creator';
import { ScanStatus } from 'electron/flux/types/scan-status';
import { ScanStoreData } from 'electron/flux/types/scan-store-data';
import { css } from 'office-ui-fabric-react';
import * as React from 'react';
import { ReportGenerator } from 'reports/report-generator';
import * as styles from './command-bar.scss';

export type ReflowCommandBarDeps = {
    scanActionCreator: ScanActionCreator;
    dropdownClickHandler: DropdownClickHandler;
    reportGenerator: ReportGenerator;
} & ReportExportComponentDeps;

export interface ReflowCommandBarProps {
    deps: ReflowCommandBarDeps;
    scanPort: number;
    scanStoreData: ScanStoreData;
    featureFlagStoreData: FeatureFlagStoreData;
    cardsViewData: CardsViewModel;
    scanMetadata: ScanMetadata;
    narrowModeStatus: NarrowModeStatus;
    isSideNavOpen: boolean;
    setSideNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const commandButtonRefreshId = 'command-button-refresh';
export const commandButtonSettingsId = 'command-button-settings';

export const ReflowCommandBar = NamedFC<ReflowCommandBarProps>('ReflowCommandBar', props => {
    const {
        deps,
        scanPort,
        featureFlagStoreData,
        cardsViewData,
        scanMetadata,
        narrowModeStatus,
        isSideNavOpen,
        setSideNavOpen,
    } = props;
    let exportReport: JSX.Element = null;

    if (scanMetadata != null) {
        exportReport = (
            <ReportExportComponent
                deps={deps}
                reportExportFormat={'AutomatedChecks'}
                pageTitle={scanMetadata.targetAppInfo.name}
                scanDate={scanMetadata.timespan.scanComplete}
                htmlGenerator={description =>
                    deps.reportGenerator.generateFastPassAutomatedChecksReport(
                        cardsViewData,
                        description,
                        scanMetadata,
                    )
                }
                updatePersistedDescription={() => null}
                getExportDescription={() => ''}
                featureFlagStoreData={featureFlagStoreData}
            />
        );
    }

    const startOverButtonProps = {
        'data-automation-id': commandButtonRefreshId,
        text: 'Start over',
        iconProps: { iconName: 'Refresh' },
        onClick: () => deps.scanActionCreator.scan(scanPort),
        disabled: props.scanStoreData.status === ScanStatus.Scanning,
    };

    const hamburgerMenuButton = !narrowModeStatus.isHeaderAndNavCollapsed ? null : (
        <FastPassLeftNavHamburgerButton
            isSideNavOpen={isSideNavOpen}
            setSideNavOpen={setSideNavOpen}
            className={styles.navMenu}
        />
    );

    const getFarButtons = () => {
        if (narrowModeStatus.isCommandBarCollapsed) {
            return (
                <CommandBarButtonsMenu
                    renderExportReportButton={() => exportReport}
                    getStartOverMenuItem={() => startOverButtonProps}
                    buttonRef={null}
                />
            );
        }

        return (
            <>
                <FlaggedComponent
                    enableJSXElement={exportReport}
                    featureFlagStoreData={featureFlagStoreData}
                    featureFlag={UnifiedFeatureFlags.exportReport}
                />
                <InsightsCommandButton {...startOverButtonProps} />
            </>
        );
    };

    return (
        <section className={styles.commandBar} aria-label="command bar">
            {hamburgerMenuButton}
            <div className={css(styles.farItems, styles.reflow)}>
                {getFarButtons()}
                <InsightsCommandButton
                    data-automation-id={commandButtonSettingsId}
                    ariaLabel="settings"
                    iconProps={{ iconName: 'Gear', className: styles.settingsGearButtonIcon }}
                    onClick={event =>
                        deps.dropdownClickHandler.openSettingsPanelHandler(event as any)
                    }
                    className={styles.settingsGearButton}
                />
            </div>
        </section>
    );
});
