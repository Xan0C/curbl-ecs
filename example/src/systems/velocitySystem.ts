import { System } from '@curbl/ecs';
import { Components, Position, Velocity } from '../components';
import { ecs } from '../ecs';

const SHAPE_HALF_SIZE = 200;

@ecs.System(Components.POSITION, Components.VELOCITY)
export class VelocitySystem extends System {
    constructor(private readonly canvasWidth: number, private readonly canvasHeight: number) {
        super();
    }

    update(delta: number): void {
        const entities = this.entities();
        for (let i = 0, entity; (entity = entities[i]); i++) {
            const velocity = entity.get<Velocity>(Components.VELOCITY);
            const position = entity.get<Position>(Components.POSITION);
            position.x += velocity.x * delta;
            position.y += velocity.y * delta;

            if (position.x > this.canvasWidth + SHAPE_HALF_SIZE) position.x = -SHAPE_HALF_SIZE;
            if (position.x < -SHAPE_HALF_SIZE) position.x = this.canvasWidth + SHAPE_HALF_SIZE;
            if (position.y > this.canvasHeight + SHAPE_HALF_SIZE) position.y = -SHAPE_HALF_SIZE;
            if (position.y < -SHAPE_HALF_SIZE) position.y = this.canvasHeight + SHAPE_HALF_SIZE;
        }
    }
}
