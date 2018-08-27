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

import {NodeFsLocalProject} from "@atomist/automation-client/project/local/NodeFsLocalProject";
import {InMemoryFile} from "@atomist/automation-client/project/mem/InMemoryFile";
import {InMemoryProject} from "@atomist/automation-client/project/mem/InMemoryProject";
import * as path from "path";
import * as assert from "power-assert";
import {tempdir} from "shelljs";
import { checkstyleReviewer } from "../src/support/checkstyleReviewer";

const checkstylePath = path.join(__dirname, "./checkstyle-8.8-all.jar");

describe("checkstyleReviewer", () => {

    it("should succeed in reviewing repo", async () => {
        const p = NodeFsLocalProject.copy(InMemoryProject.of(new InMemoryFile("src/Thing.java", "// Comment\n\nclass Foo{}\n")),
        tempdir()).then(async project => {
            const review = await checkstyleReviewer(checkstylePath)(project, null);
            assert(!!review);
            assert(review.comments.length > 1);
        });
    }).timeout(10000);

    it("should handle invalid checkstyle path", async () => {
        const p = NodeFsLocalProject.copy(InMemoryProject.of(new InMemoryFile("src/Thing.java", "// Comment\n\nclass Foo{}\n")),
        tempdir()).then(async project => {
            try {
                await checkstyleReviewer("invalid checkstyle path")(project, null);
                assert("Checkstyle should have failed with invalid path");
            } catch {
                // Ok
            }
        });
    }).timeout(10000);

});
