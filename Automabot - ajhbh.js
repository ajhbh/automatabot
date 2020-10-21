const request = require('request');

const urlroot = 'https://api.noopschallenge.com';
var urlcurrent = '/automatabot/challenges/new';
//var urlcurrent = '/mazebot/random?minSize=10&maxSize=20';;

/*
If neighbouring cells vertically, horizontally and diagonally to a cell sum to the count in the rules then that is a birth or survival in that cell, otherwise it is a death or stays dead.
*/


var exampleResponse = {
    "rules": {
       "name": "conway",
       "birth": [3],
       "survival": [2, 3],
     },
    "cells": [
       [ 1, 1, 1, 0, 0 ],
       [ 1, 0, 1, 0, 0 ],
       [ 0, 1, 0, 1, 1 ],
       [ 0, 0, 1, 1, 0 ],
       [ 0, 0, 0, 1, 0 ]
    ],
    "generations": 12
  };

// wrap a request in an promise
function getRequest(url) {
    return new Promise((resolve, reject) => {
        request.get(url, (error, response, body) => {
            if (error) reject(error); 
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            var jsonRespnse = JSON.parse(body);
            resolve(jsonRespnse);
        });
    });
}

function postRequest(url, payloadJson) {
    return new Promise((resolve, reject) => {
        request.post(url, {
            json: payloadJson
        }, function (error, response, body) {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>\n' + JSON.stringify(response.body));
            }
            //var jsonRespnse = JSON.parse(body);
            resolve(body);
        });
    });
}

function processResponse(response) {
    return new Promise((resolve, reject) => {
        var rulesBirth = response.rules.birth;
        var rulesSurvive = response.rules.survival;
        var generations = response.generations;

        var map = response.cells;
        var mapNeighbourCount = JSON.parse(JSON.stringify(map)); // deepcopy

        console.log("\nGeneration 0:\n");
        printMap(map);

        for (let generation = 1; generation <= generations; generation++) {
            //loop through map cells and set the mapNeighbourtCount corresponding cell with the live count of the cell neighbours. 
            for (let i = 0; i < map.length; i++) {
                for (let j = 0; j < map[i].length; j++) {
                    var liveCount = countLiveNeighbours(map, [i, j]);
                    mapNeighbourCount[i][j] = liveCount;
                }
            }
            //Then set map to the new live cells per birth/survive ruleset.
            for (let i = 0; i < map.length; i++) {
                for (let j = 0; j < map[i].length; j++) {
                    var currentCell = map[i][j];
                    var cellNeighbourCount = mapNeighbourCount[i][j];
                    if (currentCell == 0 && rulesBirth.includes(cellNeighbourCount)) {
                        map[i][j] = 1;
                    } else if (currentCell == 1 && rulesSurvive.includes(cellNeighbourCount)) {
                        //map[i][j] = 1; //no need to set value as same.
                    } else {
                        map[i][j] = 0;
                    }
                }
            }
            console.log(`\nGeneration ${generation}:\n`);
            printMap(map);
        }
        resolve(map);
    });
}

function countLiveNeighbours(map, [i, j]) {
    //horizontally, vertically and diagonally
    var count = 0;
    if (map[i-1] != undefined) {
        if (map[i-1][j-1] != undefined) {
            count += map[i-1][j-1];
        }
        if (map[i-1][j] != undefined) {
            count += map[i-1][j];
        }
        if (map[i-1][j+1] != undefined) {
            count += map[i-1][j+1];
        }
    }
    if (map[i] != undefined) {
        if (map[i][j-1] != undefined) {
            count += map[i][j-1];
        }
        if (map[i][j+1] != undefined) {
            count += map[i][j+1];
        }
    }
    if (map[i+1] != undefined) {
        if (map[i+1][j-1] != undefined) {
            count += map[i+1][j-1];
        }
        if (map[i+1][j] != undefined) {
            count += map[i+1][j];
        }
        if (map[i+1][j+1] != undefined) {
            count += map[i+1][j+1];
        }
    }
    return count;
}

function printMap(map) {
    for (let i = 0; i < map.length; i++) {
        console.log(map[i].join(' '));
    }
}

// all you need to do is use async functions and await for functions returning promises
async function main() {
    //while (true) {
    var urlrequest = urlroot + urlcurrent;
    console.log(urlrequest);

    try {
        var response = await getRequest(urlrequest);
        console.log(JSON.stringify(response), '\n');

        //solve puzzle
        var output = await processResponse(response.challenge);
        var payloadJson = output;

        //send answer back
        urlrequest = urlroot + response.challengePath;
        response = await postRequest(urlrequest, payloadJson);
        console.log(JSON.stringify(response));

    } catch (error) {
        console.error('ERROR:\n', error);
    }
    //}
}

main();

async function test(response) {
    try {
        var output = await processResponse(response);
        var payloadJson = output;
        console.log("Payload:\n", JSON.stringify(payloadJson));

    } catch (error) {
        console.error('ERROR:\n', error);
    }
}
//test(exampleResponse);