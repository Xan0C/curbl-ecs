import { ecs } from '../ecs';
import { Components } from './ids';

@ecs.Component(Components.VELOCITY)
export class Velocity {
    x = 0;
    y = 0;
}
