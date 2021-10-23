export interface Component {
    init?(...args: any[]): void;
    remove?(): void;
}

export interface CurblComponent extends Component {
    readonly __id: string;
    readonly __bit: number;
}
