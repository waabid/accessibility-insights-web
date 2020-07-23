// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { ExpandCollpaseLeftNavButtonProps } from 'common/components/expand-collapse-left-nav-hamburger-button';
import { FlaggedComponent } from 'common/components/flagged-component';
import { GearMenuButton, GearMenuButtonDeps } from 'common/components/gear-menu-button';
import { Header, HeaderDeps } from 'common/components/header';
import { FeatureFlags } from 'common/feature-flags';
import { NamedFC, ReactFCWithDisplayName } from 'common/react/named-fc';
import { DetailsViewPivotType } from 'common/types/details-view-pivot-type';
import { FeatureFlagStoreData } from 'common/types/store-data/feature-flag-store-data';
import { NarrowModeStatus } from 'DetailsView/components/narrow-mode-detector';
import { headerSwitcherStyleNames } from 'DetailsView/components/switcher-style-names';
import * as React from 'react';
import { Switcher, SwitcherDeps } from './switcher';

export type InteractiveHeaderDeps = SwitcherDeps & HeaderDeps & GearMenuButtonDeps;

export interface InteractiveHeaderProps {
    deps: InteractiveHeaderDeps;
    featureFlagStoreData: FeatureFlagStoreData;
    tabClosed: boolean;
    selectedPivot: DetailsViewPivotType;
    navMenu: ReactFCWithDisplayName<ExpandCollpaseLeftNavButtonProps>;
    narrowModeStatus: NarrowModeStatus;
    isSideNavOpen: boolean;
    setSideNavOpen: (isOpen: boolean, event?: React.MouseEvent<any>) => void;
    showFarItems?: boolean;
    showHeaderTitle?: boolean;
}

export const InteractiveHeader = NamedFC<InteractiveHeaderProps>('InteractiveHeader', props => {
    if (props.tabClosed) {
        return <Header deps={props.deps} narrowModeStatus={props.narrowModeStatus} />;
    }

    const isNavCollapsed = props.narrowModeStatus.isHeaderAndNavCollapsed;
    const getNavMenu = () => {
        if (isNavCollapsed === false) {
            return null;
        }

        return (
            <props.navMenu
                setSideNavOpen={props.setSideNavOpen}
                isSideNavOpen={props.isSideNavOpen}
            />
        );
    };

    const getFarItems = () => {
        return <GearMenuButton deps={props.deps} featureFlagData={props.featureFlagStoreData} />;
    };

    return (
        <Header
            deps={props.deps}
            items={null}
            farItems={getFarItems()}
            navMenu={getNavMenu()}
            showHeaderTitle={props.showHeaderTitle}
            showFarItems={props.showFarItems}
            narrowModeStatus={props.narrowModeStatus}
        ></Header>
    );
});
