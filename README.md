# CURBL-ECS

curbl-ecs is an lightweight Entity Component System using decorator magic for Components, Entities and Systems.
There is also a simple web worker support.

## Example

* Creating a Component

```javascript

@ECS.Component()
class PositionComponent {
    public x: number;
    public y: number;

    constructor(config: {x: number, y: number} = { x:0, y:0 }) {
        this.x = config.x;
        this.y = config.y;
    }
}
```

* Creating an Entity with components

```javascript

@ECS.Entity(
    { component: PositionComponent, config: { x:12, y:12 }}
)
class PositionEntity {}
```

* Adding a Entity with predefined Components
```javascript
const entity = ECS.addEntity(new PositionEntity());
```

* Create entity and add Component

```javascript
const entity = ECS.createEntity();
entity.add(new PositionComponent());
```

* Get Component from Entity

```javascript
entity.get(PositionComponent).x = 42;
entity.get("PositionComponent").x = 42;
```

* Creating a System

```javascript

//All Entities with a PositionComponent will be added to the System
@ECS.System(PositionComponent) 
export class MySystem {
     
     setUp(): void{
          //Called when the System is created/added to the ECS 
     }
     
     tearDown(): void{
         //Called when the System is removed from the ECS
     }
     
     update(): void{
         for(let i = 0, entity: Entity; entity = this.entities[i]; i++){
             //Do stuff with the entities
         }
     }
}
```
* Using Web Workers by adding the WebWorker to the main-thread.
All Entities are automatically shared between all workers.
```javascript
@ECS.Entity(
    {component: PositionComponent, config: {x: 1, y: 2, z: 4}}
)
class PositionEntity {}

ECS.addEntity(new PositionEntity());

const readWorker = new ReadWorker();
ECS.addWorker(readWorker);

const writeWorker = new WriteWorker();
ECS.addWorker(writeWorker);

ECS.update();
```