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
        let goodPassengersStatuses = [1, 2, 3];
        myElevators.forEach(elevator => {

            let passengersOnFloor = myPassengers.filter(function (passenger) {
                return (passenger.fromFloor === elevator.floor && goodPassengersStatuses.indexOf(passenger.state) !== -1);
            });
            let enemyPassengersOnFloor = enemyPassengers.filter(function (passenger) {
                return (passenger.fromFloor === elevator.floor && goodPassengersStatuses.indexOf(passenger.state) !== -1);
            });

            passengersOnFloor.forEach(passenger => {
                if (Strategy.selectElevator(elevator, passenger)) {
                    passenger.setElevator(elevator);
                }
            });
            enemyPassengersOnFloor.forEach(passenger => {
                if (Strategy.selectElevator(elevator, passenger)) {
                    passenger.setElevator(elevator);
                }
            });
            try {
                if (elevator.passengers.length > 0 && elevator.state !== 1) {
                    if (elevator.passengers.length > 19 || passengersOnFloor.length === 0) {
                        let bestFloor = Strategy.selectNextFloor(floorRating, elevator);
                        // console.log('best floor', bestFloor);
                        console.log(elevator.state, elevator.floor);
                        elevator.goToFloor(bestFloor);
                    }
                    // } else {
                    //     console.log('not best floor');
                    // }
                }
            } catch (e) {
                console.log(e);
            }

        });
    }

    static selectElevator(elevator, passenger) {
        return (elevators[elevator.id].indexOf(passenger.destFloor) !== -1);
    }


    static selectNextFloor(floorRating, currentElevator) {
        let maxFloor = 1;
        let maxWeight = 0;
        console.log(floorRating);
        for (let key in floorRating[currentElevator.id]) {
            if (floorRating[currentElevator.id][key] > maxWeight) {
                maxFloor = key;
                maxWeight = floorRating[currentElevator.id][key];
                console.log('ff',maxFloor, maxWeight);
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
                // if ()
            });
        });
        console.log(floorRating);
        return floorRating;
    }


}

module.exports.Strategy = Strategy;
