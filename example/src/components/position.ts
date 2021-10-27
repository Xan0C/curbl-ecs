import { ecs } from '../ecs';
import { Components } from './ids';

@ecs.Component(Components.POSITION)
export class Position {
    x = 0;
    y = 0;
}
