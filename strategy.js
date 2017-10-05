let BaseStrategy = require('./basestrategy').BaseStrategy;

const elevators = {
    7: [5,6,7,8,9],
    5: [6,7,8,9],
    3: [7,8,9],
    1: [8,9],
    2: [8,9],
    4: [7,8,9],
    6: [6,7,8,9],
    8: [5,6,7,8,9],
};

const weightDiffFloors = {
    '0': 0,
    '1': 8,
    '2': 7,
    '3': 6,
    '4': 5,
    '5': 4,
    '6': 3,
    '7': 2,
    '8': 1,
};

let futurePassengers = [];

const prevTickElevators = [];

let tikNumber = 0;

let myType = '';

class Strategy extends BaseStrategy {


    onTick(myPassengers, myElevators, enemyPassengers, enemyElevators) {
        tikNumber++;
        Strategy.setFuturePassengers(myElevators, enemyElevators);
        let floorRating = Strategy.generateFloorRating(myPassengers, myElevators, enemyPassengers, enemyElevators);
        myElevators.forEach(elevator => {
            myType = elevator.type;

            let passengersOnFloor = Strategy.getPassengersOnFloor(myPassengers, enemyPassengers, elevator);

            let bestFloor = Strategy.selectNextFloor(floorRating, elevator, myElevators);

            Strategy.selectElevator(elevator, passengersOnFloor);

            if (Strategy.movementAllowed(passengersOnFloor, elevator, bestFloor)) {
                elevator.goToFloor(bestFloor);
            }

        });
        Strategy.setPrevElevators(myElevators, enemyElevators);
    }

    static selectElevator(elevator, passengersOnFloor) {
        passengersOnFloor.forEach(passenger => {
            if ((elevators[elevator.id].indexOf(passenger.destFloor) !== -1) && (passenger.floor === 1)
            || (passenger.floor > 1)
            || (passenger.type !== myType && passenger.floor === 1 && elevator.id > 6)) {
                passenger.setElevator(elevator);
            }
        });
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
            if (floorRating[currentElevator.id][key] > maxWeight && badFloors.indexOf(parseInt(key,10)) === -1) {
                maxFloor = key;
                maxWeight = floorRating[currentElevator.id][key];
            }
        }
        return parseInt(maxFloor, 10);
    }

    static generateFloorRating(myPassengers, myElevators, enemyPassengers, enemyElevators) {
        let floorRating = [];
        myElevators.forEach(myElevator => {
            floorRating[myElevator.id] = [];
            for (let i = 1; i <= 9; i++) {
                floorRating[myElevator.id][i] = 0;
                // floorRating[myElevator.id][i] = weightDiffFloors[Math.abs(myElevator.floor - i)];
            }
            myElevator.passengers.forEach(passengerInFloor => {
                floorRating[myElevator.id][passengerInFloor.destFloor] += Math.abs(passengerInFloor.destFloor - passengerInFloor.fromFloor);
            });
            if (myElevator.passengers.length < 11) {
                let floorTiming = Strategy.calculateFloorTiming(myPassengers, myElevator, enemyPassengers, enemyElevators);
                for (let key in floorTiming) {
                    if (floorTiming[key]) {
                        floorRating[myElevator.id][key] = floorRating[myElevator.id][key] + floorTiming[key];
                    }

                }
            }
        });
        return floorRating;
    }

    static calculateFloorTiming(myPassengers, myElevator, enemyPassengers, enemyElevators) {
        let floorsPassengersCount = [];

        myPassengers.forEach(passenger => {
            let timeToFloor = Math.abs(myElevator.floor - passenger.floor) * myElevator.speed + 100;
            if (passenger.state < 4 && passenger.timeToAway > timeToFloor && myElevator.floor !== passenger.floor) {
                if (!floorsPassengersCount[passenger.floor]) {
                    floorsPassengersCount[passenger.floor] = Math.abs(passenger.floor - passenger.destFloor);
                } else {
                    floorsPassengersCount[passenger.floor] += Math.abs(passenger.floor - passenger.destFloor);
                }

            }
        });
        enemyPassengers.forEach(passenger => {
            let timeToFloor = Math.abs(myElevator.floor - passenger.floor) * myElevator.speed + 100;
            if (passenger.state < 4 && passenger.timeToAway > timeToFloor && myElevator.floor !== passenger.floor) {
                if (!floorsPassengersCount[myElevator.floor]) {
                    floorsPassengersCount[myElevator.floor] = 0;
                }
                floorsPassengersCount[myElevator.floor]++;
            }
        });

        for (let key in floorsPassengersCount) {
            let futurePassengersOnFloor = futurePassengers.filter(passenger => {
                return passenger.floor == key;
            });
            futurePassengersOnFloor.forEach(passenger => {
                let timeToFloor = Math.abs(myElevator.floor - passenger.floor) * myElevator.speed + 100;
                if (passenger.time < timeToFloor) {
                    if (!floorsPassengersCount[key]) {
                        floorsPassengersCount[key] = 0;
                    }
                    floorsPassengersCount[key] += passenger.count;
                }
            })
        }
        console.log(floorsPassengersCount);

        return floorsPassengersCount;
    }

    static movementAllowed(passengersOnFloor, elevator, bestFloor) {
        let bestPassengersOnFloor = passengersOnFloor.filter(passenger => {
            return (/*passenger.destFloor === bestFloor && */passenger.state < 4);
        });
        return ((elevator.state !== 1 && bestPassengersOnFloor.length === 0 && elevator.floor !== 1)
        || (elevator.passengers.length > 19) || (passengersOnFloor.length === 0 && elevator.floor === 1));
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

    static setFuturePassengers(myElevators, enemyElevators) {
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

        if (prevTickElevators.length > 0) {
            let allElevators = myElevators.concat(enemyElevators);
            allElevators.forEach(elevator => {
                if (elevator.passengers.length < prevTickElevators[elevator.id].passengers.length) {
                    futurePassengers.push({
                        count: prevTickElevators[elevator.id].passengers.length - elevator.passengers.length,
                        floor: prevTickElevators[elevator.id].floor,
                        time: 500,
                    })
                }
            })
        }
    }


}

module.exports.Strategy = Strategy;
