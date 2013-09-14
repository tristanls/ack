/*

eqv.js - Ack.eqv(first, second) test

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

test["eqv() returns true if object identity matches"] = function (test) {
    test.expect(1);
    var buf = new Buffer("foo");
    test.strictEqual(true, Ack.eqv(buf, buf));
    test.done();
};

test["eqv() returns false if Buffers are different length"] = function (test) {
    test.expect(1);
    test.strictEqual(false, Ack.eqv(new Buffer("a"), new Buffer("ab")));
    test.done();
};

test["eqv() returns true for 0x01 eqv 0x01"] = function (test) {
    test.expect(1);
    test.strictEqual(true,
        Ack.eqv(new Buffer("01", "hex"), new Buffer("01", "hex")));
    test.done();
};

test["eqv() returns false for 0x0100 eqv 0x01"] = function (test) {
    test.expect(1);
    test.strictEqual(false,
        Ack.eqv(new Buffer("0100", "hex"), new Buffer("01", "hex")));
    test.done();
};

test["eqv() returns false for 0x01 eqv 0x02"] = function (test) {
    test.expect(1);
    test.strictEqual(false,
        Ack.eqv(new Buffer("01", "hex"), new Buffer("02", "hex")));
    test.done();
};