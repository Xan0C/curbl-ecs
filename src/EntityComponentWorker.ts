import { EntityMap } from './EntityComponentManager';
import { Component, injectComponent } from './Component';
import { ECM_EVENTS, ECM_WORKER_EVENTS, ECS_WORKER_EVENTS, ESM_EVENTS, ESM_WORKER_EVENTS } from './Events';
import { ECSBase } from './ECSBase';
import { System } from './System';
import { Entity, EntityProp } from './Entity';
import { BitmaskMap } from './ComponentBitmaskMap';

interface ECSMessageEvent extends MessageEvent {
    data: {
        message: string;
        args?: any[];
        entity?: EntityProp;
        entities?: EntityProp[] & EntityMap;
        component?: Component;
        bitmaskMap?: BitmaskMap;
    };
}

export class EntityComponentWorker extends ECSBase {
    private initialized: boolean;
    private initcb: () => void;

    protected registerEvents(): void {
        this.events.on(ECM_EVENTS.ENTITY_ADDED, this.onEntityAdded.bind(this));
        this.events.on(ECM_EVENTS.ENTITY_REMOVED, this.onEntityRemoved.bind(this));
        this.events.on(ECM_EVENTS.COMPONENT_ADDED, this.onComponentAdded.bind(this));
        this.events.on(ECM_EVENTS.COMPONENT_REMOVED, this.onComponentRemoved.bind(this));
        this.events.on(ESM_EVENTS.SYSTEM_ADDED, this.onSystemAdded.bind(this));
        this.events.on(ECM_EVENTS.ENTITIES_UPDATED, this.onEntitiesUpdated.bind(this));

        this.events.on(ECM_WORKER_EVENTS.ENTITY_ADDED, this.onEntityAddedToWorker.bind(this));
        this.events.on(ECM_WORKER_EVENTS.ENTITY_REMOVED, this.onEntityRemovedFromWorker.bind(this));
        this.events.on(ECM_WORKER_EVENTS.COMPONENT_ADDED, this.onComponentAddedToWorker.bind(this));
        this.events.on(ECM_WORKER_EVENTS.COMPONENT_REMOVED, this.onComponentRemovedFromWorker.bind(this));

        self.addEventListener('message', (ev: ECSMessageEvent) => this.delegateWorkerEvents(ev));
    }

    private onEntityAdded(entity: Entity) {
        this.scm.updateEntity(entity);
    }

    private onEntityAddedToWorker(entity: Entity): void {
        this.sendEventToMaster({
            message: ECM_WORKER_EVENTS.ENTITY_ADDED,
            entity: entity,
        });
    }

    private onEntityRemoved(entity: Entity) {
        this.scm.removeEntity(entity);
    }

    private onEntityRemovedFromWorker(entity: Entity): void {
        this.sendEventToMaster({
            message: ECM_WORKER_EVENTS.ENTITY_REMOVED,
            entity: entity,
        });
    }

    private onComponentAdded(entity: Entity) {
        this.scm.updateEntity(entity);
    }

    private onComponentAddedToWorker(entity: Entity, component: Component): void {
        this.sendEventToMaster({
            message: ECM_WORKER_EVENTS.COMPONENT_ADDED,
            entity: entity,
            component: component,
        });
    }

    private onComponentRemoved(entity: Entity): void {
        this.scm.updateEntity(entity);
    }

    private onComponentRemovedFromWorker(entity: Entity, component: Component): void {
        this.sendEventToMaster({
            message: ECM_WORKER_EVENTS.COMPONENT_REMOVED,
            entity: entity,
            component: component,
        });
    }

    private onSystemAdded(system: System) {
        for (const id in this.ecm.entities) {
            this.scm.updateEntity(this.ecm.entities[id], system);
        }

        this.sendEventToMaster({
            message: ESM_WORKER_EVENTS.SYSTEM_ADDED,
            id: system.id,
            bitmask: system.bitmask,
        });
    }

