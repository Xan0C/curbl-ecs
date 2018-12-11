# CURBL-ECS

curbl-ecs is a Entity Component System written in Typescript.
 - Its using Decorators to simply add Component,Entities and Systems.
 - Components are pooled and are automatical reused if the Component class is marked with a Component Decorator.
 - eventemitter3 for event handling

## Example

* Creating a Component

```javascript

@ECS.Component()
class PositionComponent implements IComponent {
    public x;
    public y;

    constructor(config:{x:number,y:number}={x:0,y:0}){
        this.x = config.x;
        this.y = config.y;
    }

    init(config:{x:number,y:number}={x:0,y:0}):void {
        this.x = config.x;
        this.y = config.y;
    }

    remove():void {
    }

}
```

* Creating an Entity with injected component

```javascript

@ECS.Entity(
    {component:PositionComponent,config:{x:12,y:12}}
)
class Entity implements IEntity {
   readonly id:string;
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
entity.get<PositionComponent>("PositionComponent").x = 42;
```

* Creating a System that will receive all entities with a PositionComponent

```javascript

@ECS.System(PositionComponent) 
export class MySystem extends System implements ISystem {
     
     setUp():void{
          //Called when the System is created/added to the ECS 
     }
     
     tearDown():void{
         //Called when the System is removed from the ECS
     }
     
     update():void{
         for(let i=0,entity:IEntity; entity = this.entities[i]; i++){
             //Do stuff with the entities
         }
     }
}
```