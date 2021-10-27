import { System } from '@curbl/ecs';
import { Components, Position, Rectangle } from '../components';
import { ecs } from '../ecs';

@ecs.System(Components.POSITION, Components.RECTANGLE)
export class RectangleCanvasRenderer extends System {
    private readonly ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        super();
        this.ctx = ctx;
    }

    setUp(): void {}

    tearDown(): void {}

    update(): void {
        const entities = this.entities();
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        for (let i = 0, entity; (entity = entities[i]); i++) {
            const rect = entity.get<Rectangle>(Components.RECTANGLE);
            const pos = entity.get<Position>(Components.POSITION);
            this.ctx.fillRect(pos.x, pos.y, rect.width, rect.height);
        }
    }
}
