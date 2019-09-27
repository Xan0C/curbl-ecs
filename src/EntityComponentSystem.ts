import {ECSBase} from "./ECSBase";
import {ECM_EVENTS, ECM_WORKER_EVENTS, ECS_WORKER_EVENTS, ESM_EVENTS, ESM_WORKER_EVENTS} from "./Events";
import {ComponentMap} from "./EntityHandle";
import {Component, injectComponent} from "./Component";
import {EntityMap} from "./EntityComponentManager";
import { System } from './System';
import { Entity, EntityProp } from './Entity';

export class EntityComponentSystem extends ECSBase {

    private readonly workers: Worker[];
    private readonly workerBitmasks: number[];

    constructor() {
        super();
        this.workers = [];
        this.workerBitmasks = [];
    }

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
        this.events.on(ECM_WORKER_EVENTS.ENTITIES_UPDATED, this.onEntitiesUpdatedForWorker.bind(this));
    }

    private onEntityAdded(entity: Entity){
        this.scm.updateEntity(entity);
    }

    private onEntityAddedToWorker(entity: EntityProp): void {
        for(let i=0, worker: Worker; worker = this.workers[i]; i++) {
            if ( (this.workerBitmasks[i] & entity.bitmask) !== 0) {
                worker.postMessage({
                    message: ECM_WORKER_EVENTS.ENTITY_ADDED,
                    entity: entity
                });
            }
        }
    }

    private onEntityRemoved(entity: Entity){
        this.scm.removeEntity(entity);
    }

    private onEntityRemovedFromWorker(entity: EntityProp): void {
        for(let i=0, worker: Worker; worker = this.workers[i]; i++) {
            if ( (this.workerBitmasks[i] & entity.bitmask) !== 0) {
                worker.postMessage({
                    message: ECM_WORKER_EVENTS.ENTITY_REMOVED,
                    entity: entity
                });
            }
        }
    }

    private onComponentAdded(entity: Entity){
        this.scm.updateEntity(entity);
    }

    private onComponentAddedToWorker(entity: EntityProp, component: Component): void {
        for(let i=0, worker: Worker; worker = this.workers[i]; i++) {
            if ( (this.workerBitmasks[i] & entity.bitmask) !== 0) {
                worker.postMessage({
                    message: ECM_WORKER_EVENTS.COMPONENT_ADDED,
                    entity: entity,
                    component: component
                });
            }
        }
    }

    private onEntitiesUpdated(entities: EntityMap): void {
        const keys = Object.keys(entities);
        for(let i=0, entity: EntityProp; entity = entities[keys[i]]; i++) {
            this.scm.updateEntity(entity);
        }
    }

    private onEntitiesUpdatedForWorker(entities: EntityMap): void {
        const keys = Object.keys(entities);
        for (let k = 0, worker: Worker; worker = this.workers[k]; k++) {
            const workerEntities = {};
            for (let i = 0, entity: EntityProp; entity = entities[keys[i]]; i++) {
                if ((this.workerBitmasks[i] & entity.bitmask) !== 0) {
                    workerEntities[entity.id] = entity;
                }
            }
            if (Object.keys(workerEntities).length !== 0) {
                worker.postMessage({
                    message: ECM_WORKER_EVENTS.ENTITIES_UPDATED,
                    entities: workerEntities,
                    bitmaskMap: this.componentBitmaskMap.bitmaskMap
                });
            }

        }
    }

    private onComponentRemoved(entity: Entity){
        this.scm.updateEntity(entity);
    }

    private onComponentRemovedFromWorker(entity: EntityProp, component: Component): void {
        for(let i=0, worker: Worker; worker = this.workers[i]; i++) {
            if ( (this.workerBitmasks[i] & entity.bitmask) !== 0) {
                worker.postMessage({
                    message: ECM_WORKER_EVENTS.COMPONENT_REMOVED,
                    entity: entity,
                    component: component
                });
            }
        }
    }

    private onSystemAdded(system: System){
        for(let id in this.ecm.entities){
            this.scm.updateEntity(this.ecm.entities[id], system);
        }
    }

    private static sendEventToWorker(worker: Worker, message: any): void {
        worker.postMessage(message);
    }

    private sendEventToAllWorkers(message: any): void {
        for(let i=0, worker: Worker; worker = this.workers[i]; i++) {
            worker.postMessage(message);
        }
    }

    private static injectEntities(entities: EntityMap): void {
        const keys = Object.keys(entities);
        for(let i=0, entity: EntityProp; entity = entities[keys[i]]; i++) {
            EntityComponentSystem.injectComponents(entity.components);
        }
    }

    private static injectComponents(components: ComponentMap): void {
        const keys = Object.keys(components);
        for (let i = 0, component: Component; component = components[keys[i]]; i++) {
            injectComponent(component);
        }
    }

    private delegateWorkerEvents(ev: MessageEvent): void {
        switch(ev.data.message) {
            case ECS_WORKER_EVENTS.INIT_WORKER:
                this.sendInitEvent(ev.target as Worker);
                break;
            case ECM_WORKER_EVENTS.ENTITY_ADDED:
                EntityComponentSystem.injectComponents(ev.data.entity.components);
                this.ecm.addEntity(ev.data.entity, ev.data.entity.components);
                break;
            case ECM_WORKER_EVENTS.ENTITY_REMOVED:
                EntityComponentSystem.injectComponents(ev.data.entity.components);
                injectComponent(ev.data.component);
                this.ecm.removeEntity(ev.data.entity);
                break;
            case ECM_WORKER_EVENTS.COMPONENT_ADDED:
                EntityComponentSystem.injectComponents(ev.data.entity.components);
                injectComponent(ev.data.component);
                this.ecm.addComponent(ev.data.entity, ev.data.component);
                break;
            case ECM_WORKER_EVENTS.COMPONENT_REMOVED:
                EntityComponentSystem.injectComponents(ev.data.entity.components);
                injectComponent(ev.data.component);
                this.ecm.removeComponent(ev.data.entity, ev.data.component.id);
                break;
            case ESM_WORKER_EVENTS.SYSTEM_ADDED:
                this.sendSystemEntitiesToWorker(ev);
                break;
            case ECS_WORKER_EVENTS.UPDATE_WORKER:
                EntityComponentSystem.injectEntities(ev.data.entities);
                this.ecm.updateEntities(ev.data.entities);
                break;
        }
    }

    private sendSystemEntitiesToWorker(ev: MessageEvent): void {
        const index = this.workers.indexOf(ev.target as Worker);

        if ( index !== -1 ) {
            this.workerBitmasks[index] = this.workerBitmasks[index] | ev.data.bitmask;
            const entities = this.ecm.getEntitiesByBitmask(ev.data.bitmask);
            EntityComponentSystem.sendEventToWorker(ev.target as Worker, {
                message: ESM_WORKER_EVENTS.SYSTEM_ADDED,
                entities: entities,
                bitmaskMap: this.componentBitmaskMap.bitmaskMap
            });
        }
    }

    private sendInitEvent(worker: Worker): void {
        worker.postMessage({
            message: ECS_WORKER_EVENTS.INIT_WORKER,
            bitmaskMap: this.componentBitmaskMap.bitmaskMap
        });
    }

    private registerWorker(worker: Worker): void {
        worker.addEventListener("message", (ev) => this.delegateWorkerEvents(ev));
        this.sendInitEvent(worker);
    }

    addWorker(worker: Worker): void {
        if (this.workers.indexOf(worker) === -1) {
            this.workers.push(worker);
            this.workerBitmasks.push(0);
            this.registerWorker(worker);
        }
    }

    update(a1?: any,a2?: any,a3?: any,a4?: any,a5?: any,a6?: any,a7?: any,a8?: any,a9?: any): void {
        this.scm.update(a1,a2,a3,a4,a5,a6,a7,a8,a9);

        this.sendEventToAllWorkers({
            message: ECS_WORKER_EVENTS.UPDATE_WORKER,
            args: [a1, a2, a3, a4, a5, a6, a7, a8, a9]
        });
    }

    init(): void {
        throw "init is only used by workers";
    }
}