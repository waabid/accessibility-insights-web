// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { getNarrowModeThresholdsForUnified } from 'electron/common/narrow-mode-thresholds';
import { UnifiedFeatureFlags } from 'electron/common/unified-feature-flags';
import * as fs from 'fs';
import * as path from 'path';
import { createApplication } from 'tests/electron/common/create-application';
import {
    MainApplicationViewSelectors,
    ScreenshotViewSelectors,
} from 'tests/electron/common/element-identifiers/main-application-view-selectors';
import { scanForAccessibilityIssuesInAllModes } from 'tests/electron/common/scan-for-accessibility-issues';
import { AppController } from 'tests/electron/common/view-controllers/app-controller';
import { MainApplicationViewController } from 'tests/electron/common/view-controllers/main-application-view-controller';
import { commonAdbConfigs, setupMockAdb } from 'tests/miscellaneous/mock-adb/setup-mock-adb';
import { testResourceServerConfig } from '../setup/test-resource-server-config';
import { androidTestConfigs } from 'electron/platform/android/test-configs/android-test-configs';
import { RawResult } from 'webdriverio';

describe('MainApplicationView', () => {
    let app: AppController;
    let mainApplicationView: MainApplicationViewController;
    const narrowModeThresholds = getNarrowModeThresholdsForUnified();
    const height = 400;

    beforeEach(async () => {
        await setupMockAdb(
            commonAdbConfigs['single-device'],
            path.basename(__filename),
            'beforeEach',
        );
        app = await createApplication({ suppressFirstTimeDialog: true });
        mainApplicationView = await app.openMainApplicationView();
        await mainApplicationView.waitForScreenshotViewVisible();
    });

    afterEach(async () => {
        if (app != null) {
            await app.stop();
        }
    });

    it('should use the expected window title', async () => {
        expect(await app.getTitle()).toBe('Accessibility Insights for Android - Automated checks');
    });

    it('displays automated checks results collapsed by default', async () => {
        mainApplicationView.waitForRuleGroupCount(3);

        const collapsibleContentElements = await mainApplicationView.queryRuleGroupContents();
        expect(collapsibleContentElements).toHaveLength(0);
    });

    it('supports expanding and collapsing rule groups', async () => {
        await mainApplicationView.waitForHighlightBoxCount(4);
        expect(await mainApplicationView.queryRuleGroupContents()).toHaveLength(0);

        await mainApplicationView.toggleRuleGroupAtPosition(1);
        await assertExpandedRuleGroup(1, 'ImageViewName', 1);

        await mainApplicationView.toggleRuleGroupAtPosition(2);
        await assertExpandedRuleGroup(2, 'ActiveViewName', 2);

        await mainApplicationView.toggleRuleGroupAtPosition(3);
        await assertExpandedRuleGroup(3, 'TouchSizeWcag', 1);

        await mainApplicationView.waitForHighlightBoxCount(4);
        expect(await mainApplicationView.queryRuleGroupContents()).toHaveLength(3);

        await mainApplicationView.toggleRuleGroupAtPosition(1);
        await assertCollapsedRuleGroup(1, 'ImageViewName');

        await mainApplicationView.toggleRuleGroupAtPosition(2);
        await assertCollapsedRuleGroup(2, 'ActiveViewName');

        await mainApplicationView.waitForHighlightBoxCount(1);
        expect(await mainApplicationView.queryRuleGroupContents()).toHaveLength(1);
        await assertExpandedRuleGroup(3, 'TouchSizeWcag', 1);
    });

    it('should pass accessibility validation when left nav is showing', async () => {
        app.client.browserWindow.setSize(
            narrowModeThresholds.collapseCommandBarThreshold + 1,
            height,
        );
        await app.setFeatureFlag(UnifiedFeatureFlags.leftNavBar, true);
        await mainApplicationView.waitForSelector(MainApplicationViewSelectors.leftNav);
        await scanForAccessibilityIssuesInAllModes(app);
    });

    it('left nav allows to change between tests', async () => {
        const testIndex = 1;
        const expectedTestTitle = androidTestConfigs[testIndex].title;
        app.client.browserWindow.setSize(
            narrowModeThresholds.collapseCommandBarThreshold + 1,
            height,
        );
        await app.setFeatureFlag(UnifiedFeatureFlags.leftNavBar, true);
        await mainApplicationView.waitForSelector(MainApplicationViewSelectors.leftNav);
        await mainApplicationView.client.click(
            MainApplicationViewSelectors.nthTestInLeftNav(testIndex + 1),
        );
        const title = await mainApplicationView.client.getText('h1');
        expect(title).toEqual(expectedTestTitle);
    });

    it('should pass accessibility validation in all contrast modes', async () => {
        await scanForAccessibilityIssuesInAllModes(app);
    });

    async function assertExpandedRuleGroup(
        position: number,
        expectedTitle: string,
        expectedFailures: number,
    ): Promise<void> {
        const title = await mainApplicationView.client.getText(
            MainApplicationViewSelectors.nthRuleGroupTitle(position),
        );
        expect(title).toEqual(expectedTitle);

        const failures = await mainApplicationView.client.$$(
            MainApplicationViewSelectors.nthRuleGroupInstances(position),
        );
        expect(failures).toHaveLength(expectedFailures);
    }

    async function assertCollapsedRuleGroup(
        position: number,
        expectedTitle: string,
    ): Promise<void> {
        const title = await mainApplicationView.client.getText(
            MainApplicationViewSelectors.nthRuleGroupTitle(position),
        );
        expect(title).toEqual(expectedTitle);

        const failures = await mainApplicationView.client.$$(
            MainApplicationViewSelectors.nthRuleGroupInstances(position),
        );
        expect(failures).toHaveLength(0);
    }

    it('ScreenshotView renders screenshot image from specified source', async () => {
        const resultExamplePath = path.join(
            testResourceServerConfig.absolutePath,
            'AccessibilityInsights/result.json',
        );
        const axeRuleResultExample = JSON.parse(
            fs.readFileSync(resultExamplePath, { encoding: 'utf-8' }),
        );

        const expectedScreenshotImage =
            'data:image/png;base64,' + axeRuleResultExample.axeContext.screenshot;

        const actualScreenshotImage = await mainApplicationView.client.getAttribute<string>(
            ScreenshotViewSelectors.screenshotImage,
            'src',
        );
        expect(actualScreenshotImage).toEqual(expectedScreenshotImage);
    });

    it('ScreenshotView renders expected number/size of highlight boxes in expected positions', async () => {
        await mainApplicationView.waitForScreenshotViewVisible();

        const styles = await mainApplicationView.client.getAttribute<string[]>(
            ScreenshotViewSelectors.highlightBox,
            'style',
        );

        const actualHighlightBoxStyles = styles.map(extractPositionStyles);
        verifyHighlightBoxStyles(actualHighlightBoxStyles, [
            { width: 10.7407, height: 6.04167, top: 3.28125, left: 89.2593 },
            { width: 10.7407, height: 6.04167, top: 3.28125, left: 89.2593 },
            { width: 10.7407, height: 6.04167, top: 10.4167, left: 13.4259 },
            { width: 48.6111, height: 4.94792, top: 23.5417, left: 25.6481 },
        ]);
    });

    type PositionStyles = {
        width: number;
        height: number;
        top: number;
        left: number;
    };

    function extractPositionStyles(styleValue: string): PositionStyles {
        return {
            width: extractStyleProperty(styleValue, 'width'),
            height: extractStyleProperty(styleValue, 'height'),
            top: extractStyleProperty(styleValue, 'top'),
            left: extractStyleProperty(styleValue, 'left'),
        };
    }

    function extractStyleProperty(styleValue: string, propertyName: string): number {
        return parseFloat(RegExp(`${propertyName}: (-?\\d+(\\.\\d+)?)%`).exec(styleValue)[1]);
    }

    function verifyHighlightBoxStyles(
        actualHighlightBoxStyles: PositionStyles[],
        expectedHighlightBoxStyles: PositionStyles[],
    ): void {
        expect(actualHighlightBoxStyles).toHaveLength(expectedHighlightBoxStyles.length);

        actualHighlightBoxStyles.forEach((boxStyle, index) => {
            expect(boxStyle.top).toBeCloseTo(expectedHighlightBoxStyles[index].top);
            expect(boxStyle.left).toBeCloseTo(expectedHighlightBoxStyles[index].left);
            expect(boxStyle.width).toBeCloseTo(expectedHighlightBoxStyles[index].width);
            expect(boxStyle.height).toBeCloseTo(expectedHighlightBoxStyles[index].height);
        });
    }

    const setupWindowForCommandBarReflowTest = async (
        narrowFactor: number,
    ): Promise<RawResult<any>> => {
        await app.setFeatureFlag(UnifiedFeatureFlags.leftNavBar, true);

        const width = narrowModeThresholds.collapseCommandBarThreshold - narrowFactor;

        app.client.browserWindow.restore();
        app.client.browserWindow.setSize(width, height);

        // Note: the following call returns a different type of object than is specified
        // by the typescript return type when the element is found
        return mainApplicationView.client.$(MainApplicationViewSelectors.leftNavHamburgerButton);
    };

    it('command bar reflows when narrow mode threshold is crossed', async () => {
        const result = await setupWindowForCommandBarReflowTest(2);
        expect(result.value).not.toBeNull();
    });

    it('command bar does not reflow when narrow mode threshold is not crossed', async () => {
        const result = await setupWindowForCommandBarReflowTest(0);
        expect(result.value).toBeNull();
    });

    const waitForFluentLeftNavToDisappear = async (): Promise<void> => {
        return mainApplicationView.waitForSelectorToDisappear(
            MainApplicationViewSelectors.fluentLeftNav,
        );
    };

    const expectFluentLeftNavNotToBeRendered = async (): Promise<void> => {
        const result = await mainApplicationView.client.$(
            MainApplicationViewSelectors.fluentLeftNav,
        );
        expect(result.state).toBe('failure');
    };

    it('hamburger button click opens and closes left nav', async () => {
        await setupWindowForCommandBarReflowTest(2);
        await expectFluentLeftNavNotToBeRendered();
        await mainApplicationView.client.click(MainApplicationViewSelectors.leftNavHamburgerButton);
        await mainApplicationView.waitForSelector(MainApplicationViewSelectors.fluentLeftNav);

        // Clicks the hamburger button inside the fluent left nav (there is one within the command bar as well)
        const selector = `${MainApplicationViewSelectors.fluentLeftNav} ${MainApplicationViewSelectors.leftNavHamburgerButton}`;
        await mainApplicationView.client.click(selector);
        await waitForFluentLeftNavToDisappear();
        await expectFluentLeftNavNotToBeRendered();
    });

    it('left nav closes when item is selected', async () => {
        await setupWindowForCommandBarReflowTest(2);
        await mainApplicationView.client.click(MainApplicationViewSelectors.leftNavHamburgerButton);
        await mainApplicationView.waitForSelector(MainApplicationViewSelectors.fluentLeftNav);

        const selector = `${MainApplicationViewSelectors.fluentLeftNav} a`;
        await mainApplicationView.client.click(selector);
        await waitForFluentLeftNavToDisappear();
        await expectFluentLeftNavNotToBeRendered();
    });
});
