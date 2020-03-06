import { ECS } from '@curbl/ecs';
import { PositionSystemWrite } from './positionSystemWrite';
import { PositionComponent } from './positionComponent';

ECS.init(() => {
    const system = new PositionSystemWrite();

    const entity = ECS.createEntity();
    entity.add(new PositionComponent({ x: 1, y: 2, z: 4 }));
    ECS.addEntity(entity);

    ECS.addSystem(system);

    //@ts-ignore
    console.log(ECS._instance);
});
