import { ECS } from '@curbl/ecs';
import { PositionSystemRead } from './positionSystemRead';

ECS.init(() => {
    const system = new PositionSystemRead();
    ECS.addSystem(system);

    //@ts-ignore
    console.log(ECS._instance);
});
