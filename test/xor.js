/*

xor.js - Ack.xor(first, second) test

The MIT License (MIT)

Copyright (c) 2013 Tristan Slominski

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/

"use strict";

var events = require('events'),
    Ack = require('../index.js');

var test = module.exports = {};

test['0x00 xor 0x00 is 0x00'] = function (test) {
    test.expect(1);
    var result = Ack.xor(new Buffer('00', 'hex'), new Buffer('00', 'hex'));
    test.ok(Ack.eqv(result, new Buffer('00', 'hex')));
    test.done();
};

test['xor() calls zeroCallback if XOR result is zero'] = function (test) {
    test.expect(1);
    Ack.xor(new Buffer('00', 'hex'), new Buffer('00', 'hex'), function () {
        test.ok(true); // callback called
        test.done();
    });
};

test['xor() does not throw if zeroCallback not specified and XOR result is zero'] = function (test) {
    test.expect(1);
    test.doesNotThrow(function () {
        Ack.xor(new Buffer('00', 'hex'), new Buffer('00', 'hex'));
    });
    test.done();
};

test['0x01 xor 0x00 is 0x01'] = function (test) {
    test.expect(1);
    var result = Ack.xor(new Buffer('01', 'hex'), new Buffer('00', 'hex'));
    test.ok(Ack.eqv(result, new Buffer('01', 'hex')));
    test.done();
};

test['0x01 xor 0x01 is 0x00'] = function (test) {
    test.expect(1);
    var result = Ack.xor(new Buffer('01', 'hex'), new Buffer('01', 'hex'));
    test.ok(Ack.eqv(result, new Buffer('00', 'hex')));
    test.done();
};

test['0x10 xor 0x01 is 0x11'] = function (test) {
    test.expect(1);
    var result = Ack.xor(new Buffer('10', 'hex'), new Buffer('01', 'hex'));
    test.ok(Ack.eqv(result, new Buffer('11', 'hex')));
    test.done();
};

test['0x0001 xor 0x00 is an exception'] = function (test) {
    test.expect(1);
    test.throws(function () {
        Ack.xor(new Buffer('0001', 'hex'), new Buffer('00', 'hex'));
    })
    test.done();
};

test['0x00 xor 0x0001 is an exception'] = function (test) {
    test.expect(1);
    test.throws(function () {
        Ack.xor(new Buffer('00', 'hex'), new Buffer('0001', 'hex'));
    })
    test.done();
};