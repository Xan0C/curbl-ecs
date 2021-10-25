# CURBL-ECS

curbl-ecs is a lightweight Entity Component.

## Example

* Creating a Component

```typescript
import { ECS } from '@curbl/ecs';

const ecs = new ECS();

@ecs.Component('Position') 
class PositionComponent {
    x: number = 0;
    y: number = 0;
}
```

* Adding a Entity with components

```typescript
const ecs = new ECS();
const entity = ecs.addEntity(new PositionComponent());
```

* Create entity and add Component

```typescript
const ecs = new ECS();
const entity = ecs.addEntity();
entity.add(new PositionComponent());
```

* Get Component from Entity

```typescript
entity.get<PositionComponent>('Position').x = 42;
```

* Creating a System

```typescript

const ecs = new ECS();

@ecs.System('Position')
export class MySystem {

    setUp(): void {
        //Called when the System is created/added to the ECS 
    }

    tearDown(): void {
        //Called when the System is removed from the ECS
    }

    update(): void {
        const entities = this.entities();
        for (let i = 0, entity: Entity; entity = entities[i]; i++) {
            //Do stuff with the entities
        }
    }
}
```
