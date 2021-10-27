import { ecs } from './ecs';
import { RectangleCanvasRenderer, VelocitySystem } from './systems';
import { Position, Rectangle, Velocity } from './components';

const element: HTMLCanvasElement = document.querySelector('#canvas')!;
element.height = window.innerHeight;
element.width = window.innerWidth;
const ctx = element.getContext('2d');
if (!ctx) {
    throw Error('failed to get canvas 2d context');
}

ecs.addSystem(new RectangleCanvasRenderer(ctx));
ecs.addSystem(new VelocitySystem(element.width, element.height));

const rectangle = new Rectangle();
rectangle.width = 300;
rectangle.height = 400;

const position = new Position();
position.x = 50;
position.y = 50;

const velocity = new Velocity();
velocity.x = 0.25;
velocity.y = 0.25;
ecs.addEntity(position, rectangle, velocity);

let lastTime = performance.now();
function update() {
    const time = performance.now();
    const delta = time - lastTime;
    ecs.update(delta);
    lastTime = time;
    requestAnimationFrame(update);
}
requestAnimationFrame(update);
