import type Translation from '../translations/Translation';
import type Evaluator from './Evaluator';
import Exception from './Exception';
import type Expression from '../nodes/Expression';
import NodeLink from '../translations/NodeLink';
import type Token from '../nodes/Token';

export default class UnimplementedException extends Exception {
    readonly placeholder: Expression | Token;
    constructor(evaluator: Evaluator, placeholder: Expression | Token) {
        super(evaluator);
        this.placeholder = placeholder;
    }

    getDescription(translation: Translation) {
        return translation.exceptions.placeholder(
            new NodeLink(
                this.placeholder,
                translation,
                this.getNodeContext(this.placeholder)
            )
        );
    }
}
