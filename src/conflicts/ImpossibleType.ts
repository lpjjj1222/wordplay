import Conflict from './Conflict';
import type Type from '../nodes/Type';
import type Is from '../nodes/Is';
import type Translation from '../translation/Translation';

export class ImpossibleType extends Conflict {
    readonly is: Is;
    readonly givenType: Type;

    constructor(is: Is, givenType: Type) {
        super(false);
        this.is = is;
        this.givenType = givenType;
    }

    getConflictingNodes() {
        return {
            primary: {
                node: this.is.expression,
                explanation: (translation: Translation) =>
                    translation.conflict.ImpossibleType.primary,
            },
        };
    }
}
