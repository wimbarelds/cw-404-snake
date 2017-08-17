let candy = [];
let walls = [];
let snake = [];

let SEARCH_SPEED = 18.5;

let depth, locationsSearched, lastCandyFound = Date.now();

const init = function(data) {
    candy = data.candy;
    walls = data.walls;
    snake = data.snake;
};

function placeCandy(data) {
    candy.push(data);
}

let opposites = {
    LEFT: 'RIGHT',
    RIGHT: 'LEFT',
    UP: 'DOWN',
    DOWN: 'UP'
};
let directions = {
    UP: { x: 0, y: -10 },
    DOWN: { x: 0, y: 10 },
    LEFT: { x: -10, y: 0 },
    RIGHT: { x: 10, y: 0 }
};

const candyCheck = (location) => {
    let candyIndex = -1;
    candy.forEach((bite, index) => {
        if(location.x == bite.x && location.y == bite.y) {
            candyIndex = index;
        }
    });
    return candyIndex;
};

const collisionCheck = (location) => {
    let collision = false;
    for(let wall of walls) {
        if(location.x < wall.x0) continue;
        if(location.x > (wall.x1 - 1)) continue;
        if(location.y < wall.y0) continue;
        if(location.y > wall.y1  - 1) continue;
        return true;
    }

    for(let i = 0; i < (snake.length - 1); i++) {
        let snakeTail = snake[i];
        if(location.x === snakeTail.x && location.y === snakeTail.y) {
            return true;
        }
    }

    return false;
};

const getLocationStr = (location) => {
    return `x${location.x},y${location.y}`;
};

const trimCollisionLocations = (locations) => {
    let newLocations = [];
    for(let location of locations) {
        if(!collisionCheck(location)) {
            newLocations.push(location);
        }
    }
    return newLocations;
};
const trimForbidden = (locations, forbidden) => {
    let newLocations = [];
    for(let location of locations) {
        let locationStr = getLocationStr(location);
        if(forbidden.indexOf(locationStr) < 0) {
            newLocations.push(location);
        }
    }
    return newLocations;
};

const getExpandedSearchArea = (search, forbidden) => {
    let newSearch = {};
    for(let direction in search) {
        newSearch[direction] = [];

        let locations = search[direction];
        for(let location of locations) {
            let additions = [
                { x: location.x + 10, y: location.y },
                { x: location.x, y: location.y + 10 },
                { x: location.x, y: location.y - 10 },
                { x: location.x - 10, y: location.y }
            ];
            additions = trimForbidden(additions, forbidden);
            additions = trimCollisionLocations(additions);

            for(let addition of additions) {
                // Add these locations for searching
                newSearch[direction].push(addition);
                // Prevent this location from being evaluated again
                forbidden.push(getLocationStr(addition));
            }
        }
    }
    return newSearch;
};

const searchCandy = (direction, maxLocationsSearched) => {
    let snakeHead = snake[snake.length - 1];

    // Array of where we cant go
    let forbidden = [ getLocationStr(snakeHead) ];

    // Array containing our next search points
    let search = {
        UP: trimCollisionLocations([{ x: snakeHead.x, y: snakeHead.y - 10 }]),
        DOWN: trimCollisionLocations([{ x: snakeHead.x, y: snakeHead.y + 10 }]),
        LEFT: trimCollisionLocations([{ x: snakeHead.x - 10, y: snakeHead.y }]),
        RIGHT: trimCollisionLocations([{ x: snakeHead.x + 10, y: snakeHead.y }])
    };
    // We cannot go immediately in the opposite direction of where we're going
    let opposite = opposites[direction];
    delete search[opposite];

    // Keep going until we find a candy
    let nextSearch = {};

    locationsSearched = 0;
    for(depth = 0;; depth++) {
        for(let direction in search) {
            let locations = search[direction];
            // Check for candy on all search locations, if found that's the direction we go
            for(let location of locations) {
                if(candyCheck(location) >= 0) {
                    lastCandyFound = Date.now();
                    return direction;
                }
                if(++locationsSearched >= maxLocationsSearched) {
                    return false;
                }
            }
        }
        search = getExpandedSearchArea(search, forbidden);
        let numSearchLocations = Object.values(search).reduce((a, b) => a + b.length, 0);
        if(numSearchLocations == 0){
            //return 0;
            return false;
        }
    }
}

const snapDecision = (direction) => {
    let snakeHead = snake[snake.length - 1];
    let directionKeys = Object.keys(directions);
    let directionIndex = directionKeys.indexOf(direction);
    for(let i = 0; i < directionKeys.length; i++) {
        let moveIndex = (directionIndex + i) % directionKeys.length;
        let moveDirection = directionKeys[moveIndex];
        let move = directions[moveDirection];
        if(!collisionCheck({ x: snakeHead.x + move.x, y: snakeHead.y + move.y })) return moveDirection;
    }
    return false;
};

