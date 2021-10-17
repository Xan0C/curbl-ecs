import { ECS } from './ECS';
import { inject } from './Injector';

export interface Component {
    id?: string;
    remove?(): void;
}

const COMPONENT_PROTOTYPE = {
    remove: ECS.noop,
};

const COMPONENT_PROPERTY_DECORATOR = {
    id: function (component) {
        Object.defineProperty(component, 'id', {
            get: function () {
                return this._id || (this._id = this.constructor.name);
            },
            set: function (id: string) {
                this._id = id;
            },
        });
    },
};

export function injectComponent<T extends object>(component: T): T & Component {
    return inject(component, {}, COMPONENT_PROTOTYPE, COMPONENT_PROPERTY_DECORATOR);
}
