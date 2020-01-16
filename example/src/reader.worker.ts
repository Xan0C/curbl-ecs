import { PositionSystemRead } from './positionSystemRead';
import { ECS } from '../../lib/ECS';

ECS.init(() => {
    const system = new PositionSystemRead();
    ECS.addSystem(system);

    //@ts-ignore
    console.log(ECS._instance);
});
