/*

stamp.js - ack.stamp(tag, xorStamp) test

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

test["stamp() does not throw exception if tag does not exist"] = function (test) {
    test.expect(1);
    var ack = new Ack();
    test.doesNotThrow(function () {
        ack.stamp("foo", new Buffer('0010', 'hex'));    
    });
    test.done();
};

test["stamp() does not emit 'acked' event for the tag if XOR is not 0"] = function (test) {
    test.expect(0);
    var ack = new Ack();
    ack.add("foo", new Buffer('0010', 'hex'));
    ack.on('acked', function (tag) {
        test.fail('acked non-zero tag');
    });
    ack.stamp("foo", new Buffer('0100', 'hex'));
    test.done();
};

test["stamp() emits 'acked' event for the tag if XOR is 0"] = function (test) {
    test.expect(1);
    var ack = new Ack();
    ack.add("foo", new Buffer('0010', 'hex'));
    ack.on('acked', function (tag) {
        test.equal('foo', tag);
        test.done();
    });
    ack.stamp("foo", new Buffer('0010', 'hex'));
};

test["stamp() removes the 'acked' tag from storage if XOR is 0"] = function (test) {
    test.expect(1);
    var ack = new Ack();
    ack.add("foo", new Buffer('0010', 'hex'));
    ack.on('acked', function (tag) {
        test.ok(!ack.storage.foo);
        test.done();
    });
    ack.stamp("foo", new Buffer('0010', 'hex'));
};