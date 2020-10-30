// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { FlaggedComponent } from 'common/components/flagged-component';
import { GetCardSelectionViewData } from 'common/get-card-selection-view-data';
import { IsResultHighlightUnavailable } from 'common/is-result-highlight-unavailable';
import { GetCardViewData } from 'common/rule-based-view-model-provider';
import { CardSelectionStoreData } from 'common/types/store-data/card-selection-store-data';
import { CardsViewModel } from 'common/types/store-data/card-view-model';
import { DetailsViewStoreData } from 'common/types/store-data/details-view-store-data';
import { FeatureFlagStoreData } from 'common/types/store-data/feature-flag-store-data';
import {
    ScanMetadata,
    UnifiedScanResultStoreData,
} from 'common/types/store-data/unified-data-interface';
import { UserConfigurationStoreData } from 'common/types/store-data/user-configuration-store';
import { CardsViewDeps } from 'DetailsView/components/cards-view';
import {
    SettingsPanel,
    SettingsPanelDeps,
} from 'DetailsView/components/details-view-overlay/settings-panel/settings-panel';
import { NarrowModeStatus } from 'DetailsView/components/narrow-mode-detector';
import { UnifiedFeatureFlags } from 'electron/common/unified-feature-flags';
import { LeftNavActionCreator } from 'electron/flux/action-creator/left-nav-action-creator';
import { ScanActionCreator } from 'electron/flux/action-creator/scan-action-creator';
import { WindowStateActionCreator } from 'electron/flux/action-creator/window-state-action-creator';
import { AndroidSetupStoreData } from 'electron/flux/types/android-setup-store-data';
import { LeftNavStoreData } from 'electron/flux/types/left-nav-store-data';
import { ScanStatus } from 'electron/flux/types/scan-status';
import { ScanStoreData } from 'electron/flux/types/scan-store-data';
import { WindowStateStoreData } from 'electron/flux/types/window-state-store-data';
import { ContentPageInfo } from 'electron/types/content-page-info';
import { ReflowCommandBar } from 'electron/views/automated-checks/components/reflow-command-bar';
import { TitleBar, TitleBarDeps } from 'electron/views/automated-checks/components/title-bar';
import { TestView } from 'electron/views/automated-checks/test-view';
import { DeviceDisconnectedPopup } from 'electron/views/device-disconnected-popup/device-disconnected-popup';
import { ContentPanelDeps } from 'electron/views/left-nav/content-panel-deps';
import { FluentLeftNav } from 'electron/views/left-nav/fluent-left-nav';
import { LeftNavDeps } from 'electron/views/left-nav/left-nav';
import { ScreenshotView } from 'electron/views/screenshot/screenshot-view';
import { ScreenshotViewModelProvider } from 'electron/views/screenshot/screenshot-view-model-provider';
import * as React from 'react';
import { CommandBar, CommandBarDeps } from './components/command-bar';
import * as styles from './main-application-view.scss';

export const mainApplicationViewAutomationId = 'automated-checks-view';

export type MainApplicationViewDeps = CommandBarDeps &
    TitleBarDeps &
    CardsViewDeps &
    LeftNavDeps &
    ContentPanelDeps &
    SettingsPanelDeps & {
        scanActionCreator: ScanActionCreator;
        leftNavActionCreator: LeftNavActionCreator;
        windowStateActionCreator: WindowStateActionCreator;
        getCardsViewData: GetCardViewData;
        getCardSelectionViewData: GetCardSelectionViewData;
        screenshotViewModelProvider: ScreenshotViewModelProvider;
        isResultHighlightUnavailable: IsResultHighlightUnavailable;
        getDateFromTimestamp: (timestamp: string) => Date;
    };

