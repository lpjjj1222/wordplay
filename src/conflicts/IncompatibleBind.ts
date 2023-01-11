import type Context from '../nodes/Context';
import type Expression from '../nodes/Expression';
import type Type from '../nodes/Type';
import NodeLink from '../translation/NodeLink';
import type Translation from '../translation/Translation';
import Conflict from './Conflict';

export default class IncompatibleBind extends Conflict {
    readonly expectedType: Type;
    readonly value: Expression;
    readonly givenType: Type;

    constructor(expectedType: Type, value: Expression, givenType: Type) {
        super(false);

        this.expectedType = expectedType;
        this.value = value;
        this.givenType = givenType;
    }

    getConflictingNodes() {
        return {
            primary: {
                node: this.value,
                explanation: (translation: Translation, context: Context) =>
                    translation.conflict.IncompatibleBind.primary(
                        new NodeLink(this.expectedType, translation, context)
                    ),
            },
            secondary: {
                node: this.expectedType,
                explanation: (translation: Translation, context: Context) =>
                    translation.conflict.IncompatibleBind.secondary(
                        new NodeLink(this.givenType, translation, context)
                    ),
            },
        };
    }
}
