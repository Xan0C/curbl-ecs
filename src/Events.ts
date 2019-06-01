export enum ESM_EVENTS {
    SYSTEM_ADDED = "entitySystemManager.systemAdded",
    SYSTEM_REMOVED = "entitySystemManager.systemRemoved"
}

export enum SYSTEM_EVENTS {
    ENTITY_ADDED = "system.entityAdded",
    ENTITY_REMOVED = "system.entityRemoved"
}

export enum ECM_EVENTS {
    ENTITY_ADDED = "entityComponentManager.entityAdded",
    ENTITY_REMOVED = "entityComponentManager.entityRemoved",
    ENTITIES_UPDATED = "entityComponentManager.entitiesUpdated",
    COMPONENT_ADDED = "entityComponentManager.componentAdded",
    COMPONENT_REMOVED = "entityComponentManager.componentRemoved",
}

export enum ESM_WORKER_EVENTS {
    SYSTEM_ADDED = "worker.entitySystemManager.systemAdded"
}

export enum ECM_WORKER_EVENTS {
    ENTITY_ADDED = "worker.entityComponentManager.entityAdded",
    ENTITY_REMOVED = "worker.entityComponentManager.entityRemoved",
    ENTITIES_UPDATED = "worker.entityComponentManager.entitiesUpdated",
    COMPONENT_ADDED = "worker.entityComponentManager.componentAdded",
    COMPONENT_REMOVED = "worker.entityComponentManager.componentRemoved"
}

export enum ECS_WORKER_EVENTS {
    INIT_WORKER = "worker.entityComponentSystem.init",
    UPDATE_WORKER = "worker.entityComponentSystem.update"
}