import { ECS, Entity, System } from '@curbl/ecs';
import { PositionComponent } from './positionComponent';

@ECS.System(PositionComponent)
export class PositionSystemWrite extends System {
    setUp(): void {
        console.log('Setup Position Write System');
    }

    tearDown(): void {
        console.log('Tear down Position Write System');
    }

    update(): void {
        for (let i = 0, entity: Entity; (entity = this.entities[i]); i++) {
            console.log('position write system update ', entity);
            entity.get(PositionComponent).x += 1;
            entity.get(PositionComponent).y += 1;
            entity.get(PositionComponent).z += 1;
        }
    }
}
