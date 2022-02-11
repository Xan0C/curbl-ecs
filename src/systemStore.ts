import { injectSystem, System } from './system';

export class SystemStore {
    private systemMethods: string[] = ['update'];
    private readonly systems: System[] = [];

    setUpdateMethods(methods: string[]): void {
        this.systemMethods = methods;
    }

    addSystem(system: System): void {
        if (!this.hasSystem(system)) {
            this.systems.push(system);
            injectSystem(system, [...this.systemMethods, 'init', 'destroy']);
            system.setUp();
        }
    }

    removeSystem(system: System): void {
        const index = this.systems.indexOf(system);
        if (index !== -1) {
            this.systems.splice(index, 1);
            system.tearDown();
        }
    }

    hasSystem(system: System): boolean {
        return this.systems.includes(system);
    }

    clear(): void {
        this.systems.length = 0;
        this.systemMethods = ['update'];
    }

    private callMethodOnSystems(
        method: string,
        a1?: any,
        a2?: any,
        a3?: any,
        a4?: any,
        a5?: any,
        a6?: any,
        a7?: any,
        a8?: any,
        a9?: any
    ): void {
        for (let i = 0, system: any; (system = this.systems[i]); i++) {
            system[method](a1, a2, a3, a4, a5, a6, a7, a8, a9);
        }
    }

    init(a1?: any, a2?: any, a3?: any, a4?: any, a5?: any, a6?: any, a7?: any, a8?: any, a9?: any): void {
        this.callMethodOnSystems('init', a1, a2, a3, a4, a5, a6, a7, a8, a9);
    }

    update(a1?: any, a2?: any, a3?: any, a4?: any, a5?: any, a6?: any, a7?: any, a8?: any, a9?: any): void {
        for (let i = 0, method; (method = this.systemMethods[i]); i++) {
            this.callMethodOnSystems(method, a1, a2, a3, a4, a5, a6, a7, a8, a9);
        }
    }

    destroy(a1?: any, a2?: any, a3?: any, a4?: any, a5?: any, a6?: any, a7?: any, a8?: any, a9?: any): void {
        this.callMethodOnSystems('destroy', a1, a2, a3, a4, a5, a6, a7, a8, a9);
    }
}
