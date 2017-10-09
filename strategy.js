let BaseStrategy = require('./basestrategy').BaseStrategy;

const elevators = {
    7: [6, 7, 8, 9],
    5: [4, 5, 6, 7, 8, 9],
    3: [7, 8, 9],
    1: [8, 9],
    2: [8, 9],
    4: [7, 8, 9],
    6: [4, 5, 6, 7, 8, 9],
    8: [6, 7, 8, 9],
};

const freeElevatorsIds = [3, 4, 5, 6];

const weightDiffFloors = {
    '0': 4,
    '1': 7,
    '2': 6,
    '3': 5,
    '4': 4,
    '5': 3,
    '6': 2,
    '7': 1,
    '8': 0,
};

const elevatorSop = {
    1: 2,
    3: 4,
    5: 6,
    7: 8,
    2: 1,
    4: 3,
    6: 5,
    8: 7,
};

let futurePassengers = [];

let prevTickLadderPassengers = [];

const prevTickElevators = [];

let tikNumber = 0;

let myType = '';

const timeForOpenClose = 200;

let elevatorX = 2000;

speed = function (elevator, floor = 1) {
    let result = 50;
    if (elevator.floor < floor) {
        elevator.passengers.forEach(passenger => {
            result = result * passenger.weight;
        });
        if (elevator.passengers.length > 10) {
            result = result * 1.1;
        }
    }

    return result;
};



selectElevatorX = function (myElevators) {

    let left = false;
    myElevators.forEach(myElevator => {
        if (myElevator.id === 1) {
            left = true;
        }
        myType = myElevator.type;
    });
    if (left) {
        elevatorX = elevatorX * -1;
    }
};

firstFloorPassengerCount = function() {
    if (tikNumber < 2000) {
        return Math.floor(2000 / tikNumber) * 2;
    } else {
        return 0;
    }
};

class Strategy extends BaseStrategy {


    onTick(myPassengers, myElevators, enemyPassengers, enemyElevators) {


        if (tikNumber === 0) {
            selectElevatorX(myElevators);
        }
        tikNumber++;
        Strategy.setFuturePassengers();
        Strategy.setFuturePassengersForElevator(myElevators, enemyElevators);
        Strategy.setFuturePassengersForLadder(myPassengers, enemyPassengers);
        let floorRating = Strategy.generateFloorRating(myPassengers, myElevators, enemyPassengers, enemyElevators);
        myElevators.forEach(elevator => {

            let passengersOnFloor = Strategy.getPassengersOnFloor(myPassengers, enemyPassengers, elevator);

            let bestFloor = Strategy.selectNextFloor(floorRating, elevator, myElevators);

            Strategy.selectElevator(elevator, passengersOnFloor, myElevators, enemyElevators);

            if (Strategy.movementAllowed(passengersOnFloor, elevator, bestFloor)) {
                if (elevator.floor != bestFloor) {
                    elevator.goToFloor(bestFloor);
                }
            }

        });
        Strategy.setPrevElevators(myElevators, enemyElevators);
        Strategy.setPrevTickLadderPassengers(myPassengers, enemyPassengers);

    }


    static selectElevator(elevator, passengersOnFloor, myElevators, enemyElevators) {
        let enemyPassengers = passengersOnFloor.filter(passenger => {
            return passenger.type != myType;
        });
        let nearEnemyElevator = enemyElevators.filter(enemyElevator => {
            return enemyElevator.y == elevator.y && enemyElevator.state == 3;
        });


        passengersOnFloor.forEach(passenger => {
            if (passenger.fromFloor > 1) {
                // Если на этаже вражеский лифт, быстро всех зовем в лифт
                if (nearEnemyElevator.length) {
                    passenger.setElevator(elevator);
                } else { // Если вражеского лифта рядом нет, зовем только вражеских пассажиров, а потом своих
                    if (passenger.type == myType) {
                        let notReadyEnemyPassengers = enemyPassengers.filter(enemyPassenger => {
                            return Math.abs(elevatorX - enemyPassenger.x) > Math.abs(elevatorX - passenger.x)
                        });
                        if (notReadyEnemyPassengers.length === 0) {
                            passenger.setElevator(elevator);
                        }
                    } else {
                        passenger.setElevator(elevator);
                    }

                }
            }
            else {

                if (elevators[elevator.id].indexOf(passenger.destFloor) !== -1) {
                    passenger.setElevator(elevator);
                }

            }


        });

        // Тактика повторения за соперником
        // if (tikNumber > 19) {


        // }
    }


