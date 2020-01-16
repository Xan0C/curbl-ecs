import { ECS } from '../../lib/ECS';
import * as ReadWorker from './reader.worker.ts';
import * as WriteWorker from './writer.worker.ts';
import { NoopComponent } from './noopComponent';
import { PositionComponent } from './positionComponent';

@ECS.Entity({ component: NoopComponent })
class NoopEntity {}

@ECS.Entity({ component: PositionComponent, config: { x: 1, y: 2, z: 4 } })
class PositionEntity {}

(() => {
    ECS.addEntity(new NoopEntity());
    ECS.addEntity(new PositionEntity());

    const readWorker = new ReadWorker();
    ECS.addWorker(readWorker);

    const writeWorker = new WriteWorker();
    ECS.addWorker(writeWorker);

    //@ts-ignore
    (window as any).ECS = ECS._instance;
    //@ts-ignore
    console.log(ECS._instance);
    ECS.update();

    window.onkeydown = ev => {
        if (ev.code === 'Space') {
            console.log('update ecs');
            ECS.update();
        }
    };
})();
