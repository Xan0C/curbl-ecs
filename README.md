# CURBL-ECS

curbl-ecs is a Entity Component System written in Typescript.
 - Its using Decorators to simply add Component, Entities and Systems.
 - eventemitter3 for event handling

## Example

* Creating a Component

```javascript

@ECS.Component()
class PositionComponent implements IComponent {
    public x: number;
    public y: number;

    constructor(config: {x: number, y: number} = { x:0, y:0 }) {
        this.x = config.x;
        this.y = config.y;
    }

    init(config: {x: number, y: number} = { x: 0, y: 0 }): void {
        this.x = config.x;
        this.y = config.y;
    }

    remove(): void {
    }

}
```

* Creating an Entity with injected component

```javascript

@ECS.Entity(
    { component:PositionComponent, config: { x:12, y:12 }}
)
class Entity implements IEntity {
   readonly id: string;
}
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

* Creating a System and injecting other Systems as properties

```javascript

//All Entities with a PositionComponent will be added to the System
@ECS.System(PositionComponent) 
export class MySystem extends System implements ISystem {
     private input: InputSystem;
     
     setUp(): void{
          //Called when the System is created/added to the ECS 
     }
     
     tearDown(): void{
         //Called when the System is removed from the ECS
     }
     
     update(): void{
         for(let i = 0, entity: IEntity; entity = this.entities[i]; i++){
             //Do stuff with the entities
         }
     }
}
```