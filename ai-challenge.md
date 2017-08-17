# Clockwork AI Challenge

See src/bots/test-bot.js for an example bot

load bot using: `var bot = vm.loadBot('dest/bots/test-bot.js');` (in console).

## Technical Overview

Your bot has to be created as a web worker. That is, it's a js file separate from the game.

To interact with the game, the game and the webworker will send messages back and forth. The webworker first needs to post a "ready" message, after which the game will be started and the webworker will only be allowed to send directions to the game (ie: `postMessage("UP");`). The messages sent by the game to the webworker contain information about the game.

### Sending commands to the game

To send data (ie: directions) to the game, use:

```
postMessage("UP");
```

*Valid directions are "UP", "DOWN", "LEFT" and "RIGHT".*

### Receiving data from the game

To receive messages from the game, use:

```
onmessage = function(e) {
    let message = e.data;
};
```

### Messages received from the server

The 'message' sent from the game to the webworker looks like this:

```
{
    "type": String,
    "data": any
}
```

The "type" here can be one of three different values, namely: "start", "candy", "update".

### "start"

The start message is only sent at the start of the game, and informs the webworker about the game. The "data" property contains:

```
{
    "walls": [
        { "x0": int, "y0": int, "x1": int, "y1": int }
    ],
    "snake": [
        { "x": int, "y": int }
    ],
    "candy": [
        { "x": int, "y": int }
    ]
}
```

For walls, x0 and y0 refer to the top left corner of the wall; x1 and y1 refer to the bottom right corner.

For snake, x and y refer to the top left corner of each block that makes up the snake. The "head" of the snake is the last object in the snake array.

For candy, the x and y refer to the top left corner of the candy placed on the map.

### "candy"

Whenever a new candy is placed on the map, the game sends information to the AI informing the AI of where this candy was placed. The "data" attribute looks as follows:

```
{
    "x": int,
    "y": int
}
```

### "update"

The update message is sent any time after an update has been executed (ie: every time the snake has moved). The update contains the following info:

```
{
    "updateFrame": int,
    "direction": string,
    "frameDelay": number
}
```

The *updateFrame* property contains the index of the frame (ie: how many frames have been executed before it). For the most part you can ignore this.

The *direction* property informs you about the direction in which the snake moved during the update that was executed. Due to the asynchronous nature of webworkers, it's possible that the most recently sent command was not yet been processed- this will allow you to know if that was the case.

The *frameDelay* property contains the number of milliseconds before the next update is scheduled. IE: If you wish to change direction, you must do it before this many milliseconds has elapsed.
