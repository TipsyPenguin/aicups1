let BaseStrategy = require('./basestrategy').BaseStrategy;
let previousFloors = [1,1,1,1];

class Strategy extends BaseStrategy {

    onTick(myPassengers, myElevators, enemyPassengers, enemyElevators) {
        let goodPassengersStatuses = [1, 2, 3];
        myElevators.forEach(elevator => {

            let passengersOnFloor = myPassengers.filter(function (passenger) {
                return (passenger.fromFloor === elevator.floor && goodPassengersStatuses.indexOf(passenger.state) !== -1);
            });
            passengersOnFloor.forEach(passenger => {
                passenger.setElevator(elevator);
            });
            if (elevator.passengers.length > 0 && elevator.state !== 1) {
                if (elevator.passengers.length > 19 || passengersOnFloor.length === 0) {
                    let bestFloor = elevator.floor;
                    let previousFloor = previousFloors[Math.floor((elevator.id-1) / 2)];
                    if (previousFloor) {
                        if ((previousFloor < elevator.floor && elevator.floor !== 9) || (elevator.floor === 1)) {
                            bestFloor++;
                        } else {
                            bestFloor--;
                        }
                    }
                    previousFloors[Math.floor((elevator.id-1) / 2)] = elevator.floor;
                    elevator.goToFloor(bestFloor);
                }
            }
        });
    }
}

module.exports.Strategy = Strategy;
