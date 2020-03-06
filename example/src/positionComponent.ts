import { ECS } from '@curbl/ecs';

@ECS.Component()
export class PositionComponent {
    x: number;
    y: number;
    z: number;

    constructor(props: { x?: number; y?: number; z?: number } = {}) {
        this.x = props.x || 0;
        this.y = props.y || 0;
        this.z = props.z || 0;
    }
}
