export enum ESM_EVENTS {
    SYSTEM_ADDED = "entitySystemManager.systemAdded",
    SYSTEM_REMOVED = "entitySystemManager.systemRemoved",
    ENTITY_ADDED_TO_SYSTEM = "entitySystemManager.entityAddedToSystem",
    ENTITY_REMOVED_FROM_SYSTEM = "entitySystemManager.entityRemovedFromSystem"
}

export enum SYSTEM_EVENTS {
    ENTITY_ADDED = "system.entityAdded",
    ENTITY_REMOVED = "system.entityRemoved"
}

export enum ECM_EVENTS {
    ENTITY_ADDED = "entityComponentManager.entityAdded",
    ENTITY_REMOVED = "entityComponentManager.entityRemoved",
    ENTITY_DESTROYED = "entityComponentManager.entityDestroyed",
    COMPONENT_ADDED = "entityComponentManager.componentAdded",
    COMPONENT_REMOVED = "entityComponentManager.componentRemoved",
}