    private onEntitiesUpdated(entities: EntityMap): void {
        const keys = Object.keys(entities);
        for (let i = 0, entity: EntityProp; (entity = entities[keys[i]]); i++) {
            this.scm.updateEntity(entity);
        }
    }

    private sendEventToMaster(message: any): void {
        //@ts-ignore
        self.postMessage(message);
    }

    private triggerInit(ev: MessageEvent): void {
        if (!this.initialized) {
            this.componentBitmaskMap.set(ev.data.bitmaskMap);
            this.initialized = true;

            if (this.initcb) {
                this.initcb();
            }
        }
    }

    private static injectComponents(entity: EntityProp): void {
        const components = entity.components || entity['_components'];
        const keys = Object.keys(components);
        for (let i = 0, component: Component; (component = components[keys[i]]); i++) {
            injectComponent(component);
        }
    }

    private delegateWorkerEvents(ev: ECSMessageEvent): void {
        switch (ev.data.message) {
            case ECS_WORKER_EVENTS.INIT_WORKER:
                this.triggerInit(ev);
                break;
            case ECS_WORKER_EVENTS.UPDATE_WORKER:
                this.update(...ev.data.args);
                break;
            case ECM_WORKER_EVENTS.ENTITY_ADDED:
                EntityComponentWorker.injectComponents(ev.data.entity);
                this.ecm.addEntity(ev.data.entity, ev.data.entity.components || ev.data.entity['_components'], false, true);
                break;
            case ECM_WORKER_EVENTS.ENTITY_REMOVED:
                EntityComponentWorker.injectComponents(ev.data.entity);
                this.ecm.removeEntity(ev.data.entity, false, true);
                break;
            case ECM_WORKER_EVENTS.COMPONENT_ADDED:
                EntityComponentWorker.injectComponents(ev.data.entity);
                injectComponent(ev.data.component);
                this.ecm.addComponent(ev.data.entity, ev.data.component, false, true);
                break;
            case ECM_WORKER_EVENTS.COMPONENT_REMOVED:
                EntityComponentWorker.injectComponents(ev.data.entity);
                injectComponent(ev.data.component);
                this.ecm.removeComponent(ev.data.entity, ev.data.component.id, false, true);
                break;
            case ESM_WORKER_EVENTS.SYSTEM_ADDED:
                this.componentBitmaskMap.set(ev.data.bitmaskMap);
                this.addEntitiesForSystem(ev.data.entities);
                break;
            case ECM_WORKER_EVENTS.ENTITIES_UPDATED:
                this.componentBitmaskMap.set(ev.data.bitmaskMap);
                this.updateEntities(ev.data.entities);
                break;
        }
    }

    private updateEntities(entities: EntityMap): void {
        const keys = Object.keys(entities);
        for (let i = 0, entity: EntityProp; (entity = entities[keys[i]]); i++) {
            EntityComponentWorker.injectComponents(entity);
        }
        this.ecm.updateEntities(entities, false, true);
    }

    private addEntitiesForSystem(entities: EntityProp[]): void {
        for (let i = 0, entity: EntityProp; (entity = entities[i]); i++) {
            EntityComponentWorker.injectComponents(entity);
            this.ecm.addEntity(entity, entity.components || entity['_components'], false, true);
        }
    }

    addWorker(): void {
        throw 'WebWorkers can only be added to the main thread';
    }

    update(a1?: any, a2?: any, a3?: any, a4?: any, a5?: any, a6?: any, a7?: any, a8?: any, a9?: any): void {
        this.scm.update(a1, a2, a3, a4, a5, a6, a7, a8, a9);

        this.sendEventToMaster({
            message: ECS_WORKER_EVENTS.UPDATE_WORKER,
            entities: this.ecm.entities,
        });
    }

    init(cb: () => void): void {
        this.initcb = cb;
        this.sendEventToMaster({
            message: ECS_WORKER_EVENTS.INIT_WORKER,
        });
    }
}
