class Vehicle {
    constructor(make,model,year) {
        if(!Number.isFinite(year) || typeof make !== 'string' || typeof model !== 'string') throw new Error('Invalid Input!');
        this.make = make;
        this.model = model;
        this.year = year;
    }
    honk(){
        return "Beep.";
    }
    toString(){
        return `This vehivle is a ${this.make} ${this.model} from ${this.year}`;
    }
}

class Car extends Vehicle {
    constructor(make,model,year) {
        super(make,model,year);
        this.numWheels = 4;
    }
}

class Motorcycle extends Vehicle {
    constructor(make,model,year){
        super(make,model,year);
        this.numWheels = 2;
    }
    revEngine() {
        return 'VROOM!!!';
    }
}

class Garage {
    constructor(capacity) {
        this.capacity = capacity;
        this.vehicles = [];
    }
    add(vehicle){
        const {capacity,vehicles} = this;
        if (!vehicle.honk) {
            return 'Only vehicles are allowed in here!'
        }else if (capacity > vehicles.length) {
            vehicles.push(vehicle);
            return 'Vehicle Added!'
        } else {
            return "Sorry, we're full."
        }
    }
}