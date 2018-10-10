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
    SoftwareDeliveryMachine,
} from "@atomist/sdm";
import { checkstyleReviewerRegistration } from "./support/checkstyleReviewer";

export interface CheckstyleSupportOptions {
    enabled: boolean;
    path: string;
    reviewOnlyChangedFiles: boolean;

    inspectGoal?: AutoCodeInspection;

    /**
     * Review listeners that let you publish review results.
     */
    reviewListeners?: ReviewListenerRegistration | ReviewListenerRegistration[];
}

export function checkstyleSupport(options: CheckstyleSupportOptions): ExtensionPack {
    return {
        ...metadata(),
        configure: sdm => {
            if (!!options && options.enabled && !!options.inspectGoal) {
                if (!!options.path) {
                    options.inspectGoal.with(
                        checkstyleReviewerRegistration(options.path, options.reviewOnlyChangedFiles));

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