export type MainApplicationViewProps = {
    deps: MainApplicationViewDeps;
    scanStoreData: ScanStoreData;
    windowStateStoreData: WindowStateStoreData;
    userConfigurationStoreData: UserConfigurationStoreData;
    unifiedScanResultStoreData: UnifiedScanResultStoreData;
    cardSelectionStoreData: CardSelectionStoreData;
    detailsViewStoreData: DetailsViewStoreData;
    featureFlagStoreData: FeatureFlagStoreData;
    androidSetupStoreData: AndroidSetupStoreData;
    leftNavStoreData: LeftNavStoreData;
    narrowModeStatus: NarrowModeStatus;
};

export class MainApplicationView extends React.Component<MainApplicationViewProps> {
    public componentDidMount(): void {
        this.props.deps.scanActionCreator.scan(this.getScanPort());
    }

    public render(): JSX.Element {
        const { status } = this.props.scanStoreData;
        const {
            unifiedScanResultStoreData,
            cardSelectionStoreData,
            deps,
            userConfigurationStoreData,
        } = this.props;
        const { rules, results, toolInfo } = unifiedScanResultStoreData;

        const cardSelectionViewData = deps.getCardSelectionViewData(
            cardSelectionStoreData,
            unifiedScanResultStoreData,
            deps.isResultHighlightUnavailable,
        );

        const cardsViewData = deps.getCardsViewData(rules, results, cardSelectionViewData);
        deps.toolData = toolInfo;

        const highlightedResultUids = Object.keys(
            cardSelectionViewData.resultsHighlightStatus,
        ).filter(uid => cardSelectionViewData.resultsHighlightStatus[uid] === 'visible');

        const screenshotViewModel = deps.screenshotViewModelProvider(
            unifiedScanResultStoreData,
            highlightedResultUids,
        );

        const scanMetadata: ScanMetadata = this.getScanMetadata(
            status,
            unifiedScanResultStoreData,
            deps.getDateFromTimestamp,
        );

        const contentPageInfo: ContentPageInfo = this.getContentPageInfo();

        return (
            <div
                className={styles.mainApplicationView}
                data-automation-id={mainApplicationViewAutomationId}
            >
                <TitleBar
                    deps={this.props.deps}
                    pageTitle={contentPageInfo.title}
                    windowStateStoreData={this.props.windowStateStoreData}
                ></TitleBar>
                <div className={styles.applicationViewBody}>
                    {this.getLeftNav()}
                    <div className={styles.selectedContentContainer}>
                        {this.renderExpandedCommandBar(cardsViewData, scanMetadata)}
                        <div className={styles.selectedContent}>
                            <div className={styles.mainContentWrapper}>
                                {this.renderOriginalCommandBar(cardsViewData, scanMetadata)}
                                <main>
                                    <TestView
                                        deps={deps}
                                        scanStatus={status}
                                        scanMetadata={scanMetadata}
                                        userConfigurationStoreData={userConfigurationStoreData}
                                        cardsViewData={cardsViewData}
                                        contentPageInfo={contentPageInfo}
                                    />
                                </main>
                            </div>
                            {<ScreenshotView viewModel={screenshotViewModel} />}
                            {this.renderDeviceDisconnected()}
                        </div>
                    </div>
                </div>
                <SettingsPanel
                    layerClassName={styles.settingsPanelLayerHost}
                    deps={this.props.deps}
                    isOpen={this.props.detailsViewStoreData.currentPanel.isSettingsOpen}
                    featureFlagData={{}}
                    userConfigStoreState={this.props.userConfigurationStoreData}
                />
            </div>
        );
    }

    private getLeftNav(): JSX.Element {
        return (
            <FlaggedComponent
                featureFlag={UnifiedFeatureFlags.leftNavBar}
                featureFlagStoreData={this.props.featureFlagStoreData}
                enableJSXElement={
                    <FluentLeftNav
                        deps={this.props.deps}
                        isNavOpen={this.props.leftNavStoreData.leftNavVisible}
                        narrowModeStatus={this.props.narrowModeStatus}
                        selectedKey={this.props.leftNavStoreData.selectedKey}
                        setSideNavOpen={this.props.deps.leftNavActionCreator.setLeftNavVisible}
                    />
                }
            />
        );
    }

