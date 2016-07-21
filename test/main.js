'use strict';

// Created by leiko on 27/08/14 13:38
var path = require('path');

var modelGen = require('../kevoree-gen-model');

describe('kevoree-gen-model tests', function () {
    this.timeout(2000);

    it('generate examples/fakecomp model', function (done) {
        var modulePath = path.resolve(__dirname, '..', 'examples', 'fakecomp');
        modelGen(modulePath, true, function (err) {
            done(err);
        });
    });

    it('generate examples/fakenode model', function (done) {
        var modulePath = path.resolve(__dirname, '..', 'examples', 'fakenode');
        modelGen(modulePath, true, function (err) {
            done(err);
        });
    });
});
