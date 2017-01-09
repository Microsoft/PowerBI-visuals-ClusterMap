/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// fake powerbi functions
window['powerbi'] = {
    DataViewObjects: {
        getValue: () => undefined,
    },
    visuals: {
        valueFormatter: {
            create: (obj) => ({ format: (value) => obj.format + value }),
        },
        utility: {
        }
    },
    extensibility: {
        visualApiVersions: [],
    },
    data: {
        SQExprBuilder: {
            equal: function () {},
            typedConstant: function () {},
            or: function () {},
        },
        createDataViewScopeIdentity: function () {

        }
    }
};

import * as $ from 'jquery';
import * as sinon from 'sinon';
import { expect } from 'chai';
import ClusterMap from './ClusterMap';
import VisualInitOptions = powerbi.VisualInitOptions;
import VisualUpdateOptions = powerbi.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.v110.VisualConstructorOptions;
import mockDataView from './test_data/mockdataview';
import * as _ from 'lodash';

describe('The ClusterMap Component', function () {
    let clusterMap;
    let dataView;

    // mock personas
    const mockPersonas = function (data) {
        return {
            findPersona: function (personaId) {
                return {
                    data: _.find(data, function (o: any) {
                        return o.id === personaId;
                    })
                };
            }
        };
    };

    before(() => {
        const element = $('<div></div>');
        const dummyHost = {
            createSelectionManager: () => ({ hostServices: 'hostService' } as any),
        };
        clusterMap = new ClusterMap(<VisualConstructorOptions>{ element: element[0], host: dummyHost });
    });

    beforeEach(() => {
        dataView = _.cloneDeep(mockDataView);
    });

    it('exists', function () {
        expect(ClusterMap).to.be.ok;
        expect(clusterMap).to.be.ok;
    });

    it('converts normal data', function () {
        const converted = clusterMap.converter(dataView);
        expect(converted.aggregates).to.be.ok;
        expect(converted.aggregates.personas).to.be.ok;
        expect(_.size(converted.aggregates.personas)).to.equal(10);
        _.forEach(converted.aggregates.personas, function (value, key) {
            expect(value.id).to.equal(key);
            expect(value.properties).to.be.ok;
            expect(value.properties.length).to.equal(1);
            expect(value.selection).to.be.ok;
            expect(value.selection.length).to.equal(1);
            expect(value.totalCount).to.be.above(0);
        });
        expect(converted.aggregates.links).to.be.ok;
        expect(converted.aggregates.links.length).to.equal(0);
        expect(converted.aggregates.other).to.be.ok;
        expect(converted.entityRefs).to.be.ok;
        expect(_.size(converted.entityRefs)).to.equal(10);
        _.forEach(converted.entityRefs, function (value, key) {
            expect(value.id).to.equal(key);
            expect(value.imageUrl).to.be.ok;
            expect(value.imageUrl.length).to.equal(0);
            expect(value.name).to.be.ok;
        });
        expect(clusterMap.subSelectionData).to.be.null;
    });

    it('converts data with highlights', function () {
        dataView.categorical.values[0].highlights = [7, 9, 30, 40, null, 30, 18, null, 27, 8];
        let converted = clusterMap.converter(dataView);
        clusterMap.personas = mockPersonas(converted.aggregates.personas);
        clusterMap.converter(dataView);

        const expectedSubSelectionData = {
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit': {
                'computePercentages': true,
                'bars': [
                    {
                        'color': 'rgb(0,186,211)',
                        'count': 7
                    }
                ]
            },
            'Nam congue erat nulla, at lobortis velit efficitur eget': {
                'computePercentages': true,
                'bars': [
                    {
                        'color': 'rgb(0,186,211)',
                        'count': 9
                    }
                ]
            },
            'Pellentesque sit amet ante mattis, dignissim nisi et, efficitur nisi': {
                'computePercentages': true,
                'bars': [
                    {
                        'color': 'rgb(0,186,211)',
                        'count': 30
                    }
                ]
            },
            'Nunc vitae sapien eget arcu egestas viverra eu vitae metus': {
                'computePercentages': true,
                'bars': [
                    {
                        'color': 'rgb(0,186,211)',
                        'count': 40
                    }
                ]
            },
            'Morbi enim leo, euismod porttitor risus nec, auctor pellentesque leo': {
                'computePercentages': true,
                'bars': [
                    {
                        'color': 'rgb(0,186,211)',
                        'count': 30
                    }
                ]
            },
            'Mauris volutpat commodo nisi eu rutrum': {
                'computePercentages': true,
                'bars': [
                    {
                        'color': 'rgb(0,186,211)',
                        'count': 18
                    }
                ]
            },
            'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas': {
                'computePercentages': true,
                'bars': [
                    {
                        'color': 'rgb(0,186,211)',
                        'count': 27
                    }
                ]
            },
            'Maecenas ut dolor posuere, tempor dolor nec, mattis ex': {
                'computePercentages': true,
                'bars': [
                    {
                        'color': 'rgb(0,186,211)',
                        'count': 8
                    }
                ]
            }
        };

        expect(clusterMap.subSelectionData).to.deep.equal(expectedSubSelectionData);
    });

    it('converts Arrays To Lookup Tables', function () {
        let array = [{
            id: '1'
        },
        {
            id: '2'
        }];

        let result = ClusterMap.convertToLookup(array, (d) => d);
        expect(result['1']).to.deep.equal(array[0]);
        expect(result['2']).to.deep.equal(array[1]);
    });
});
