const init = function(data) {
    console.log("init", JSON.stringify(data, null, "  "));
};

const placeCandy = function(data) {
    //console.log("placeCandy", JSON.stringify(data, null, "  "));
};

let directions = ['RIGHT', 'UP', 'LEFT', 'DOWN'];
let directionIndex = 0;

function update (data){
    //console.log("update", JSON.stringify(data, null, "  "));
    postMessage(directions[directionIndex]);

    directionIndex++;
    if(directionIndex >= directions.length) directionIndex = 0;
};

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
    }
};

postMessage("ready");
console.log('Webworker AI test-bot.js ready');