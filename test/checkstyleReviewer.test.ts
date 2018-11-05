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
    GitHubRepoRef,
    NodeFsLocalProject,
} from "@atomist/automation-client";
import * as path from "path";
import * as assert from "power-assert";
import * as tmp from "tmp-promise";
import {checkstyleReviewer} from "../lib/support/checkstyleReviewer";

const CheckstylePath = "./checkstyle-8.8-all.jar";

const checkstylePath = path.join(__dirname, CheckstylePath);

describe("checkstyleReviewer", () => {

    it("should succeed in reviewing repo", async () => {
        const tmpDir = tmp.dirSync({unsafeCleanup: true}).name;
        const project = new NodeFsLocalProject(new GitHubRepoRef("owner", "repoName", "abcd"), tmpDir);
        await project.addFile(
            "src/main/java/Thing.java", "// Comment\n\nclass Foo{}\n");
        const review = await checkstyleReviewer({checkstylePath})(project, undefined);
        assert(!!review);
        assert(review.comments.length > 1);
    }).timeout(10000);

    it("should handle invalid checkstyle path", async () => {
        const tmpDir = tmp.dirSync({unsafeCleanup: true}).name;
        const project = new NodeFsLocalProject(new GitHubRepoRef("owner", "repoName", "abcd"), tmpDir);
        await project.addFile(
            "src/main/java/Thing.java", "// Comment\n\nclass Foo{}\n");
        try {
            await checkstyleReviewer({ checkstylePath: "invalid checkstyle path"})(project, undefined);
            assert("Checkstyle should have failed with invalid path");
        } catch {
            // Ok
        }
    }).timeout(10000);

});
