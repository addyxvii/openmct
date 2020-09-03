/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
import MoveActionPlugin from './plugin.js';
import MoveAction from './MoveAction.js';
import {
    createOpenMct,
    resetApplicationState,
    getMockObjects
} from 'utils/testing';

describe("The Move Action plugin", () => {

    let openmct;
    let moveAction;
    let childObject;
    let parentObject;
    let anotherParentObject;

    // this setups up the app
    beforeEach((done) => {
        const appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();

        childObject = getMockObjects({
            objectKeyStrings: ['folder'],
            overwrite: {
                folder: {
                    name: "Child Folder",
                    identifier: {
                        namespace: "",
                        key: "child-folder-object"
                    }
                }
            }
        }).folder;
        parentObject = getMockObjects({
            objectKeyStrings: ['folder'],
            overwrite: {
                folder: {
                    name: "Parent Folder",
                    composition: [childObject.identifier]
                }
            }
        }).folder;
        anotherParentObject = getMockObjects({
            objectKeyStrings: ['folder'],
            overwrite: {
                folder: {
                    name: "Another Parent Folder"
                }
            }
        }).folder;

        // already installed by default, but never hurts, just adds to context menu
        openmct.install(MoveActionPlugin());

        openmct.on('start', done);
        openmct.startHeadless(appHolder);
    });

    afterEach(() => {
        resetApplicationState(openmct);
    });

    it("should be defined", () => {
        expect(MoveActionPlugin).toBeDefined();
    });

    describe("when removing an object from a parent composition", () => {

        beforeEach(() => {
            moveAction = new MoveAction(openmct);
            spyOn(moveAction, 'removeFromComposition').and.callThrough();
            spyOn(moveAction, 'inNavigationPath').and.returnValue(false);
            spyOn(openmct.objects, 'mutate').and.callThrough();
            moveAction.removeFromComposition(parentObject, childObject);
        });

        it("removeFromComposition should be called with the parent and child", () => {
            expect(moveAction.removeFromComposition).toHaveBeenCalled();
            expect(moveAction.removeFromComposition).toHaveBeenCalledWith(parentObject, childObject);
        });

        it("it should mutate the parent object", () => {
            expect(openmct.objects.mutate).toHaveBeenCalled();
            expect(openmct.objects.mutate.calls.argsFor(0)[0]).toEqual(parentObject);
        });
    });

    describe("when determining the object is applicable", () => {

        beforeEach(() => {
            moveAction = new MoveAction(openmct);
            spyOn(moveAction, 'appliesTo').and.callThrough();
        });

        it("should be true when the parent is creatable and has composition", () => {
            let applies = moveAction.appliesTo([childObject, parentObject]);
            expect(applies).toBe(true);
        });

        it("should be false when the child is locked", () => {
            childObject.locked = true;
            let applies = moveAction.appliesTo([childObject, parentObject]);
            expect(applies).toBe(false);
        });
    });
});