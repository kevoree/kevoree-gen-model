'use strict';

// Created by leiko on 27/08/14 13:38
var expect = require('expect');
var path = require('path');

var modelGen = require('../kevoree-gen-model');

describe('kevoree-gen-model tests', function () {
    this.timeout(500);

    it('generate examples/fakecomp model', function (done) {
        var modulePath = path.resolve(__dirname, '..', 'examples', 'fakecomp');
        modelGen(modulePath, true, function (err) {
            expect(err).toNotExist();
            done();
        });
    });

    it('generate examples/fakesubnode model', function (done) {
        var modulePath = path.resolve(__dirname, '..', 'examples', 'fakesubnode');
        modelGen(modulePath, true, function (err) {
            expect(err).toNotExist();
            done();
        });
    });
});
