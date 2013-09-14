# ack

_Stability: 1 - [Experimental](https://github.com/tristanls/stability-index#stability-1---experimental)_

Ack is a tracker mechanism inspired by XOR tracking in [Storm](http://storm-project.net/) that guarantees message processing. It can track multitudes of messages/events in ack chains and report whether or not all of them have been processed.

## Installation

    npm install ack

## Tests

    npm test

## Overview

Ack is a tracker mechanism inspired by XOR tracking in [Storm](http://storm-project.net/) that guarantees message processing. It can track multitudes of messages/events and report whether or not all of them have been processed.

### How it works

Ack uses the XOR operation for all the magic. Here is a quick overview of the relevant aspects of XOR. The XOR (`^`) operation has the following properties: 

`A ^ A = 0`

and 

`A ^ B ^ C = B ^ A ^ C`, `A ^ D ^ B ^ A ^ B ^ D = 0`.

#### Ack chain

Let's say that you want to do a letter count, and you have a database containing text files that contain words.

```
database -> files -> words
```

Our approach will be event driven, so we will iterate through the `database` and emit a `file` event for each file we encounter. 

```
          +-> 'file'
         /
database ---> 'file'
         \
          +-> 'file'
```

Another part of our computation will accept those `file` events and emit `word` events for each word encountered. 

```
          +-> 'word'
         /
... file ---> 'word'
         \
          +-> 'word'
```

How do we track that a particular file has been fully processed when assuming that at each point the processing of any one of the words in that file could fail?

For every `file`, you can create a unique `tag` and a random `xorStamp`. We will then initialize an ack chain. In the below example, I will use a simple bit string in place of `xorStamp` for illustration purposes. In real use, you want to use a random Buffer, perhaps generated via:

```javascript
var xorStamp = crypto.createHash('sha1').update('' + new Date().getTime() + process.hrtime()[1]).digest();
```

In our example, we generate `tag` and `xorStamp`.

_**WARNING**: Pseudocode below._

```javascript
var Ack = require('ack');
var ack = new Ack();

var tag = "unique-file-tag";
var fileStamp = '00101001'; // this is just for illustration (use a random Buffer)

ack.add(tag, fileStamp);
```

Next, each file is broken up into words. Here comes the tricky part. We are going to do a lot of things at once.

First, we already registered the start of file processing via `ack.add(...)`, now, we will acknowledge finishing the processing of that file. To acknowledge, we will send the `fileStamp` again (remember `A ^ A = 0`). 

Second, at the same time, we will acknowledge _starting_ the processing of each word. Let's say we have `word1`, `word2`, `word3`. We will generate a stamp for each word, so `word1Stamp`, `word2Stamp` and `word3Stamp`. To acknowledge the _starting_ of the processing we will send those word stamps to the acker.

Now, remember that `A ^ A ^ B ^ C = 0 ^ B ^ C = B ^ C`. More precisely:

```javascript
var fileStamp  = '00101001'; // we mark completing file
var word1Stamp = '00100101'; // we mark start of computing word1
var word2Stamp = '10101001'; // we mark start of computing word2
var word3Stamp = '11101001'; // we mark start of computing word3

var xorOfAll   = '01001100'; // fileStamp XOR word1Stamp XOR word2Stamp XOR word3Stamp

ack.stamp(tag, xorOfAll); // we stamp with just one stamp for all ops above
```

At this point, what happened inside of Ack is the XOR of previous state with the newly stamped one.

```javascript
var previousStamp =  '00101001'; // original fileStamp
var inboundStamp  =  '01001100'; // xorOfAll from above

var currentState  =  '01100101'; // previousStamp XOR inboundStamp
```

So, we've managed to acknowledge multiple operations all at once, and we are still storing only the `currentState`.

Next, notice what happens as we successfully process each word. 

```javascript
var currentState  = '01100101'; // currentState from above

var word1Stamp    = '00100101'; // we mark finishing of word1
ack.stamp(tag, word1Stamp);

currentState      = '01000000'; // currentState XOR word1Stamp

var word2Stamp    = '10101001'; // we mark finishing of word2
ack.stamp(tag, word2Stamp);

currentState      = '11101001'; // currentState XOR word2Stamp

var word3Stamp    = '11101001'; // we mark finishing of word3
ack.stamp(tag, word3Stamp);

currentState      = '00000000'; // currentState XOR word3Stamp
// emit 'acked' event, all words for file have been processed!
```

That's it. The XOR math works out really well for tracking these types of computation where one event generates multiple child events. This can keep going further down the chain as long as we acknowledge completing our parent processing together with initiation of any child processing. Despite all that activity, the amount of information we store is always one state per entire ack chain.

The above example used binary looking strings for illustrative purposes. The real implementation uses Buffers. Additionally, **the stamps need to be sufficiently large and random to prevent erronous `acked` events.** Storm implementation found a 64bit random integer to be sufficient in practice.

## Documentation

### Ack

**Public API**
  * [new Ack(options)](#new-ackoptions)
  * [ack.add(tag, xorStamp)](#ackaddtag-xorstamp)
  * [ack.fail(tag)](#ackfailtag)
  * [ack.stamp(tag, xorStamp)](#ackstamptag-xorstamp)
  * [Event 'acked'](#event-acked)
  * [Event 'failed'](#event-failed)

#### Ack.eqv(first, second)

_**CAUTION: reserved for internal use**_

  * `first`: _Buffer_ First buffer to compare.
  * `second`: _Buffer_ Second buffer to compare.
  * Return: _Boolean_ `true` if equal, `false` otherwise.

#### Ack.xor(first, second, [zeroCallback])

_**CAUTION: reserved for internal use**_

  * `first`: _Buffer_ First buffer to compare.
  * `second`: _Buffer_ Second buffer to compare.
  * `zeroCallback`: _Function_ _(Default: undefined)_ Optional callback to call if the result of XOR is 0.  
  * Return: _Buffer_ The result of `first` XOR `second`

The lengths of the buffers must be equal.

#### new Ack()

Creates a new Ack instance.

#### ack.add(tag, xorStamp)

  * `tag`: _String_ A unique identifier to track this ack chain.
  * `xorStamp`: _Buffer_ Initial stamp to start the ack chain for `tag`.

#### ack.fail(tag)

  * `tag`: _String_ A unique identifier of a previously added `tag`.

Removes the `tag` and associated `xorStamp` from the acker and emits the `failed` event for the `tag`.

#### ack.stamp(tag, xorStamp)

  * `tag`: _String_ A unique identifier to track this ack chain.
  * `xorStamp`: _Buffer_ Initial stamp to start the ack chain for `tag`.


#### Event `acked`

  * `tag`: _String_ A unique identifier of a previously added `tag`.

Emitted when the ack chain for a previously added `tag` succeeds. Success is defined as the cumulative XOR operation of initial `add()` `xorStamp` and any following `stamp()` `xorStamp`s that results in `xorStamp` being all 0s.

Success removes the `tag` and associated `xorStamp` from the acker and emits the `acked` event for the `tag`.

#### Event `failed`

  * `tag`: _String_ A unique identifier of a previously added `tag`.

Emitted when the ack chain for a previously added `tag` fails.

## Sources

The implementation has been sourced from:

  - [Flip Kromer's presentation at Austin Hadoop Users Group (AHUG)](http://www.meetup.com/Austin-Hadoop-Users-Group-AHUG/events/138735842/) (presentation not yet published)
  - [Guaranteeing message processing](https://github.com/nathanmarz/storm/wiki/Guaranteeing-message-processing)