let stuckDirection = null;
const compactMovement = (direction) => {
    if(stuckDirection === null) stuckDirection = direction;

    if((stuckDirection === 'UP' || stuckDirection === 'DOWN') && direction == 'LEFT') {
        if(!collisionCheck({ x: snakeHead.x - 10, y: snakeHead.y })) return 'LEFT';
        else if(stuckDirection === 'UP' && !collisionCheck({ x: snakeHead.x, y: snakeHead.y - 10 })) return 'UP';
        else if(stuckDirection === 'DOWN' && !collisionCheck({ x: snakeHead.x, y: snakeHead.y + 10 })) return 'DOWN';
    }
    if((stuckDirection === 'UP' || stuckDirection === 'DOWN') && direction == 'RIGHT') {
        if(!collisionCheck({ x: snakeHead.x + 10, y: snakeHead.y })) return 'RIGHT';
        else if(stuckDirection === 'UP' && !collisionCheck({ x: snakeHead.x, y: snakeHead.y - 10 })) return 'UP';
        else if(stuckDirection === 'DOWN' && !collisionCheck({ x: snakeHead.x, y: snakeHead.y + 10 })) return 'DOWN';
    }
    if((stuckDirection === 'LEFT' || stuckDirection === 'RIGHT') && direction == 'UP') {
        if(!collisionCheck({ x: snakeHead.x, y: snakeHead.y - 10 })) return 'UP';
        else if(stuckDirection === 'LEFT' && !collisionCheck({ x: snakeHead.x - 10, y: snakeHead.y })) return 'LEFT';
        else if(stuckDirection === 'RIGHT' && !collisionCheck({ x: snakeHead.x + 10, y: snakeHead.y })) return 'RIGHT';
    }
    if((stuckDirection === 'LEFT' || stuckDirection === 'RIGHT') && direction == 'DOWN') {
        if(!collisionCheck({ x: snakeHead.x, y: snakeHead.y + 10 })) return 'DOWN';
        else if(stuckDirection === 'LEFT' && !collisionCheck({ x: snakeHead.x - 10, y: snakeHead.y })) return 'LEFT';
        else if(stuckDirection === 'RIGHT' && !collisionCheck({ x: snakeHead.x + 10, y: snakeHead.y })) return 'RIGHT';
    }
    return false;
};

function update (data){
    // Move snake
    let tailEnd = snake[0];
    let move = directions[data.direction];
    for(let i = 0; i < snake.length; i++) {
        // Tail
        if(i < (snake.length - 1)) {
            snake[i] = snake[i + 1];
        }
        // Head
        else {
            snake[i] = { x: snake[i].x + move.x, y: snake[i].y + move.y };
        }
    }
    // Remove candy once picked up and extend tail
    let candyIndex = candyCheck(tailEnd);
    if(candyIndex >= 0) {
        candy.splice(candyIndex, 1);
        snake.unshift(tailEnd);
    }
    let before = Date.now();
    let maxSearchLocations = Math.round(data.frameDelay * SEARCH_SPEED);
    let newDirection = searchCandy(data.direction, maxSearchLocations);

    // If we found out we're stuck, move compactly (ie: zigzag)
    if(newDirection === 0) newDirection = compactMovement(data.direction);
    else {
        // If we're not stuck, save that
        stuckDirection = null;
        // If we still can't find a candy, make a snap decision
        if(newDirection == false) newDirection = snapDecision(data.direction);
    }

    if(newDirection) postMessage(newDirection);

    let frameTime = Date.now() - before;
    let maxTime = data.frameDelay;

    if(frameTime > maxTime) console.warn({ frameTime, maxTime: data.frameDelay, locationsSearched, depth });
    // If nothing has been found for too long, add artificial candies to lead snake to other candy
    if(lastCandyFound < Date.now() - 10000) {
        console.log('No candy found for too long, placing artificial candy');
        candy.push({ x: 250, y: 300 });
        candy.push({ x: 550, y: 300 });
        candy.push({ x: 850, y: 100 });
        candy.push({ x: 850, y: 500 });
        candy.push({ x: 1150, y: 300 });
        candy.push({ x: 1450, y: 300 });
        lastCandyFound = Date.now();
    }
};

