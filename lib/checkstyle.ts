/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { logger } from "@atomist/automation-client";
import {
    AutoCodeInspection,
    ExtensionPack,
    metadata,
    ReviewListenerRegistration,
} from "@atomist/sdm";
import { checkstyleReviewerRegistration } from "./support/checkstyleReviewer";

export const DefaultPathToScan = "src/main/java";

export interface CheckstyleOptions {

    /**
     * Set to false to disable Checkstyle
     */
    enabled?: boolean;

    /**
     * Path to the checkstyle binary
     */
    checkstylePath: string;

    reviewOnlyChangedFiles?: boolean;

    inspectGoal?: AutoCodeInspection;

    /**
     * Review listeners that let you publish review results.
     */
    reviewListeners?: ReviewListenerRegistration | ReviewListenerRegistration[];

    /**
     * Path to look for Java files in. Defaults to src/main/java
     */
    pathToScan?: string;
}

/**
 * Create an instance of the the Checkstyle extension pack.
 * @param {CheckstyleOptions} options
 * @return {ExtensionPack}
 */
export function checkstyleSupport(options: CheckstyleOptions): ExtensionPack {
    return {
        ...metadata(),
        configure: sdm => {
            if (!!options && options.enabled !== false && !!options.inspectGoal) {
                if (!!options.checkstylePath) {
                    options.inspectGoal.with(
                        checkstyleReviewerRegistration(options));

                    if (options.reviewListeners) {
                        const listeners = Array.isArray(options.reviewListeners) ?
                            options.reviewListeners : [options.reviewListeners];
                        listeners.forEach(l => options.inspectGoal.withListener(l));
                    }
                } else {
                    logger.warn(
                        "Skipping Checkstyle; to enable it, set 'sdm.checkstyle.path' to the location of a downloaded checkstyle jar");
                }
            }
        },
    };
}
