import { injectSystem, System } from './system';

export class SystemStore {
    private updateMethods: string[] = ['update'];
    private readonly systems: System[] = [];

    setUpdateMethods(methods: string[]): void {
        this.updateMethods = methods;
    }

    addSystem(system: System): void {
        if (!this.hasSystem(system)) {
            this.systems.push(system);
            injectSystem(system, this.updateMethods);
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
        this.updateMethods = ['update'];
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

    update(a1?: any, a2?: any, a3?: any, a4?: any, a5?: any, a6?: any, a7?: any, a8?: any, a9?: any): void {
        for (let i = 0, method; (method = this.updateMethods[i]); i++) {
            this.callMethodOnSystems(method, a1, a2, a3, a4, a5, a6, a7, a8, a9);
        }
    }
}
