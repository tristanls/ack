/*

index.js - "ack": XOR based ack tracking library for guaranteeing message processing

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
    util = require('util');

var Ack = module.exports = function Ack () {
    var self = this;

    self.storage = {}; // keep it simple
};

util.inherits(Ack, events.EventEmitter);

/*
  * `first`: _Buffer_ First buffer to compare.
  * `second`: _Buffer_ Second buffer to compare.
  * Return: _Boolean_ `true` if equal, `false` otherwise.
*/
Ack.eqv = function eqv (first, second) {
    if (first == second) return true; // "quick" identity check
    if (first.length != second.length) return false;
    for (var i = 0; i < first.length; i++) {
        // bitwise XOR is zero if equal
        if ((first[i] ^ second[i]) != 0) return false;
    }
    return true;
};

/*
  * `first`: _Buffer_ First buffer to compare.
  * `second`: _Buffer_ Second buffer to compare.
  * `zeroCallback`: _Function_ _(Default: undefined)_ Optional callback to call 
                   if the result of XOR is 0.
  * Return: _Buffer_ The result of `first` XOR `second`
*/
Ack.xor = function xor (first, second, zeroCallback) {
    if (first.length != second.length) throw new Error("Buffer lengths not equal.");
    var result = new Buffer(first.length);
    var allZeros = true;
    for (var i = 0; i < first.length; i++) {
        result[i] = first[i] ^ second[i];
        if (result[i] != 0) allZeros = false;
    }
    if (zeroCallback && allZeros) zeroCallback();
    return result;
};

/*
  * `tag`: _String_ A unique identifier to track this ack chain.
  * `xorStamp`: _Buffer_ Initial stamp to start the ack chain for `tag`.
*/
Ack.prototype.add = function add (tag, xorStamp) {
    var self = this;

    if (self.storage[tag]) throw new Error("Tag " + tag + " already exists.");
    self.storage[tag] = xorStamp;
};

/*
  * `tag`: _String_ A unique identifier of a previously added `tag`.
*/
Ack.prototype.fail = function fail (tag) {
    var self = this;

    delete self.storage[tag];
    self.emit('failed', tag);
};

/*
  * `tag`: _String_ A unique identifier to track this ack chain.
  * `xorStamp`: _Buffer_ Stamp to track in the ack chain for `tag`.
*/
Ack.prototype.stamp = function stamp (tag, xorStamp) {
    var self = this;

    if (!self.storage[tag]) return;
    var allZeros = false;
    self.storage[tag] = Ack.xor(self.storage[tag], xorStamp, function () {
        allZeros = true;
    });
    if (allZeros) {
        delete self.storage[tag];
        self.emit('acked', tag);
    }
};