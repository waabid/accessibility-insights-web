// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { DropdownClickHandler } from 'common/dropdown-click-handler';
import { FileURLProvider } from 'common/file-url-provider';
import { NamedFC } from 'common/react/named-fc';
import { ScanActionCreator } from 'electron/flux/action-creator/scan-action-creator';
import { DeviceStoreData } from 'electron/flux/types/device-store-data';
import { ScanStatus } from 'electron/flux/types/scan-status';
import { ScanStoreData } from 'electron/flux/types/scan-store-data';
import { ActionButton, CommandButton } from 'office-ui-fabric-react';
import * as React from 'react';

import * as styles from './command-bar.scss';

export type CommandBarDeps = {
    scanActionCreator: ScanActionCreator;
    dropdownClickHandler: DropdownClickHandler;
    fileURLProvider: FileURLProvider;
};

export interface CommandBarProps {
    deps: CommandBarDeps;
    deviceStoreData: DeviceStoreData;
    scanStoreData: ScanStoreData;
    reportHTML: string;
}

export const commandButtonRefreshId = 'command-button-refresh';
export const commandButtonSettingsId = 'command-button-settings';

export const CommandBar = NamedFC<CommandBarProps>('CommandBar', props => {
    const { deps, deviceStoreData } = props;

    const fileURL = props.deps.fileURLProvider.provideURL([props.reportHTML], 'text/html');

    return (
        <section className={styles.commandBar} aria-label="command bar">
            <div className={styles.items}>
                <CommandButton
                    data-automation-id={commandButtonRefreshId}
                    text="Start over"
                    iconProps={{ iconName: 'Refresh', className: styles.buttonIcon }}
                    className={styles.menuItemButton}
                    onClick={() => deps.scanActionCreator.scan(deviceStoreData.port)}
                    disabled={props.scanStoreData.status === ScanStatus.Scanning}
                />
            </div>
            <div className={styles.farItems}>
                <ActionButton
                    iconProps={{ iconName: 'Export' }}
                    download={'atestfile.html'}
                    href={fileURL}
                >
                    Export result
                </ActionButton>
                <CommandButton
                    data-automation-id={commandButtonSettingsId}
                    ariaLabel="settings"
                    iconProps={{ iconName: 'Gear', className: styles.buttonIcon }}
                    className={styles.menuItemButton}
                    onClick={event =>
                        deps.dropdownClickHandler.openSettingsPanelHandler(event as any)
                    }
                />
            </div>
        </section>
    );
});
