let BaseStrategy = require('./basestrategy').BaseStrategy;

// let previousFloors = [1,1,1,1];
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

class Strategy extends BaseStrategy {



  onTick(myPassengers, myElevators, enemyPassengers, enemyElevators) {
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
            let bestFloor = Strategy.selectNextFloor(elevator, myPassengers);
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


  static selectNextFloor(elevator, passengers) {
    return elevators[elevator.id][0];
    // let mostDesiredFloor = Strategy.getMostDesiredFloor(elevator.passengers);
    // let mostPopulatedFloor = Strategy.getMostPopulatedFloor(elevator, passengers);
  }

  // static getMostDesiredFloor(passengers) {
  //   let passengersCount = [];
  //   let maxFloor = 1;
  //   let maxPassengersCount = 0;
  //   passengers.forEach(passenger => {
  //     if (!passengersCount[passenger.destFloor]) {
  //       passengersCount[passenger.destFloor] = 1;
  //     } else {
  //       passengersCount[passenger.destFloor]++;
  //     }
  //   });
  //   for (let key in passengersCount) {
  //     if (passengersCount[key] > maxPassengersCount) {
  //       maxFloor = key;
  //       maxPassengersCount = passengersCount[key];
  //     }
  //   }
  //   console.log(passengersCount);
  //   return parseInt(maxFloor, 10);
  // }
  //
  // static getMostPopulatedFloor(elevator, passengers) {
  //
  // }


}

module.exports.Strategy = Strategy;
