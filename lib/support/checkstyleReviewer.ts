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

import {
    isLocalProject,
    logger,
    ProjectReview,
    projectUtils,
} from "@atomist/automation-client";
import {
    CodeInspection,
    predicatePushTest,
    ReviewerError,
    ReviewerRegistration,
} from "@atomist/sdm";
import {spawn} from "child_process";
import {CheckstyleOptions, DefaultPathToScan} from "../checkstyle";
import {extract} from "./checkstyleReportExtractor";
import {checkstyleReportToReview} from "./checkStyleReportToReview";

/**
 * Spawn Checkstyle Java process against the project directory.
 * Parse Checkstyle XML out and transform it into our ProjectReview structure.
 * An example of a common pattern for integrating third party static
 * analysis or security tools.
 */
export function checkstyleReviewer(opts: CheckstyleOptions): CodeInspection<ProjectReview> {
    return p => {
        if (!isLocalProject(p)) {
            throw new Error(`Can only run Checkstyle reviewer against local project: had ${p.id.url}`);
        }
        const childProcess = spawn(
            "java",
            ["-jar",
                opts.checkstylePath,
                "-c",
                "/sun_checks.xml",
                "-f",
                "xml",
                opts.pathToScan || DefaultPathToScan,
            ],
            {
                cwd: p.baseDir,
            });
        let stdout = "";
        let stderr = "";
        childProcess.stdout.on("data", data => stdout += data.toString());
        childProcess.stderr.on("data", data => stderr += data.toString());

        return new Promise((resolve, reject) => {
            childProcess.on("error", err => {
                reject(err);
            });
            childProcess.on("exit", (code, signal) => {
                logger.debug("Checkstyle ran on %j, code=%d, stdout=\n%s\nstderr=%s", p.id, code, stdout, stderr);
                if (code !== 0 && stdout === "") {
                    reject(new ReviewerError("CheckStyle", `Process returned ${code}: ${stderr}`, stderr));
                }
                return extract(stdout)
                    .catch(err => {
                        throw new Error(`Cannot parse checkstyle report ${stdout}`);
                    })
                    .then(cr => resolve(checkstyleReportToReview(p.id, cr, p.baseDir)),
                        err => {
                            logger.warn("CheckStyle error: %s", err);
                            return reject(new ReviewerError("CheckStyle", err.msg, stderr));
                        });
            });
        });
    };
}

const IsJava = predicatePushTest(
    "Is Java",
    async p =>
        projectUtils.fileExists(p, "**/*.java"));

export function checkstyleReviewerRegistration(opts: CheckstyleOptions): ReviewerRegistration {
    return {
        pushTest: IsJava,
        name: "Checkstyle",
        inspection: checkstyleReviewer(opts),
    };
}
