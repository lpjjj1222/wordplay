import type Reference from '../nodes/Reference';
import type Translation from '../translation/Translation';
import Conflict from './Conflict';

export class UnexpectedTypeVariable extends Conflict {
    readonly name: Reference;

    constructor(name: Reference) {
        super(false);
        this.name = name;
    }

    getConflictingNodes() {
        return {
            primary: {
                node: this.name,
                explanation: (translation: Translation) =>
                    translation.conflict.UnexpectedTypeVariable.primary,
            },
        };
    }
}