    static selectNextFloor(floorRating, currentElevator, myElevators) {
        let maxFloor = 1;
        let maxWeight = 0;
        let badFloors = [];
        myElevators.forEach(myElevator => {
            if (myElevator.id !== currentElevator.id) {
                badFloors.push(myElevator.nextFloor);
            }
        });
        for (let key in floorRating[currentElevator.id]) {
            let waitPassengers = true;
            if (key == currentElevator.floor) {
                if (currentElevator.floor == 1) {
                    waitPassengers = false;
                }
            }

            if (floorRating[currentElevator.id][key] > maxWeight && badFloors.indexOf(parseInt(key, 10)) === -1
                && waitPassengers) {
                maxFloor = key;
                maxWeight = floorRating[currentElevator.id][key];
            }
        }
        return parseInt(maxFloor, 10);
    }

    static generateFloorRating(myPassengers, myElevators, enemyPassengers, enemyElevators) {
        let floorRating = [];
        let floorTimings = [];
        myElevators.forEach(myElevator => {
            floorRating[myElevator.id] = [];
            for (let i = 1; i <= 9; i++) {
                floorRating[myElevator.id][i] = 0;
            }
            myElevator.passengers.forEach(passengerInFloor => {
                floorRating[myElevator.id][passengerInFloor.destFloor] += Math.abs(passengerInFloor.destFloor - passengerInFloor.fromFloor);
            });
            // Если пассажиров > 11
            if (myElevator.passengers.length < 11) {
                let floorTiming = Strategy.calculateFloorTiming(myPassengers, myElevator, enemyPassengers, enemyElevators);
                floorTimings.push(floorTiming);
                for (let key in floorTiming) {
                    if (floorTiming[key]) {
                        floorRating[myElevator.id][key] = floorRating[myElevator.id][key] + floorTiming[key];
                    }

                }
            }

            for (let i = 1; i <= 9; i++) {
                if (i != myElevator.floor) {
                    floorRating[myElevator.id][i] = floorRating[myElevator.id][i] /
                        (speed(myElevator, i) * Math.abs(myElevator.floor - i));
                } else {
                    floorRating[myElevator.id][i] = floorRating[myElevator.id][i];
                }

            }


        });
        return floorRating;
    }

    static calculateFloorTiming(myPassengers, myElevator, enemyPassengers, enemyElevators) {
        let floorsPassengersCount = [];
        let allPassengers = myPassengers.concat(enemyPassengers);
        for (let i = 1; i <= 9; i++) {
            floorsPassengersCount[i] = 0;
        }

        allPassengers.forEach(passenger => {
            let timeToFloor = Math.abs(myElevator.floor - passenger.floor) * speed(myElevator) + timeForOpenClose;
            if (passenger.state < 4 && passenger.timeToAway > timeToFloor && myElevator.floor !== passenger.floor) {
                floorsPassengersCount[passenger.floor] += Math.abs(passenger.floor - passenger.destFloor);

                // if (myElevator.floor == passenger.floor) {
                //     floorsPassengersCount[passenger.floor] = 0;
                // }

            }
        });


        for (let key in floorsPassengersCount) {
            let futurePassengersOnFloor = futurePassengers.filter(passenger => {
                return passenger.floor == key;
            });
            futurePassengersOnFloor.forEach(passenger => {
                let timeToFloor = Math.abs(myElevator.floor - passenger.floor) * speed(myElevator) + timeForOpenClose;
                if (passenger.time + 500 > timeToFloor) {
                    floorsPassengersCount[key] += passenger.count * weightDiffFloors[Math.abs(passenger.floor - myElevator.floor)];
                }
            })
        }
        floorsPassengersCount[1] += firstFloorPassengerCount();

        return floorsPassengersCount;
    }

