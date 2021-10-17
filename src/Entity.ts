import { Component } from './Component';
import { ComponentMap } from './EntityHandle';

export interface EntityProp {
    id: string;
    components?: ComponentMap;
    bitmask: number;
}

export interface EntityDecoratorComponent {
    component: { new (config?: { [x: string]: any }): any };
    config?: { [x: string]: any };
}

export interface Entity extends EntityProp {
    get<T extends object>(comp: { new (...args): T } | string): T;
    getAll(): { [id: string]: Component };
    has<T extends object>(comp: { new (...args): T | Component | object } | string): boolean;
    add<T extends object>(component: T | Component | object): void;
    remove<T extends object>(component: { new (...args): T | Component | object } | string): boolean;
    dispose(): this;
}