function test() {
    walls = [
        // 4
        { x0: 100, y0: 0, x1: 300, y1: 10 },
        { x0: 400, y0: 0, x1: 600, y1: 10 },
        { x0: 300, y0: 200, x1: 410, y1: 210 },
        { x0: 100, y0: 0, x1: 110, y1: 400 },
        { x0: 300, y0: 0, x1: 310, y1: 200 },
        { x0: 400, y0: 0, x1: 410, y1: 200 },
        { x0: 100, y0: 400, x1: 400, y1: 410 },
        { x0: 400, y0: 400, x1: 410, y1: 600 },
        { x0: 400, y0: 600, x1: 610, y1: 610 },
        { x0: 600, y0: 0, x1: 610, y1: 240 },
        { x0: 600, y0: 350, x1: 610, y1: 600 },
        // 0
        { x0: 700, y0: 0, x1: 710, y1: 240 },
        { x0: 700, y0: 350, x1: 710, y1: 600 },
        { x0: 1200, y0: 0, x1: 1210, y1: 240 },
        { x0: 1200, y0: 350, x1: 1210, y1: 600 },
        { x0: 700, y0: 0, x1: 1210, y1: 10 },
        { x0: 700, y0: 600, x1: 1210, y1: 610 },
        { x0: 900, y0: 400, x1: 1000, y1: 410 },
        { x0: 900, y0: 200, x1: 1000, y1: 210 },
        { x0: 900, y0: 200, x1: 910, y1: 410 },
        { x0: 1000, y0: 200, x1: 1010, y1: 410 },
        // 4
        { x0: 1300, y0: 0, x1: 1500, y1: 10 },
        { x0: 1600, y0: 0, x1: 1800, y1: 10 },
        { x0: 1500, y0: 200, x1: 1610, y1: 210 },
        { x0: 1300, y0: 0, x1: 1310, y1: 240 },
        { x0: 1300, y0: 350, x1: 1310, y1: 400 },
        { x0: 1500, y0: 0, x1: 1510, y1: 200 },
        { x0: 1600, y0: 0, x1: 1610, y1: 200 },
        { x0: 1300, y0: 400, x1: 1600, y1: 410 },
        { x0: 1600, y0: 400, x1: 1610, y1: 600 },
        { x0: 1600, y0: 600, x1: 1810, y1: 610 },
        { x0: 1800, y0: 0, x1: 1810, y1: 600 },
        // Connector 1
        { x0: 600, y0: 240, x1: 710, y1: 250},
        { x0: 600, y0: 350, x1: 710, y1: 360},
        // Connector 2
        { x0: 1200, y0: 240, x1: 1310, y1: 250},
        { x0: 1200, y0: 350, x1: 1310, y1: 360},
    ];
    snake = [
        { x: 200, y: 190 },
        { x: 200, y: 200 },
    ];
    candy = [
        { x: 200, y: 150}
    ];

    direction = 'DOWN';
    maxLocationsSearched = 2000;

    // SearchCandy function
    let snakeHead = snake[snake.length - 1];

    // Array of where we cant go
    let forbidden = [ getLocationStr(snakeHead) ];

    // Array containing our next search points
    let search = {
        UP: trimCollisionLocations([{ x: snakeHead.x, y: snakeHead.y - 10 }]),
        DOWN: trimCollisionLocations([{ x: snakeHead.x, y: snakeHead.y + 10 }]),
        LEFT: trimCollisionLocations([{ x: snakeHead.x - 10, y: snakeHead.y }]),
        RIGHT: trimCollisionLocations([{ x: snakeHead.x + 10, y: snakeHead.y }])
    };
    // We cannot go immediately in the opposite direction of where we're going
    let opposite = opposites[direction];
    delete search[opposite];

    // Keep going until we find a candy
    let nextSearch = {};

    locationsSearched = 0;
    for(depth = 0;; depth++) {
        console.log('SEARCH', search);
        for(let direction in search) {
            let locations = search[direction];
            // Check for candy on all search locations, if found that's the direction we go
            for(let location of locations) {
                if(candyCheck(location) >= 0) {
                    console.log(direction);
                    return direction;
                }
                if(++locationsSearched >= maxLocationsSearched) {
                    console.log(false);
                    return false;
                }
            }
        }
        search = getExpandedSearchArea(search, forbidden);
        let numSearchLocations = Object.values(search).reduce((a, b) => a + b.length, 0);
        console.log(numSearchLocations);
        if(numSearchLocations == 0){
            console.log(false);
            return false;
        }
    }    
}

onmessage = function(message) {
    let obj = message.data;
    switch(obj.type) {
        case 'start':
            init(obj.data);
            break;
        case 'candy':
            placeCandy(obj.data);
            break;
        case 'update':
            update(obj.data);
            break;
        case 'test':
            test();
            break;
        case 'call':
            self[obj.data.func](... obj.data.arguments);
            break;
    }
};

postMessage("ready");
console.log('Webworker AI test-bot.js ready');
