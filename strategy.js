let BaseStrategy = require('./basestrategy').BaseStrategy;

let elevators = {
    1: [2, 3],
    3: [4, 5],
    5: [6, 7],
    7: [8, 9],
    2: [2, 3],
    4: [4, 5],
    6: [6, 7],
    8: [8, 9],
};

let weightDiffFloors = {
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

class Strategy extends BaseStrategy {


    onTick(myPassengers, myElevators, enemyPassengers, enemyElevators) {
        let floorRating = Strategy.generateFloorRating(myPassengers, myElevators, enemyPassengers, enemyElevators);
        console.log(floorRating);
        myElevators.forEach(elevator => {

            let passengersOnFloor = Strategy.getPassengersOnFloor(myPassengers, enemyPassengers, elevator);

            let bestFloor = Strategy.selectNextFloor(floorRating, elevator, myElevators);

            Strategy.selectElevator(elevator, passengersOnFloor);

            if (Strategy.movementAllowed(passengersOnFloor, elevator, bestFloor)) {
                elevator.goToFloor(bestFloor);
                console.log(elevator.nextFloor);
            }

        });
    }

    static selectElevator(elevator, passengersOnFloor) {
        passengersOnFloor.forEach(passenger => {
            if ((elevators[elevator.id].indexOf(passenger.destFloor) !== -1) && (passenger.floor === 1)
            || (passenger.floor > 1)) {
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
        console.log(floorRating);
        for (let key in floorRating[currentElevator.id]) {
            if (floorRating[currentElevator.id][key] > maxWeight && badFloors.indexOf(key) === -1) {
                maxFloor = key;
                maxWeight = floorRating[currentElevator.id][key];
                console.log('ff', currentElevator.id, maxFloor, maxWeight);
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
                floorRating[myElevator.id][passengerInFloor.destFloor]++;
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
        console.log(floorRating);
        return floorRating;
    }

    static calculateFloorTiming(myPassengers, myElevator, enemyPassengers, enemyElevators) {
        let floorsPassengersCount = [];
        myPassengers.forEach(passenger => {
            let timeToFloor = Math.abs(myElevator.floor - passenger.floor) * 50 + 100;
            if (passenger.state < 4 && passenger.timeToAway > timeToFloor && myElevator.floor !== passenger.floor) {
                if (!floorsPassengersCount[passenger.floor]) {
                    floorsPassengersCount[passenger.floor] = 1;
                } else {
                    floorsPassengersCount[passenger.floor]++;
                }

            }
        });
        enemyPassengers.forEach(passenger => {
            let timeToFloor = Math.abs(myElevator.floor - passenger.floor) * 50 + 100;
            if (passenger.state < 4 && passenger.timeToAway > timeToFloor && myElevator.floor !== passenger.floor) {
                floorsPassengersCount[myElevator.floor]++;
            }
        });
        return floorsPassengersCount;
    }

    static movementAllowed(passengersOnFloor, elevator, bestFloor) {
        let bestPassengersOnFloor = passengersOnFloor.filter(passenger => {
            return (/*passenger.destFloor === bestFloor && */passenger.state < 4);
        });
        console.log('ma', elevator.id, bestPassengersOnFloor.length);
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


}

module.exports.Strategy = Strategy;
