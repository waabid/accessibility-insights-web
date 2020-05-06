// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { TestRequirementLeftNavLink } from 'DetailsView/components/left-nav/assessment-left-nav';
import { INavLink, Nav } from 'office-ui-fabric-react';
import * as React from 'react';

export type onBaseLeftNavItemClick = (
    event: React.MouseEvent<HTMLElement>,
    item: BaseLeftNavLink,
) => void;
export type onTestRequirementClick = (
    event: React.MouseEvent<HTMLElement>,
    item: TestRequirementLeftNavLink,
) => void;
export type onBaseLeftNavItemRender = (
    link: BaseLeftNavLink,
    renderIcon: (link: BaseLeftNavLink) => JSX.Element,
) => JSX.Element;

export type BaseLeftNavProps = {
    selectedKey: string;
    links: BaseLeftNavLink[];
    renderIcon: (link: BaseLeftNavLink) => JSX.Element;
};

export interface BaseLeftNavLink extends INavLink {
    percentComplete?: number;
    onRenderNavLink: onBaseLeftNavItemRender;
    onClickNavLink: onBaseLeftNavItemClick;
}

export interface BaseLeftNavLinkProps {
    link: BaseLeftNavLink;
    renderIcon: (link: BaseLeftNavLink) => JSX.Element;
}

export class BaseLeftNav extends React.Component<BaseLeftNavProps> {
    public static pivotItemsClassName = 'details-view-test-nav-area';
    public render(): JSX.Element {
        const { selectedKey, links } = this.props;

        return (
            <Nav
                className={BaseLeftNav.pivotItemsClassName}
                selectedKey={selectedKey}
                groups={[
                    {
                        links,
                    },
                ]}
                onRenderLink={this.onRenderLink}
                onLinkClick={this.onNavLinkClick}
                styles={{
                    chevronButton: 'hidden',
                }}
            />
        );
    }

    protected onNavLinkClick = (
        event: React.MouseEvent<HTMLElement>,
        item: BaseLeftNavLink,
    ): void => {
        if (item) {
            item.onClickNavLink(event, item);
        }
    };

    protected onRenderLink = (link: BaseLeftNavLink): JSX.Element => {
        return link.onRenderNavLink(link, this.props.renderIcon);
    };
}