    private getContentPageInfo(): ContentPageInfo {
        const leftNavSelectedKey = this.props.leftNavStoreData.selectedKey;
        return this.props.deps.contentPagesInfo[leftNavSelectedKey];
    }

    private getConnectedDeviceName(): string {
        return this.props.androidSetupStoreData.selectedDevice?.friendlyName;
    }

    private getScanPort(): number {
        return this.props.androidSetupStoreData.scanPort;
    }

    private getScanMetadata(
        status: ScanStatus,
        unifiedScanResultStoreData: UnifiedScanResultStoreData,
        getDateFromTimestamp: (timestamp: string) => Date,
    ): ScanMetadata {
        return status !== ScanStatus.Completed
            ? null
            : {
                  timespan: {
                      scanComplete: getDateFromTimestamp(unifiedScanResultStoreData.timestamp),
                  },
                  toolData: unifiedScanResultStoreData.toolInfo,
                  targetAppInfo: unifiedScanResultStoreData.targetAppInfo,
                  deviceName: unifiedScanResultStoreData.platformInfo.deviceName,
              };
    }

    private renderStandardCommandBar(
        cardsViewData: CardsViewModel,
        scanMetadata: ScanMetadata,
    ): JSX.Element {
        return (
            <CommandBar
                deps={this.props.deps}
                scanPort={this.getScanPort()}
                scanStoreData={this.props.scanStoreData}
                featureFlagStoreData={this.props.featureFlagStoreData}
                cardsViewData={cardsViewData}
                scanMetadata={scanMetadata}
            />
        );
    }

    private renderReflowCommandBar(
        cardsViewData: CardsViewModel,
        scanMetadata: ScanMetadata,
    ): JSX.Element {
        return (
            <ReflowCommandBar
                cardsViewData={cardsViewData}
                deps={this.props.deps}
                featureFlagStoreData={this.props.featureFlagStoreData}
                isSideNavOpen={this.props.leftNavStoreData.leftNavVisible}
                narrowModeStatus={this.props.narrowModeStatus}
                scanMetadata={scanMetadata}
                scanPort={this.getScanPort()}
                scanStoreData={this.props.scanStoreData}
                setSideNavOpen={this.props.deps.leftNavActionCreator.setLeftNavVisible}
            />
        );
    }

    private renderExpandedCommandBar(
        cardsViewData: CardsViewModel,
        scanMetadata: ScanMetadata,
    ): JSX.Element {
        return (
            <FlaggedComponent
                featureFlag={UnifiedFeatureFlags.leftNavBar}
                featureFlagStoreData={this.props.featureFlagStoreData}
                enableJSXElement={this.renderReflowCommandBar(cardsViewData, scanMetadata)}
                disableJSXElement={null}
            />
        );
    }

    private renderOriginalCommandBar(
        cardsViewData: CardsViewModel,
        scanMetadata: ScanMetadata,
    ): JSX.Element {
        return (
            <FlaggedComponent
                featureFlag={UnifiedFeatureFlags.leftNavBar}
                featureFlagStoreData={this.props.featureFlagStoreData}
                enableJSXElement={null}
                disableJSXElement={this.renderStandardCommandBar(cardsViewData, scanMetadata)}
            />
        );
    }

    private renderDeviceDisconnected(): JSX.Element {
        if (this.props.scanStoreData.status !== ScanStatus.Failed) {
            return;
        }

        return (
            <DeviceDisconnectedPopup
                deviceName={this.getConnectedDeviceName()}
                onConnectNewDevice={() =>
                    this.props.deps.windowStateActionCreator.setRoute({
                        routeId: 'deviceConnectView',
                    })
                }
                onRescanDevice={() => this.props.deps.scanActionCreator.scan(this.getScanPort())}
            />
        );
    }
}
