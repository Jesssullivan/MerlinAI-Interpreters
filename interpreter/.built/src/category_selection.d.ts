declare const React: any;
export declare class CategorySelection extends React.Component {
    constructor(props: null);
    componentDidMount(): void;
    componentWillUnmount(): void;
    componentDidUpdate(): void;
    onCancel(): void;
    onSelect(e: {
        target: {
            dataset: {
                idx: string;
            };
        };
    }): void;
    onSelectNone(): void;
    filterData(e: {
        preventDefault: () => void;
        target: {
            value: string | RegExp;
        };
    }): void;
    onKeyDown(e: {
        key: string;
    }): void;
    render(): any;
}
export {};