    static movementAllowed(passengersOnFloor, elevator, bestFloor) {
        let bestPassengersOnFloor = passengersOnFloor.filter(passenger => {
            return (/*passenger.destFloor === bestFloor && */passenger.state < 4);
        });
        let futurePassengersOnFloor = futurePassengers.filter(passenger => {
            return (passenger.floor === elevator.floor && passenger.time < 300 &&
            elevator.passengers.length < 11)
        });
        let movingPassengers = passengersOnFloor.filter(passenger => {
            return (passenger.state === 2 && passenger.fromFloor == 1)
        });
        let passengerInElevatorForCurrentFloor = Strategy.checkPassengersInElevator(elevator);
        return (( futurePassengersOnFloor.length === 0 && !passengerInElevatorForCurrentFloor &&
            elevator.state !== 1 && bestPassengersOnFloor.length === 0 && elevator.floor !== 1)
            || (elevator.passengers.length > 19)
            || (passengersOnFloor.length === 0 && elevator.floor === 1)
            || (movingPassengers.length === 0 && elevator.floor === 1 && tikNumber > 2000)
        );
    }

    static getPassengersOnFloor(myPassengers, enemyPassengers, elevator) {
        let goodPassengersStatuses = [1, 2, 3];
        let passengersOnFloor = myPassengers.filter(function (passenger) {
            return (passenger.fromFloor === elevator.floor && goodPassengersStatuses.indexOf(passenger.state) !== -1);
        });
        let enemyPassengersOnFloor = enemyPassengers.filter(function (passenger) {
            return (passenger.fromFloor === elevator.floor && goodPassengersStatuses.indexOf(passenger.state) !== -1);
        });

        return passengersOnFloor.concat(enemyPassengersOnFloor);

    }

    static setPrevElevators(myElevators, enemyElevators) {
        myElevators.forEach(myElevator => {
            prevTickElevators[myElevator.id] = myElevator;
        });
        enemyElevators.forEach(enemyElevator => {
            prevTickElevators[enemyElevator.id] = enemyElevator;
        })
    }

    static setPrevTickLadderPassengers(myPassengers, enemyPassengers) {
        let allPassengers = myPassengers.concat(enemyPassengers);
        prevTickLadderPassengers = allPassengers.filter(passenger => {
            return passenger.state === 4;
        })
    }

    static setFuturePassengers() {
        let newFuturePassengers = [];
        futurePassengers.forEach(passengers => {
            if (passengers) {
                passengers.time--;
            }
            if (passengers.time) {
                newFuturePassengers.push(passengers);
            }
        });
        futurePassengers = newFuturePassengers;
    }

    static setFuturePassengersForElevator(myElevators, enemyElevators) {
        if (prevTickElevators.length > 0) {
            let allElevators = myElevators.concat(enemyElevators);
            allElevators.forEach(elevator => {
                if (elevator.passengers.length < prevTickElevators[elevator.id].passengers.length) {
                    futurePassengers.push({
                        count: prevTickElevators[elevator.id].passengers.length - elevator.passengers.length,
                        floor: prevTickElevators[elevator.id].floor,
                        time: 541,
                    })
                }
            })
        }
    };

    static setFuturePassengersForLadder(myPassengers, enemyPassengers) {
        if (!prevTickLadderPassengers.length) {
            return;
        }
        let ladderPassengers = myPassengers.concat(enemyPassengers);
        ladderPassengers = ladderPassengers.filter(passenger => {
            return passenger.state === 4;
        });
        let passengersIds = [];
        ladderPassengers.forEach(passenger => {
            passengersIds.push(passenger.id);
        });
        prevTickLadderPassengers.forEach(passenger => {
            if (passengersIds.indexOf(passenger.id) === -1 && passenger.destFloor != 1) {
                futurePassengers.push({
                    count: 1,
                    floor: passenger.floor,
                    time: 541,
                })
            }
        })
    }

    static checkPassengersInElevator(elevator) {
        let passengersOnFloor = elevator.passengers.filter(passenger => {
            return passenger.destFloor === elevator.floor;
        });
        return !!passengersOnFloor.length;

    }


}

module.exports.Strategy = Strategy;
