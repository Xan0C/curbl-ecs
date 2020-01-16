import { ECS, Entity, System } from '../../lib';
import { PositionComponent } from './positionComponent';

@ECS.System(PositionComponent)
export class PositionSystemRead extends System {
    setUp(): void {
        console.log('Setup Position System');
    }

    tearDown(): void {
        console.log('Tear down Position System');
    }

    update(): void {
        for (let i = 0, entity: Entity; (entity = this.entities[i]); i++) {
            console.log('position read system update ', entity);
        }
    }
}
