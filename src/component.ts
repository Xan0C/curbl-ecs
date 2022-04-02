/**
 * interface used for internal component type
 * that gets modified by the Component decorator
 */
export interface CurblECSIntComponent extends Component {
    constructor: {
        __id: string;
        __bit: number;
    };
}

export interface Component {
    /**
     * asynchronous load method that gets called before adding the component to an entity
     */
    load?(): Promise<void>;

    /**
     * asynchronous unload method that gets called before removing the component from an entity
     */
    unload?(): Promise<void>;
}
