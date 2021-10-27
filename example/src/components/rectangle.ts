import { Components } from './ids';
import { ecs } from '../ecs';

@ecs.Component(Components.RECTANGLE)
export class Rectangle {
    width = 0;
    height = 0;
}
